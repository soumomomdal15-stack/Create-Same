/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, UserBalance, Task, Withdrawal, ReferralRelationship, Transaction, AppNotification, OfferwallConfig, AdConfig, AppSettings, PayoutMethod, KYCStatus, PromoCode } from '../types';
import { DEFAULT_APP_SETTINGS, DEFAULT_AD_CONFIG, INITIAL_OFFERW_CONFIG, INITIAL_NOTIFICATIONS, INITIAL_TASKS } from './data';
import { isFirebaseConfigured, db, collection, getDocs, setDoc, doc, deleteDoc, initFirebasePromise, terminateFirestore } from './firebase';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

// Helper to get random fingerprint for simulation
export const generateFingerprint = () => {
  return 'device_hash_' + Math.floor(100000 + Math.random() * 900000);
};

export class CampaignStore {
  // Current session
  static currentUser: User | null = null;
  static isAdminAuthenticated: boolean = false;

  // Databases
  static users: User[] = [];
  static tasks: Task[] = [];
  static withdrawals: Withdrawal[] = [];
  static referrals: ReferralRelationship[] = [];
  static transactions: Transaction[] = [];
  static notifications: AppNotification[] = [];
  static offerwalls: OfferwallConfig[] = [];
  static promoCodes: PromoCode[] = [];
  static taskCompletions: any[] = [];
  static heavyImagesCache: Map<string, string> = new Map<string, string>();

  static restoreHeavyImages(completions: any[]): any[] {
    if (!Array.isArray(completions)) return [];
    return completions.map(tc => {
      if (tc && tc.id && tc.screenshotURL === "placeholder_heavy_base64") {
        const cached = this.heavyImagesCache.get(tc.id);
        if (cached) {
          return { ...tc, screenshotURL: cached };
        }
      }
      return tc;
    });
  }
  static adConfig: AdConfig = DEFAULT_AD_CONFIG;
  static settings: AppSettings = DEFAULT_APP_SETTINGS;
  static lastSavedState: { [key: string]: string } = {};
  static isFirestoreQuotaExceeded: boolean = false;
  static deletedIds: Set<string> = new Set<string>();
  static pendingSavedIds: Set<string> = new Set<string>();
  static lastSyncTimestamp: number = 0;
  static syncPromiseInProgress: Promise<void> | null = null;

  // SSE Real-time Updates
  static sseSource: EventSource | null = null;
  static changeListeners: Set<() => void> = new Set<() => void>();

  static addChangeListener(listener: () => void) {
    this.changeListeners.add(listener);
    this.startSSE();
  }

  static removeChangeListener(listener: () => void) {
    this.changeListeners.delete(listener);
  }

  static stopSSE() {
    if (this.sseSource) {
      this.sseSource.close();
      this.sseSource = null;
    }
  }

  static startSSE() {
    if (this.sseSource) return;

    try {
      this.sseSource = new EventSource('/api/db/events');
      
      const handleEvent = async () => {
        console.log('[SSE] Database updated event received. Fetching latest data...');
        await this.syncWithServer();
        this.changeListeners.forEach(listener => {
          try {
            listener();
          } catch (e) {
            console.error('[SSE] Real-time change listener failure:', e);
          }
        });
      };

      this.sseSource.addEventListener('database_updated', handleEvent);
      
      this.sseSource.addEventListener('open', () => {
        console.log('[SSE] Connection to real-time events established.');
        this.changeListeners.forEach(listener => {
          try {
            listener();
          } catch (e) {
            console.error('[SSE] Real-time change listener failure:', e);
          }
        });
      });

      this.sseSource.onerror = (err) => {
        console.warn('[SSE] EventSource connection warning (browser will auto-reconnect):', err);
      };
    } catch (e) {
      console.warn('[SSE] EventSource initialization failed:', e);
    }
  }

  static loadPendingSavedIds() {
    try {
      const saved = localStorage.getItem('cp_pending_saved_ids');
      if (saved) {
        this.pendingSavedIds = new Set(JSON.parse(saved));
      }
    } catch (e) {
      this.pendingSavedIds = new Set<string>();
    }
  }

  static savePendingSavedIds() {
    try {
      localStorage.setItem('cp_pending_saved_ids', JSON.stringify(Array.from(this.pendingSavedIds)));
    } catch (e) {}
  }

  static addPendingSavedId(id: string) {
    this.pendingSavedIds.add(id);
    this.savePendingSavedIds();
  }

  static removePendingSavedId(id: string) {
    this.pendingSavedIds.delete(id);
    this.savePendingSavedIds();
  }

  static get useFirestore() {
    // Rely exclusively on the central backend API server for data synchronization.
    // This resolves the local/cloud routing race condition, avoids exhausting the
    // free-tier Firestore write/read quota, and guarantees that every client sees
    // admin task additions and other users' completions in real-time.
    return false;
  }

  static isQuotaError(err: any): boolean {
    if (!err) return false;
    const errMsg = String(err.message || err).toLowerCase();
    const errCode = String(err.code !== undefined ? err.code : '').toLowerCase();
    return (
      errCode === 'resource-exhausted' ||
      errCode === 'resource_exhausted' ||
      errCode === '8' ||
      errCode.includes('quota') ||
      errMsg.includes('quota') ||
      errMsg.includes('exhausted') ||
      errMsg.includes('billing') ||
      errMsg.includes('limit exceeded') ||
      errMsg.includes('resource_exhausted')
    );
  }

  static handleQuotaExceededException() {
    if (!this.isFirestoreQuotaExceeded) {
      this.isFirestoreQuotaExceeded = true;
      try {
        sessionStorage.setItem('fs_quota_exceeded', 'true');
        localStorage.setItem('fs_quota_exceeded', 'true');
        // Notify server-side as well so it immediately locks and falls back to local DB
        fetch('/api/db/report-quota', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).catch(() => {});
      } catch (e) {}
      console.warn("Firestore write/read quota or storage limits exceeded on free tier. Automatically failing back to internal REST SQLite server database for full-stack data persistence.");
      terminateFirestore();
    }
  }

  // Initialize store of mock database or actual local storage
  static initialize() {
    try {
      this.loadPendingSavedIds();
      try {
        if (sessionStorage.getItem('fs_quota_exceeded') === 'true' || localStorage.getItem('fs_quota_exceeded') === 'true') {
          this.isFirestoreQuotaExceeded = true;
          console.warn("Firestore quota limit previously met/exceeded. Using SQLite/JSON REST server fallback as the persistent database.");
          terminateFirestore();
        }
      } catch (f) {}

      const delIdsString = localStorage.getItem('cp_deleted_ids');
      this.deletedIds = new Set<string>(delIdsString ? JSON.parse(delIdsString) : []);

      this.users = JSON.parse(localStorage.getItem('cp_users') || '[]');
      this.tasks = JSON.parse(localStorage.getItem('cp_tasks') || '[]').filter((t: any) => t && t.id && !this.deletedIds.has(String(t.id).trim()));
      this.withdrawals = JSON.parse(localStorage.getItem('cp_withdrawals') || '[]');
      this.referrals = JSON.parse(localStorage.getItem('cp_referrals') || '[]');
      this.transactions = JSON.parse(localStorage.getItem('cp_transactions') || '[]');
      this.notifications = JSON.parse(localStorage.getItem('cp_notifications') || '[]').filter((n: any) => n && n.id && !this.deletedIds.has(String(n.id).trim()));
      // Remove any hardcoded seed offerwall IDs that were auto-seeded previously
      const SEED_OFFERWALL_IDS = new Set(["cpx", "adgate", "offertoro", "lootably", "adgem", "ayet"]);
      this.offerwalls = JSON.parse(localStorage.getItem('cp_offerwalls') || '[]').filter(
        (o: any) => o && o.id && !this.deletedIds.has(String(o.id).trim()) && !SEED_OFFERWALL_IDS.has(String(o.id))
      );
      localStorage.setItem('cp_offerwalls', JSON.stringify(this.offerwalls));
      this.promoCodes = JSON.parse(localStorage.getItem('cp_promocodes') || '[]').filter((p: any) => p && p.id && !this.deletedIds.has(String(p.id).trim()));
      this.taskCompletions = this.restoreHeavyImages(JSON.parse(localStorage.getItem('cp_task_completions') || '[]')).filter((tc: any) => tc && tc.id && !this.deletedIds.has(String(tc.id).trim()));
      
      const s = localStorage.getItem('cp_settings');
      this.settings = s ? JSON.parse(s) : DEFAULT_APP_SETTINGS;
      if (this.settings.minWithdrawal === 100) {
        this.settings.minWithdrawal = 25;
        this.saveSettings();
      }

      const a = localStorage.getItem('cp_ads');
      this.adConfig = a ? JSON.parse(a) : DEFAULT_AD_CONFIG;

      const savedUser = localStorage.getItem('cp_current_user');
      this.currentUser = savedUser ? JSON.parse(savedUser) : null;
      if (this.currentUser) {
        if (this.checkAndResetTodayEarnings(this.currentUser)) {
          this.saveSession();
        }
      }
      
      const savedAdmin = localStorage.getItem('cp_admin_auth');
      this.isAdminAuthenticated = savedAdmin === 'true';

      // Seed if empty and never seeded before to prevent resurrecting deleted lists
      const hasSeeded = localStorage.getItem('cp_seeded') === 'true';
      if (!hasSeeded) {
        if (this.tasks.length === 0) {
          this.tasks = [...INITIAL_TASKS];
          localStorage.setItem('cp_tasks', JSON.stringify(this.tasks));
        }
        if (this.notifications.length === 0) {
          this.notifications = [...INITIAL_NOTIFICATIONS];
          localStorage.setItem('cp_notifications', JSON.stringify(this.notifications));
        }
        localStorage.setItem('cp_seeded', 'true');
      }
      
      // Ensure there are some mock withdrawals and completed tasks for admin viewing
      if (this.withdrawals.length === 0) {
        this.withdrawals = [
          {
            id: "wd_mock1",
            userId: "uid_rahul",
            userEmail: "rahul.sharma@gmail.com",
            paymentMethod: "upi",
            paymentDetails: "rahul@okaxis",
            amount: 250,
            status: "pending",
            requestedAt: new Date(Date.now() - 10000000).toISOString()
          },
          {
            id: "wd_mock2",
            userId: "uid_amit",
            userEmail: "amit.verma9@gmail.com",
            paymentMethod: "paytm",
            paymentDetails: "9876543210@paytm",
            amount: 400,
            status: "approved",
            requestedAt: new Date(Date.now() - 80000000).toISOString(),
            processedAt: new Date(Date.now() - 70000000).toISOString(),
            paymentProofURL: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=300&q=80"
          }
        ];
        this.saveWithdrawals();
      }

      // Trigger asynchronous real-time server database synchronization
      this.syncWithServer();

      // Start Server-Sent Events real-time database listener
      this.startSSE();

    } catch (e) {
      console.error('CampaignStore Fail: Failed to initialize Storage.', e);
    }
  }

  static recalculateUserBalances(userId: string, txs: Transaction[]): UserBalance {
    const userTxs = txs.filter(t => t && t.userId === userId);
    let main = 0;
    let bonus = 0;
    let referral = 0;
    let totalEarnings = 0;
    
    userTxs.forEach(t => {
      const amt = t.amount;
      if (t.type === 'daily_bonus') {
        bonus += amt;
        if (amt > 0) totalEarnings += amt;
      } else if (t.type === 'referral') {
        referral += amt;
        if (amt > 0) totalEarnings += amt;
      } else if (t.type === 'promo_code' && t.description && t.description.toLowerCase().includes('(bonus)')) {
        bonus += amt;
        if (amt > 0) totalEarnings += amt;
      } else if (t.type === 'promo_code' && t.description && t.description.toLowerCase().includes('(referral)')) {
        referral += amt;
        if (amt > 0) totalEarnings += amt;
      } else if (t.type === 'withdraw_approve') {
        // Deduction happened during withdraw_pending, so approval has no balance change.
      } else {
        main += amt;
        if (amt > 0) totalEarnings += amt;
      }
    });

    const todayStr = new Date().toDateString();
    const todayEarnings = userTxs
      .filter(t => t.amount > 0 && t.type !== 'withdraw_approve' && t.type !== 'withdraw_refund' && t.type !== 'withdraw_pending' && new Date(t.timestamp).toDateString() === todayStr)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      main: Math.max(0, main),
      bonus: Math.max(0, bonus),
      referral: Math.max(0, referral),
      todayEarnings,
      totalEarnings,
      lastEarningDate: todayStr
    };
  }

  static checkAndResetTodayEarnings(user: any): boolean {
    if (!user || !user.balances) return false;
    const todayStr = new Date().toDateString();
    let changed = false;
    if (!user.balances.lastEarningDate) {
      user.balances.lastEarningDate = todayStr;
      changed = true;
    } else if (user.balances.lastEarningDate !== todayStr) {
      user.balances.todayEarnings = 0;
      user.balances.lastEarningDate = todayStr;
      changed = true;
    }
    return changed;
  }

  // Helper with automatic merge support to prevent overwriting other users
  static async saveRESTAll() {
    try {
      const payload: any = {};
      if (this.isAdminAuthenticated) {
        payload.users = this.users;
        payload.tasks = this.tasks;
        payload.withdrawals = this.withdrawals;
        payload.referrals = this.referrals;
        payload.transactions = this.transactions;
        payload.notifications = this.notifications;
        payload.offerwalls = this.offerwalls;
        payload.promoCodes = this.promoCodes;
        payload.settings = this.settings;
        payload.adConfig = this.adConfig;
        payload.taskCompletions = this.taskCompletions;
      } else {
        // Standard non-admin client: only sync user-specific data that belongs to them
        const myUid = this.currentUser?.uid;
        payload.users = Array.isArray(this.users) ? this.users.filter(u => u && u.uid === myUid) : [];
        payload.withdrawals = Array.isArray(this.withdrawals) ? this.withdrawals.filter(w => w && w.userId === myUid) : [];
        payload.referrals = Array.isArray(this.referrals) ? this.referrals.filter(r => r && (r.referrerId === myUid || r.refereeId === myUid)) : [];
        payload.transactions = Array.isArray(this.transactions) ? this.transactions.filter(t => t && t.userId === myUid) : [];
        payload.taskCompletions = Array.isArray(this.taskCompletions) ? this.taskCompletions.filter(tc => tc && tc.userId === myUid) : [];
        payload.promoCodes = this.promoCodes;
      }

      const headers: any = { 'Content-Type': 'application/json' };
      if (this.isAdminAuthenticated) {
        headers['x-admin-auth'] = 'true';
      }

      await fetch('/api/db/save', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn("Background save REST server temporarily offline:", err);
    }
  }

  static async syncWithServer(callback?: () => void) {
    if (this.syncPromiseInProgress) {
      try {
        await this.syncPromiseInProgress;
      } catch (_) {}
      if (callback) callback();
      return;
    }

    const now = Date.now();
    if (now - this.lastSyncTimestamp < 5000) {
      if (callback) callback();
      return;
    }

    this.lastSyncTimestamp = now;

    let resolvePromise: any;
    this.syncPromiseInProgress = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    try {
      // Wait for async Firebase initialization check to finish so we are completely deterministic
      if (initFirebasePromise) {
        await initFirebasePromise;
      }

      // 0. Preemptively check server side if quota is exceeded before hitting Firestore
      try {
        const sRes = await fetch('/api/db/get');
        if (sRes.ok) {
          const sDb = await sRes.json();
          if (sDb && sDb.isFirestoreQuotaExceededServer) {
            this.handleQuotaExceededException();
          }
        }
      } catch (err) {
        console.warn("Pre-sync server quota check offline:", err);
      }

      // Pull latest from localStorage first to capture dynamic local UI actions
      this.users = JSON.parse(localStorage.getItem('cp_users') || '[]');
      this.tasks = JSON.parse(localStorage.getItem('cp_tasks') || '[]');
      this.withdrawals = JSON.parse(localStorage.getItem('cp_withdrawals') || '[]');
      this.referrals = JSON.parse(localStorage.getItem('cp_referrals') || '[]');
      this.transactions = JSON.parse(localStorage.getItem('cp_transactions') || '[]');
      this.notifications = JSON.parse(localStorage.getItem('cp_notifications') || '[]');
      this.offerwalls = JSON.parse(localStorage.getItem('cp_offerwalls') || '[]');
      this.promoCodes = JSON.parse(localStorage.getItem('cp_promocodes') || '[]');
      this.taskCompletions = this.restoreHeavyImages(JSON.parse(localStorage.getItem('cp_task_completions') || '[]'));

      let cloudDb: any = {};
      let usedFirestore = false;

      if (this.useFirestore) {
        // Fetch collections progressively/sequentially from Firestore database to abort fast if quota is hit
        const collections = ["users", "tasks", "withdrawals", "referrals", "transactions", "notifications", "offerwalls", "promoCodes", "taskCompletions", "deletedIds"];
        const keyMap: { [key: string]: string } = { users: 'uid' };
        let quotaDetected = false;
        
        const getDocsWithTimeout = (q: any, timeoutMs: number = 2000): Promise<any> => {
          return Promise.race([
            getDocs(q),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore operation timed out")), timeoutMs))
          ]);
        };

        for (const colName of collections) {
          try {
            if (quotaDetected || !this.useFirestore) break;
            const snap = await getDocsWithTimeout(collection(db, colName), 2000);
            cloudDb[colName] = snap.docs.map(docSnap => {
              const item = { ...docSnap.data() };
              const keyName = keyMap[colName] || 'id';
              if (item && item[keyName]) {
                this.lastSavedState[`${colName}_${item[keyName]}`] = JSON.stringify(item);
              }
              return item;
            });
          } catch (e: any) {
            console.warn(`Firestore read warning info on ${colName}:`, e.message || e);
            if (this.isQuotaError(e)) {
              quotaDetected = true;
              this.handleQuotaExceededException();
              break;
            } else if (e.message === "Firestore operation timed out" || String(e).toLowerCase().includes("timeout")) {
              console.warn(`Firestore sync warning: query for ${colName} timed out. Bypassing direct firestore fetch, falling back to REST server.`);
              quotaDetected = true; // Stop direct fetches in this iteration to speed up sync but don't call handleQuotaExceededException
              break;
            }
          }
        }

        // Fetch settings and adConfig config documents
        if (!quotaDetected && this.useFirestore) {
          try {
            const settingsSnap = await getDocs(collection(db, "settings"));
            if (!settingsSnap.empty) {
              const data = settingsSnap.docs[0].data();
              cloudDb.settings = data;
              this.lastSavedState[`settings_global_config`] = JSON.stringify(data);
            }
            const adSnap = await getDocs(collection(db, "adConfig"));
            if (!adSnap.empty) {
              const data = adSnap.docs[0].data();
              cloudDb.adConfig = data;
              this.lastSavedState[`adConfig_global_config`] = JSON.stringify(data);
            }
          } catch (e: any) {
            console.warn("Firestore configurations read warning:", e.message || e);
            if (this.isQuotaError(e)) {
              quotaDetected = true;
              this.handleQuotaExceededException();
            }
          }
        }

        if (!quotaDetected && this.useFirestore) {
          // --- SYNC SERVER-SIDE POSTBACK WEBHOOKS TO FIRESTORE ---
          try {
            const sRes = await fetch('/api/db/get');
            if (sRes.ok) {
              const serverDb = await sRes.json();
              if (serverDb && Array.isArray(serverDb.transactions)) {
                const serverPbTxes = serverDb.transactions.filter((tx: any) => tx && tx.id && tx.id.startsWith("tx_pb_"));
                
                serverPbTxes.forEach((sTx: any) => {
                  const fsTxExists = cloudDb.transactions?.some((fTx: any) => fTx.id === sTx.id);
                  if (!fsTxExists) {
                    console.log(`[SYNC POSTBACK] Found unsynced server-side postback transaction:`, sTx.id);
                    
                    // Add transaction to cloudDb
                    if (!cloudDb.transactions) cloudDb.transactions = [];
                    cloudDb.transactions.push(sTx);

                    // Sync corresponding completed task entry
                    if (Array.isArray(serverDb.taskCompletions)) {
                      serverDb.taskCompletions.forEach((sTc: any) => {
                        if (sTc && sTc.userId === sTx.userId && sTc.rewardAmount === sTx.amount) {
                          const fsTcExists = cloudDb.taskCompletions?.some((fTc: any) => fTc.id === sTc.id || (fTc.userId === sTc.userId && fTc.taskId === sTc.taskId));
                          if (!fsTcExists) {
                            if (!cloudDb.taskCompletions) cloudDb.taskCompletions = [];
                            cloudDb.taskCompletions.push(sTc);
                          }
                        }
                      });
                    }

                    // Credit the target user's balance in cloudDb
                    if (Array.isArray(cloudDb.users)) {
                      const matchedUser = cloudDb.users.find((u: any) => u.uid === sTx.userId);
                      if (matchedUser) {
                        if (!matchedUser.balances) {
                          matchedUser.balances = { main: 0, bonus: 0, referral: 0, todayEarnings: 0, totalEarnings: 0 };
                        }
                        this.checkAndResetTodayEarnings(matchedUser);
                        matchedUser.balances.main += sTx.amount;
                        matchedUser.balances.todayEarnings += sTx.amount;
                        matchedUser.balances.totalEarnings += sTx.amount;
                        console.log(`[SYNC POSTBACK] Credited +₹${sTx.amount} to:`, matchedUser.email);
                      }
                    }
                  }
                });
              }
            }
          } catch (syncErr) {
            console.warn("Could not synchronize server-side postbacks with Firestore:", syncErr);
          }

          usedFirestore = true;
        }
      }

      if (!usedFirestore) {
        // Fallback to SQLite/JSON Server proxy database
        const res = await fetch('/api/db/get');
        if (res.ok) {
          cloudDb = await res.json();
          if (cloudDb && cloudDb.isFirestoreQuotaExceededServer) {
            this.handleQuotaExceededException();
          }
        }
      }

      const getSafeTime = (item: any) => {
        if (!item) return 0;
        const dateStr = item.processedAt || item.updatedAt || item.createdAt || item.requestedAt || item.timestamp || item.completedAt;
        if (!dateStr) return 0;
        const t = new Date(dateStr).getTime();
        return isNaN(t) ? 0 : t;
      };

      const mergeList = (local: any[], cloud: any[], keyName: string = 'id') => {
        const mergedMap = new Map();
        
        // Load local first. Local changes represent active immediate UI actions.
        if (Array.isArray(local)) {
          local.forEach(item => {
            if (item && item[keyName]) {
              if (this.deletedIds.has(String(item[keyName]).trim())) return;
              mergedMap.set(item[keyName], { ...item });
            }
          });
        }
        
        // Merge cloud on top. Intelligently preserve statuses representing progress & admin actions
        if (Array.isArray(cloud)) {
          cloud.forEach(item => {
            if (item && item[keyName]) {
              if (this.deletedIds.has(String(item[keyName]).trim())) return;
              const locItem = mergedMap.get(item[keyName]);
              if (locItem) {
                // Keep the progress status
                let finalStatus = locItem.status || item.status;
                if (locItem.status === 'pending' && (item.status === 'completed' || item.status === 'rejected' || item.status === 'approved')) {
                  finalStatus = item.status;
                } else if ((locItem.status === 'completed' || locItem.status === 'rejected' || locItem.status === 'approved') && item.status === 'pending') {
                  finalStatus = locItem.status;
                }

                let finalKycStatus = locItem.kycStatus || item.kycStatus;
                if (locItem.kycStatus === 'Pending' && (item.kycStatus === 'Approved' || item.kycStatus === 'Rejected')) {
                  finalKycStatus = item.kycStatus;
                } else if ((locItem.kycStatus === 'Approved' || locItem.kycStatus === 'Rejected') && item.kycStatus === 'Pending') {
                  finalKycStatus = locItem.kycStatus;
                }

                let finalIsBanned = locItem.isBanned || item.isBanned;
                if (!locItem.isBanned && item.isBanned) {
                  finalIsBanned = true;
                } else if (locItem.isBanned && !item.isBanned) {
                  finalIsBanned = locItem.isBanned;
                }

                const localTime = getSafeTime(locItem);
                const cloudTime = getSafeTime(item);
                
                let mergedItem;
                if (localTime >= cloudTime) {
                  // Local is newer or same, keep local fields but merge cloud fields that are missing in local
                  mergedItem = { ...item, ...locItem };
                  if (locItem.screenshotURL === "placeholder_heavy_base64" && item.screenshotURL && item.screenshotURL !== "placeholder_heavy_base64") {
                    mergedItem.screenshotURL = item.screenshotURL;
                  }
                } else {
                  // Cloud is newer, use cloud fields
                  mergedItem = { ...locItem, ...item };
                  if (item.screenshotURL === "placeholder_heavy_base64" && locItem.screenshotURL && locItem.screenshotURL !== "placeholder_heavy_base64") {
                    mergedItem.screenshotURL = locItem.screenshotURL;
                  }
                }

                if (finalStatus) mergedItem.status = finalStatus;
                if (finalKycStatus) mergedItem.kycStatus = finalKycStatus;
                if (finalIsBanned !== undefined) mergedItem.isBanned = finalIsBanned;
                
                mergedMap.set(item[keyName], mergedItem);
              } else {
                mergedMap.set(item[keyName], { ...item });
              }
            }
          });
        }
        
        return Array.from(mergedMap.values());
      };

      const mergeAdminList = (local: any[], cloud: any[], keyName: string = 'id') => {
        const mergedMap = new Map();
        
        // Load cloud first as baseline
        if (Array.isArray(cloud)) {
          cloud.forEach(item => {
            if (item && item[keyName]) {
              if (this.deletedIds.has(String(item[keyName]).trim())) return;
              mergedMap.set(item[keyName], { ...item });
            }
          });
        }
        
        // Load local on top, respecting pendingSavedIds to prevent race conditions or overwriting cloud-side edits
        if (Array.isArray(local)) {
          local.forEach(item => {
            if (item && item[keyName]) {
              const idStr = String(item[keyName]).trim();
              if (this.deletedIds.has(idStr)) return;
              
              const isPending = this.pendingSavedIds.has(idStr);
              const cloudItem = mergedMap.get(item[keyName]);
              
              if (!cloudItem) {
                // Local-only item. Keep it to prevent data loss unless explicitly deleted (checked via deletedIds above)
                mergedMap.set(item[keyName], { ...item });
              } else {
                // Item exists in both cloud and local.
                const localTime = getSafeTime(item);
                const cloudTime = getSafeTime(cloudItem);
                
                if (isPending || localTime >= cloudTime) {
                  // Local edit or newer local timestamp has absolute priority
                  mergedMap.set(item[keyName], { ...cloudItem, ...item });
                } else {
                  // Cloud version has absolute priority
                  mergedMap.set(item[keyName], { ...item, ...cloudItem });
                }
              }
            }
          });
        }
        
        return Array.from(mergedMap.values());
      };

      // Process deletedIds from cloudDb first to ensure they are omitted from all Lists
      if (Array.isArray(cloudDb.deletedIds)) {
        cloudDb.deletedIds.forEach((item: any) => {
          if (!item) return;
          const id = typeof item === 'string' ? item : (item.id || item.docId);
          if (id) {
            this.deletedIds.add(String(id).trim());
          }
        });

        localStorage.setItem('cp_deleted_ids', JSON.stringify(Array.from(this.deletedIds)));
      }

      // Dynamically filter all local lists if they have items in deletedIds
      if (this.deletedIds.size > 0) {
        const listKeys = ["tasks", "withdrawals", "referrals", "transactions", "notifications", "offerwalls", "promoCodes", "taskCompletions"];
        const storageKeys: { [key: string]: string } = {
          tasks: 'cp_tasks',
          withdrawals: 'cp_withdrawals',
          referrals: 'cp_referrals',
          transactions: 'cp_transactions',
          notifications: 'cp_notifications',
          offerwalls: 'cp_offerwalls',
          promoCodes: 'cp_promocodes',
          taskCompletions: 'cp_task_completions'
        };
        listKeys.forEach((key) => {
          const typedThis = this as any;
          if (Array.isArray(typedThis[key])) {
            const filtered = typedThis[key].filter((item: any) => item && item.id && !this.deletedIds.has(String(item.id).trim()));
            if (filtered.length !== typedThis[key].length) {
              typedThis[key] = filtered;
              const lsKey = storageKeys[key];
              if (lsKey) {
                localStorage.setItem(lsKey, JSON.stringify(filtered));
              }
            }
          }
        });
      }

      if (Array.isArray(cloudDb.transactions)) {
        this.transactions = mergeList(this.transactions, cloudDb.transactions, 'id');
        localStorage.setItem('cp_transactions', JSON.stringify(this.transactions));
      }

      if (Array.isArray(cloudDb.users)) {
        this.users = mergeList(this.users, cloudDb.users, 'uid');
        
        // Recalculate users' balances from the merged transactions list to be absolutely bulletproof!
        this.users = this.users.map(u => {
          if (!u) return u;
          const recalculated = this.recalculateUserBalances(u.uid, this.transactions);
          return {
            ...u,
            balances: recalculated
          };
        });

        localStorage.setItem('cp_users', JSON.stringify(this.users));
      }
      const dbIsUninitialized = !cloudDb.settings;

      if (Array.isArray(cloudDb.tasks)) {
        if (!this.isAdminAuthenticated) {
          // Standard non-admin users always treat central cloud list as absolute source of truth
          // BUT only if tasks are non-empty to prevent clearing out local state in transit!
          if (cloudDb.tasks.length > 0) {
            this.tasks = cloudDb.tasks.filter((t: any) => t && t.id && !this.deletedIds.has(String(t.id).trim()));
            localStorage.setItem('cp_tasks', JSON.stringify(this.tasks));
          }
        } else {
          const localActiveTasks = this.tasks.filter((t: any) => t && t.id && !this.deletedIds.has(String(t.id).trim()));
          if (dbIsUninitialized && localActiveTasks.length > 0) {
            this.tasks = localActiveTasks;
            localStorage.setItem('cp_tasks', JSON.stringify(this.tasks));
            this.pushTableToServer('tasks', this.tasks);
          } else {
            const merged = mergeAdminList(this.tasks, cloudDb.tasks, 'id');
            const hasDiscrepancy = merged.some((m: any) => {
              const c = cloudDb.tasks.find((x: any) => x.id === m.id);
              if (!c) return true;
              return JSON.stringify(m) !== JSON.stringify(c);
            });
            this.tasks = merged;
            localStorage.setItem('cp_tasks', JSON.stringify(this.tasks));
            if (hasDiscrepancy) {
              console.log("[SYNC-AUTO-HEAL] Restoring missing/modified admin tasks to cloud/server:", merged);
              this.pushTableToServer('tasks', this.tasks);
            }
          }
        }
      }
      if (Array.isArray(cloudDb.withdrawals)) {
        this.withdrawals = mergeList(this.withdrawals, cloudDb.withdrawals, 'id');
        localStorage.setItem('cp_withdrawals', JSON.stringify(this.withdrawals));
      }
      if (Array.isArray(cloudDb.referrals)) {
        this.referrals = mergeList(this.referrals, cloudDb.referrals, 'id');
        localStorage.setItem('cp_referrals', JSON.stringify(this.referrals));
      }
      // Already merged transactions before users to enable robust balance recalculation
      if (Array.isArray(cloudDb.notifications)) {
        if (!this.isAdminAuthenticated) {
          // Standard non-admin users always treat central cloud list as absolute source of truth
          // BUT only if notifications are non-empty to prevent clearing out local state in transit!
          if (cloudDb.notifications.length > 0) {
            this.notifications = cloudDb.notifications.filter((n: any) => n && n.id && !this.deletedIds.has(String(n.id).trim()));
            localStorage.setItem('cp_notifications', JSON.stringify(this.notifications));
          }
        } else {
          const localActiveNotifications = this.notifications.filter((n: any) => n && n.id && !this.deletedIds.has(String(n.id).trim()));
          if (dbIsUninitialized && localActiveNotifications.length > 0) {
            this.notifications = localActiveNotifications;
            localStorage.setItem('cp_notifications', JSON.stringify(this.notifications));
            this.pushTableToServer('notifications', this.notifications);
          } else {
            const merged = mergeAdminList(this.notifications, cloudDb.notifications, 'id');
            const hasDiscrepancy = merged.some((m: any) => {
              const c = cloudDb.notifications.find((x: any) => x.id === m.id);
              if (!c) return true;
              return JSON.stringify(m) !== JSON.stringify(c);
            });
            this.notifications = merged;
            localStorage.setItem('cp_notifications', JSON.stringify(this.notifications));
            if (hasDiscrepancy) {
              console.log("[SYNC-AUTO-HEAL] Restoring missing/modified admin notifications to cloud/server:", merged);
              this.pushTableToServer('notifications', this.notifications);
            }
          }
        }
      }
      if (Array.isArray(cloudDb.offerwalls)) {
        if (!this.isAdminAuthenticated) {
          // Standard non-admin users always treat central cloud list as absolute source of truth
          // BUT only if offerwalls are non-empty to prevent clearing out local state in transit!
          if (cloudDb.offerwalls.length > 0) {
            this.offerwalls = cloudDb.offerwalls.filter((o: any) => o && o.id && !this.deletedIds.has(String(o.id).trim()));
            localStorage.setItem('cp_offerwalls', JSON.stringify(this.offerwalls));
          }
        } else {
          const localActiveOfferwalls = this.offerwalls.filter((o: any) => o && o.id && !this.deletedIds.has(String(o.id).trim()));
          if (dbIsUninitialized && localActiveOfferwalls.length > 0) {
            this.offerwalls = localActiveOfferwalls;
            localStorage.setItem('cp_offerwalls', JSON.stringify(this.offerwalls));
            this.pushTableToServer('offerwalls', this.offerwalls);
          } else {
            const merged = mergeAdminList(this.offerwalls, cloudDb.offerwalls, 'id');
            const hasDiscrepancy = merged.some((m: any) => {
              const c = cloudDb.offerwalls.find((x: any) => x.id === m.id);
              if (!c) return true;
              return JSON.stringify(m) !== JSON.stringify(c);
            });
            this.offerwalls = merged;
            localStorage.setItem('cp_offerwalls', JSON.stringify(this.offerwalls));
            if (hasDiscrepancy) {
              console.log("[SYNC-AUTO-HEAL] Restoring missing/modified admin offerwalls to cloud/server:", merged);
              this.pushTableToServer('offerwalls', this.offerwalls);
            }
          }
        }
      }
      if (Array.isArray(cloudDb.promoCodes)) {
        if (!this.isAdminAuthenticated) {
          // Non-admin users always treat central cloud list as absolute source of truth
          if (!dbIsUninitialized || cloudDb.promoCodes.length > 0) {
            this.promoCodes = cloudDb.promoCodes.filter((p: any) => p && p.id && !this.deletedIds.has(String(p.id).trim()));
            localStorage.setItem('cp_promocodes', JSON.stringify(this.promoCodes));
          }
        } else {
          const localActivePromoCodes = this.promoCodes.filter((p: any) => p && p.id && !this.deletedIds.has(String(p.id).trim()));
          if (dbIsUninitialized && localActivePromoCodes.length > 0) {
            this.promoCodes = localActivePromoCodes;
            localStorage.setItem('cp_promocodes', JSON.stringify(this.promoCodes));
            this.pushTableToServer('promoCodes', this.promoCodes);
          } else {
            // Special merge for promo codes:
            // Admin controls structure (code, rewardAmount, maxUses, maxClaimsPerUser).
            // Cloud/server is authoritative for usage stats (claimedBy, useCount) since users update these.
            const cloudMap = new Map<string, any>();
            (cloudDb.promoCodes || []).forEach((p: any) => { if (p?.id) cloudMap.set(p.id, p); });
            const localMap = new Map<string, any>();
            localActivePromoCodes.forEach((p: any) => { if (p?.id) localMap.set(p.id, p); });

            const merged: any[] = [];
            // Base: all cloud items (they carry latest usage stats)
            cloudDb.promoCodes.forEach((cloudP: any) => {
              if (!cloudP?.id || this.deletedIds.has(String(cloudP.id).trim())) return;
              const localP = localMap.get(cloudP.id);
              if (localP) {
                // Merge: local wins for structure fields, cloud wins for usage fields
                merged.push({
                  ...localP,
                  claimedBy: Array.isArray(cloudP.claimedBy) && cloudP.claimedBy.length >= (localP.claimedBy?.length || 0)
                    ? cloudP.claimedBy
                    : (localP.claimedBy || []),
                  useCount: Math.max(cloudP.useCount || 0, localP.useCount || 0),
                });
              } else {
                merged.push({ ...cloudP });
              }
            });
            // Add local-only codes not yet on server
            localActivePromoCodes.forEach((localP: any) => {
              if (!cloudMap.has(localP.id)) merged.push({ ...localP });
            });

            this.promoCodes = merged;
            localStorage.setItem('cp_promocodes', JSON.stringify(this.promoCodes));

            const hasDiscrepancy = merged.some((m: any) => {
              const c = cloudDb.promoCodes.find((x: any) => x.id === m.id);
              if (!c) return true;
              return JSON.stringify(m) !== JSON.stringify(c);
            });
            if (hasDiscrepancy) {
              console.log("[SYNC-AUTO-HEAL] Restoring missing/modified admin promoCodes to cloud/server:", merged);
              this.pushTableToServer('promoCodes', this.promoCodes);
            }
          }
        }
      }
      if (Array.isArray(cloudDb.taskCompletions)) {
        // Intelligently merge to preserve locally submitted fresh proofs before they reach server/cloud
        this.taskCompletions = mergeList(this.taskCompletions, cloudDb.taskCompletions, 'id');
        localStorage.setItem('cp_task_completions', JSON.stringify(this.taskCompletions));
      }

      if (cloudDb.settings) {
        this.settings = cloudDb.settings;
        if (this.settings.minWithdrawal === 100) {
          this.settings.minWithdrawal = 25;
          this.saveSettings();
        } else {
          localStorage.setItem('cp_settings', JSON.stringify(this.settings));
        }
      }
      if (cloudDb.adConfig) {
        this.adConfig = cloudDb.adConfig;
        localStorage.setItem('cp_ads', JSON.stringify(this.adConfig));
      }

      // Check current user session update in case they were modified remotely
      if (this.currentUser) {
        const found = this.users.find(u => u.uid === this.currentUser!.uid);
        if (found) {
          this.currentUser = found;
          localStorage.setItem('cp_current_user', JSON.stringify(found));
        }
      }

      // Re-run dynamic filtering on all loaded tables using updated deletedIds after all cloud lists are processed to prevent resurrection
      if (this.deletedIds.size > 0) {
        const listKeys = ["tasks", "withdrawals", "referrals", "transactions", "notifications", "offerwalls", "promoCodes", "taskCompletions"];
        const storageKeys: { [key: string]: string } = {
          tasks: 'cp_tasks',
          withdrawals: 'cp_withdrawals',
          referrals: 'cp_referrals',
          transactions: 'cp_transactions',
          notifications: 'cp_notifications',
          offerwalls: 'cp_offerwalls',
          promoCodes: 'cp_promocodes',
          taskCompletions: 'cp_task_completions'
        };
        listKeys.forEach((key) => {
          const typedThis = this as any;
          if (Array.isArray(typedThis[key])) {
            const filtered = typedThis[key].filter((item: any) => item && item.id && !this.deletedIds.has(String(item.id).trim()));
            if (filtered.length !== typedThis[key].length) {
              typedThis[key] = filtered;
              const lsKey = storageKeys[key];
              if (lsKey) {
                localStorage.setItem(lsKey, JSON.stringify(filtered));
              }
            }
          }
        });
      }

      // Backward sync to ensure local changes are also persisted back to central cloud
      if (this.useFirestore) {
        // Standard non-admin users should NEVER backward-sync administrative tables to prevent resurrecting deleted or unseeded objects
        const collections = this.isAdminAuthenticated
          ? ["users", "tasks", "withdrawals", "referrals", "transactions", "notifications", "offerwalls", "promoCodes", "taskCompletions"]
          : ["users", "withdrawals", "referrals", "transactions", "taskCompletions", "promoCodes"];

        const keyMap: { [key: string]: string } = { users: 'uid' };
        let quotaDetected = false;
        
        for (const colName of collections) {
          try {
            if (quotaDetected || !this.useFirestore) break;
            const list: any[] = (this as any)[colName] || [];
            const keyName = keyMap[colName] || 'id';
            await Promise.all(list.map(async (item) => {
              if (quotaDetected || !this.useFirestore) return;
              if (item && item[keyName]) {
                // Security check & leakage guard: standard non-admin users can ONLY write their own records
                if (!this.isAdminAuthenticated) {
                  const itemUserId = item.userId || item.uid || item.referrerId || item.refereeId;
                  if (itemUserId && itemUserId !== this.currentUser?.uid) {
                    return; // Avoid writing other users' records!
                  }
                }

                const itemStr = JSON.stringify(item);
                const cacheKey = `${colName}_${item[keyName]}`;
                if (this.lastSavedState[cacheKey] === itemStr) {
                  return; // Skip write! Already up-to-date
                }
                try {
                  await setDoc(doc(db, colName, item[keyName]), item);
                  this.lastSavedState[cacheKey] = itemStr;
                } catch (writeErr: any) {
                  if (this.isQuotaError(writeErr)) {
                    quotaDetected = true;
                    this.handleQuotaExceededException();
                  } else {
                    console.warn(`Firestore setDoc error in ${colName}:`, writeErr.message || writeErr);
                  }
                }
              }
            }));
          } catch (e: any) {
            console.warn(`Firestore save error on ${colName} batch:`, e.message || e);
            if (this.isQuotaError(e)) {
              quotaDetected = true;
              this.handleQuotaExceededException();
              break;
            }
          }
        }

        // Saved global configs as documents in firestore
        if (!quotaDetected && this.useFirestore) {
          try {
            if (this.settings) {
              const itemStr = JSON.stringify(this.settings);
              const cacheKey = `settings_global_config`;
              if (this.lastSavedState[cacheKey] !== itemStr) {
                await setDoc(doc(db, "settings", "global_config"), this.settings);
                this.lastSavedState[cacheKey] = itemStr;
              }
            }
            if (this.adConfig) {
              const itemStr = JSON.stringify(this.adConfig);
              const cacheKey = `adConfig_global_config`;
              if (this.lastSavedState[cacheKey] !== itemStr) {
                await setDoc(doc(db, "adConfig", "global_config"), this.adConfig);
                this.lastSavedState[cacheKey] = itemStr;
              }
            }
          } catch (e: any) {
            console.warn("Firestore configurations save error:", e.message || e);
            if (this.isQuotaError(e)) {
              quotaDetected = true;
              this.handleQuotaExceededException();
            }
          }
        }

        // Always run saveRESTAll() as a redundant real-time mirror so backend postbacks can always find active users/tasks even in Firestore mode!
        await this.saveRESTAll();
      } else {
        await this.saveRESTAll();
      }

      if (callback) callback();
    } catch (e) {
      console.warn("Background db sync temporarily offline:", e);
    } finally {
      this.syncPromiseInProgress = null;
      if (resolvePromise) resolvePromise();
    }
  }

  // Push single table updates asynchronously
  static pushTableToServer(tableName: string, data: any) {
    const adminTables = ["tasks", "notifications", "offerwalls", "settings", "adConfig"];
    if (adminTables.includes(tableName) && !this.isAdminAuthenticated) {
      console.warn(`[SECURITY] Blocked non-admin write to administrative table: ${tableName}`);
      return;
    }

    if (this.useFirestore) {
      const keyField = tableName === 'users' ? 'uid' : 'id';
      if (Array.isArray(data)) {
        Promise.all(data.map(async (item: any) => {
          const docId = item[keyField];
          if (docId) {
            const itemStr = JSON.stringify(item);
            const cacheKey = `${tableName}_${docId}`;
            if (this.lastSavedState[cacheKey] === itemStr) {
              return; // Skip writing unmodified item!
            }
            try {
              await setDoc(doc(db, tableName, docId), item);
              this.lastSavedState[cacheKey] = itemStr;
              this.removePendingSavedId(docId);
            } catch (e: any) {
              console.warn(`Firestore save error for ${tableName}/${docId}:`, e.message || e);
              if (this.isQuotaError(e)) {
                this.handleQuotaExceededException();
                this.pushRESTTable(tableName, data);
              }
            }
          }
        })).catch(err => console.warn(`Firestore save error for ${tableName}:`, err));
      } else if (data) {
        // Single document set check
        const cacheKey = `${tableName}_global_config`;
        const itemStr = JSON.stringify(data);
        if (this.lastSavedState[cacheKey] !== itemStr) {
          setDoc(doc(db, tableName, "global_config"), data)
            .then(() => {
              this.lastSavedState[cacheKey] = itemStr;
            })
            .catch((err: any) => {
              console.warn(`Firestore save configuration error for ${tableName}:`, err.message || err);
              if (this.isQuotaError(err)) {
                this.handleQuotaExceededException();
                this.pushRESTTable(tableName, data);
              }
            });
        }
      }
    }

    // Always push updates to the redundant fallback REST backend server so that the central JSON/SQLite database, 
    // redirects, postback webhooks, and REST fallback clients stay perfectly synchronized in real-time!
    this.pushRESTTable(tableName, data);
  }

  static pushRESTTable(tableName: string, data: any) {
    const adminTables = ["tasks", "notifications", "offerwalls", "settings", "adConfig"];
    if (adminTables.includes(tableName) && !this.isAdminAuthenticated) {
      console.warn(`[SECURITY] Blocked non-admin REST write to administrative table: ${tableName}`);
      return;
    }

    const headers: any = { 'Content-Type': 'application/json' };
    if (this.isAdminAuthenticated) {
      headers['x-admin-auth'] = 'true';
    }

    fetch('/api/db/save', {
      method: 'POST',
      headers,
      body: JSON.stringify({ [tableName]: data })
    }).then(res => {
      if (res.ok) {
        if (Array.isArray(data)) {
          data.forEach(item => {
            const id = item.id || item.uid;
            if (id) {
              this.removePendingSavedId(id);
            }
          });
        }
      }
    }).catch(err => console.warn(`Background save error for ${tableName}:`, err));
  }

  // --- SAVE DBs ---
  static saveUsers() { 
    try {
      localStorage.setItem('cp_users', JSON.stringify(this.users));
    } catch (e) {
      console.warn("[LOCAL STORAGE CRITICAL LIMIT ERROR] Failed to write cp_users to localStorage due to space quota:", e);
    }
    this.pushTableToServer('users', this.users);
  }
  static saveTasks() { 
    try {
      localStorage.setItem('cp_tasks', JSON.stringify(this.tasks)); 
    } catch (e) {
      console.warn("[LOCAL STORAGE CRITICAL LIMIT ERROR] Failed to write cp_tasks to localStorage due to space quota:", e);
    }
    this.pushTableToServer('tasks', this.tasks);
  }
  static saveWithdrawals() { 
    try {
      localStorage.setItem('cp_withdrawals', JSON.stringify(this.withdrawals)); 
    } catch (e) {
      console.warn("[LOCAL STORAGE CRITICAL LIMIT ERROR] Failed to write cp_withdrawals to localStorage due to space quota:", e);
    }
    this.pushTableToServer('withdrawals', this.withdrawals);
  }
  static saveReferrals() { 
    try {
      localStorage.setItem('cp_referrals', JSON.stringify(this.referrals)); 
    } catch (e) {
      console.warn("[LOCAL STORAGE CRITICAL LIMIT ERROR] Failed to write cp_referrals to localStorage:", e);
    }
    this.pushTableToServer('referrals', this.referrals);
  }
  static saveTransactions() { 
    try {
      localStorage.setItem('cp_transactions', JSON.stringify(this.transactions)); 
    } catch (e) {
      console.warn("[LOCAL STORAGE CRITICAL LIMIT ERROR] Failed to write cp_transactions to localStorage:", e);
    }
    this.pushTableToServer('transactions', this.transactions);
  }
  static saveNotifications() { 
    try {
      localStorage.setItem('cp_notifications', JSON.stringify(this.notifications)); 
    } catch (e) {
      console.warn("[LOCAL STORAGE CRITICAL LIMIT ERROR] Failed to write cp_notifications to localStorage:", e);
    }
    this.pushTableToServer('notifications', this.notifications);
  }
  static saveOfferwalls() { 
    try {
      localStorage.setItem('cp_offerwalls', JSON.stringify(this.offerwalls)); 
    } catch (e) {
      console.warn("[LOCAL STORAGE CRITICAL LIMIT ERROR] Failed to write cp_offerwalls to localStorage:", e);
    }
    this.pushTableToServer('offerwalls', this.offerwalls);
  }
  static savePromoCodes() { 
    try {
      localStorage.setItem('cp_promocodes', JSON.stringify(this.promoCodes)); 
    } catch (e) {
      console.warn("[LOCAL STORAGE CRITICAL LIMIT ERROR] Failed to write cp_promocodes to localStorage:", e);
    }
    this.pushTableToServer('promoCodes', this.promoCodes);
  }
  static saveTaskCompletions() {
    try {
      if (Array.isArray(this.taskCompletions)) {
        this.taskCompletions.forEach(tc => {
          if (tc && tc.id && tc.screenshotURL && tc.screenshotURL.startsWith('data:') && tc.screenshotURL.length > 50000) {
            this.heavyImagesCache.set(tc.id, tc.screenshotURL);
          }
        });
      }

      const lightweightCompletions = Array.isArray(this.taskCompletions) ? this.taskCompletions.map(tc => {
        if (tc && tc.screenshotURL && tc.screenshotURL.startsWith('data:') && tc.screenshotURL.length > 50000) {
          return {
            ...tc,
            screenshotURL: "placeholder_heavy_base64"
          };
        }
        return tc;
      }) : [];

      localStorage.setItem('cp_task_completions', JSON.stringify(lightweightCompletions));
    } catch (e) {
      console.warn("[LOCAL STORAGE CRITICAL LIMIT ERROR] Failed to write cp_task_completions to localStorage:", e);
    }
    this.pushTableToServer('taskCompletions', this.taskCompletions);
  }

  static saveMultipleTables(payload: { [key: string]: any }) {
    if (payload.users !== undefined) {
      try {
        localStorage.setItem('cp_users', JSON.stringify(this.users));
      } catch (e) {
        console.warn("[LOCAL STORAGE] Failed to write cp_users:", e);
      }
    }
    if (payload.tasks !== undefined) {
      try {
        localStorage.setItem('cp_tasks', JSON.stringify(this.tasks));
      } catch (e) {
        console.warn("[LOCAL STORAGE] Failed to write cp_tasks:", e);
      }
    }
    if (payload.taskCompletions !== undefined) {
      try {
        if (Array.isArray(this.taskCompletions)) {
          this.taskCompletions.forEach(tc => {
            if (tc && tc.id && tc.screenshotURL && tc.screenshotURL.startsWith('data:') && tc.screenshotURL.length > 50000) {
              this.heavyImagesCache.set(tc.id, tc.screenshotURL);
            }
          });
        }
        const lightweightCompletions = Array.isArray(this.taskCompletions) ? this.taskCompletions.map(tc => {
          if (tc && tc.screenshotURL && tc.screenshotURL.startsWith('data:') && tc.screenshotURL.length > 50000) {
            return {
              ...tc,
              screenshotURL: "placeholder_heavy_base64"
            };
          }
          return tc;
        }) : [];
        localStorage.setItem('cp_task_completions', JSON.stringify(lightweightCompletions));
      } catch (e) {
        console.warn("[LOCAL STORAGE] Failed to write cp_task_completions:", e);
      }
    }
    if (payload.transactions !== undefined) {
      try {
        localStorage.setItem('cp_transactions', JSON.stringify(this.transactions));
      } catch (e) {
        console.warn("[LOCAL STORAGE] Failed to write cp_transactions:", e);
      }
    }
    if (payload.withdrawals !== undefined) {
      try {
        localStorage.setItem('cp_withdrawals', JSON.stringify(this.withdrawals));
      } catch (e) {
        console.warn("[LOCAL STORAGE] Failed to write cp_withdrawals:", e);
      }
    }
    if (payload.notifications !== undefined) {
      try {
        localStorage.setItem('cp_notifications', JSON.stringify(this.notifications));
      } catch (e) {
        console.warn("[LOCAL STORAGE] Failed to write cp_notifications:", e);
      }
    }

    // Push to central REST database server in a single unified atomic API call
    const headers: any = { 'Content-Type': 'application/json' };
    if (this.isAdminAuthenticated) {
      headers['x-admin-auth'] = 'true';
    }

    fetch('/api/db/save', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    }).then(res => {
      if (!res.ok) {
        console.warn("[SYNC] saveMultipleTables failed:", res.statusText);
      } else {
        console.log("[SYNC] saveMultipleTables succeeded in a single network request for keys:", Object.keys(payload));
        // Trigger notification event locally to update UI instantly
        this.changeListeners.forEach(listener => {
          try {
            listener();
          } catch (e) {}
        });
      }
    }).catch(err => {
      console.error("[SYNC] saveMultipleTables error:", err);
    });
  }
  static saveSettings() { 
    try {
      localStorage.setItem('cp_settings', JSON.stringify(this.settings)); 
    } catch (e) {
      console.warn("[LOCAL STORAGE CRITICAL LIMIT ERROR] Failed to write cp_settings to localStorage:", e);
    }
    this.pushTableToServer('settings', this.settings);
  }
  static saveAdConfig() { 
    try {
      localStorage.setItem('cp_ads', JSON.stringify(this.adConfig)); 
    } catch (e) {
      console.warn("[LOCAL STORAGE CRITICAL LIMIT ERROR] Failed to write cp_ads to localStorage:", e);
    }
    this.pushTableToServer('adConfig', this.adConfig);
  }
  static saveSession() {
    if (this.currentUser) {
      try {
        localStorage.setItem('cp_current_user', JSON.stringify(this.currentUser));
      } catch (e) {
        console.warn("[LOCAL STORAGE CRITICAL LIMIT ERROR] Failed to write cp_current_user to localStorage:", e);
      }
      // update user in database list too
      const idx = this.users.findIndex(u => u.uid === this.currentUser!.uid);
      if (idx !== -1) {
        this.users[idx] = this.currentUser;
        this.saveUsers();
      }
    } else {
      localStorage.removeItem('cp_current_user');
    }
  }

  // --- AUTH SERVICES ---
  static registerOrLoginUser(email: string, displayName: string, passwordField: string, referralCodeField?: string, isSignup?: boolean): { success: boolean, message: string, user?: User } {
    // 1. Anti Fake Account Fingerprint check
    const currentFingerprint = localStorage.getItem('cp_fingerprint') || generateFingerprint();
    localStorage.setItem('cp_fingerprint', currentFingerprint);

    let existingUser = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    const pwdClean = passwordField ? passwordField.trim() : "";
    if (!pwdClean) {
      return { success: false, message: "A valid secure password is required." };
    }

    if (existingUser) {
      if (isSignup) {
        return { success: false, message: "❌ Account Limit: This Gmail address is already registered. Please switch to 'Sign In' tab above instead of creating duplicate accounts with the same email." };
      }
      
      if (existingUser.isBanned) {
        return { success: false, message: `Access denied. Your account is banned: ${existingUser.bannedReason || 'Multi-account fraud flag.'}` };
      }
      
      // Password check for existing user
      if (existingUser.password && existingUser.password !== pwdClean) {
        return { success: false, message: "Authentication failed. Incorrect password for this Gmail account." };
      }

      // If user has no password yet (legacy profiles/demo accounts), set it now
      if (!existingUser.password) {
        existingUser.password = pwdClean;
        this.saveUsers();
      }

      // Update IPVPN simulation state check
      existingUser.vpnActive = false; // standard simulator default
      this.currentUser = existingUser;
      this.saveSession();
      return { success: true, message: "Welcome back!", user: existingUser };
    }

    if (!isSignup) {
      return { success: false, message: "❌ Account does not exist. Please click on 'Create Account' tab below to register first." };
    }

    // Check device double signup restriction (Anti Fake Account Detection)
    const duplicateDevice = this.users.find(u => u.deviceFingerprint === currentFingerprint);
    if (duplicateDevice) {
      return { 
        success: false, 
        message: "Cheat Detection: Another account is already registered on this device fingerprint to prevent multiple fake profiles." 
      };
    }

    // Signup sequence
    const generatedCode = 'CP' + Math.floor(100000 + Math.random() * 900000);
    const newUid = 'uid_' + generateId();
    
    let referredByCode: string | undefined = undefined;
    let referrerUser: User | null = null;

    if (referralCodeField && referralCodeField.trim() !== "") {
      const codeClean = referralCodeField.trim().toUpperCase();
      const referrer = this.users.find(u => u.referralCode.toUpperCase() === codeClean);
      if (referrer) {
        referredByCode = codeClean;
        referrerUser = referrer;
      } else {
        return { success: false, message: "Invalid Referral Code entered. Check and try again or join directly!" };
      }
    }

    const newUser: User = {
      uid: newUid,
      email: email,
      displayName: displayName || "Task Earner",
      referralCode: generatedCode,
      referredBy: referredByCode,
      balances: {
        main: 0, // Signup balance strictly set to 0 as requested
        bonus: 0,
        referral: 0,
        todayEarnings: 0,
        totalEarnings: 0
      },
      streakDays: 0,
      userRank: 'Bronze',
      isBanned: false,
      kycStatus: 'None',
      deviceFingerprint: currentFingerprint,
      vipMember: false,
      vpnActive: false,
      password: pwdClean,
      createdAt: new Date().toISOString()
    };

    // Save and add users
    this.users.push(newUser);
    this.saveUsers();
    
    this.currentUser = newUser;
    this.saveSession();

    // Log the signup transaction
    if (referredByCode) {
      this.addTransaction(newUid, 0, 'promo_code', "Account registered securely via referral code");
      
      // Distribute instant referral linkage reports
      if (referrerUser) {
        this.processReferralSignup(referrerUser, newUser);
      }
    } else {
      this.addTransaction(newUid, 0, 'promo_code', "Account registered securely");
    }

    return { success: true, message: "Account created successfully with device fingerprint secured!", user: newUser };
  }

  // Handle direct referral tracking (No instant payout - pending until 1st approved withdraw)
  static processReferralSignup(referrerUser: User, signupUser: User) {
    const idOne = generateId();
    
    const rel: ReferralRelationship = {
      id: idOne,
      referrerId: referrerUser.uid,
      refereeId: signupUser.uid,
      refereeName: signupUser.displayName,
      refereeEmail: signupUser.email,
      bonusEarned: 0,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    this.referrals.push(rel);
    this.saveReferrals();
  }

  // --- TRANSACTION UTILITY ---
  static addTransaction(userId: string, amount: number, type: any, description: string) {
    const newTx: Transaction = {
      id: "tx_" + generateId(),
      userId,
      amount,
      type,
      description,
      timestamp: new Date().toISOString()
    };
    this.transactions.push(newTx);
    this.saveTransactions();
  }

  // --- LOGOUT ---
  static logout() {
    this.currentUser = null;
    localStorage.removeItem('cp_current_user');
  }

  // --- TASKS REDEMPTIONS UTILITY ---
  static redeemTaskReward(taskId: string, mockMultiplier: number = 1.0): { success: boolean, message: string } {
    if (!this.currentUser) return { success: false, message: "User not authenticated." };

    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return { success: false, message: "Task not found." };

    // Enforce per-user completion limit
    const userMax = task.userMaxCompletions !== undefined ? task.userMaxCompletions : 0;
    if (userMax > 0) {
      const userCompletedCount = this.taskCompletions.filter(c => c.taskId === task.id && c.userId === this.currentUser!.uid && c.status !== 'rejected').length;
      if (userCompletedCount >= userMax) {
        return { success: false, message: `Access Limit Blocked: You have already reached the configured maximum limit (${userMax} times) for this task.` };
      }
    }

    // Increment completed limit
    task.completionsToday += 1;
    this.saveTasks();

    // Calculate final payout reward based on VIP status and multiplier
    const vipFactor = this.currentUser.vipMember ? 1.5 : 1.0;
    const baseGift = task.rewardAmount * mockMultiplier * vipFactor;
    
    // Distribute balance standard
    this.checkAndResetTodayEarnings(this.currentUser);
    this.currentUser.balances.main += baseGift;
    this.currentUser.balances.todayEarnings += baseGift;
    this.currentUser.balances.totalEarnings += baseGift;
    
    this.saveSession();

    // Log credit
    this.addTransaction(
      this.currentUser.uid, 
      baseGift, 
      'task', 
      `Completed: ${task.title}` + (vipFactor > 1 ? " [1.5x VIP bonus]" : "")
    );

    return { 
      success: true, 
      message: `Task rewards successfully granted! You unlocked +${this.settings.currencySymbol}${baseGift.toFixed(2)} directly in wallet.` 
    };
  }

  // --- GAMES METRICS SPECIFICS ---
  static claimDailyCheckIn(): { success: boolean, message: string, amountClaimed?: number } {
    if (!this.currentUser) return { success: false, message: "Login required." };
    
    const now = new Date();
    if (this.currentUser.lastCheckIn) {
      const lastCheck = new Date(this.currentUser.lastCheckIn);
      const isClaimedToday = lastCheck.toDateString() === now.toDateString();
      if (isClaimedToday) {
        return { success: false, message: "Already checked in today. Return tomorrow!" };
      }
    }

    // Determine streak
    let streak = this.currentUser.streakDays + 1;
    if (this.currentUser.lastCheckIn) {
      const lastCheck = new Date(this.currentUser.lastCheckIn);
      const diffTime = Math.abs(now.getTime() - lastCheck.getTime());
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      if (diffDays > 2) {
        // Streak broken
        streak = 1;
      }
    }

    const checkInReward = 5 + Math.min(streak, 10); // Reward increases by streak up to Rs 15
    this.currentUser.balances.bonus += checkInReward;
    this.currentUser.balances.totalEarnings += checkInReward;
    this.currentUser.streakDays = streak;
    this.currentUser.lastCheckIn = now.toISOString();
    
    this.saveSession();
    
    this.addTransaction(
      this.currentUser.uid, 
      checkInReward, 
      'daily_bonus', 
      `Claimed Day ${streak} streak check-in bonus`
    );

    return { 
      success: true, 
      message: `Checked in successfully! You secured +${this.settings.currencySymbol}${checkInReward.toFixed(2)} in Bonus Wallet!`, 
      amountClaimed: checkInReward 
    };
  }

  // Redeem scratched card or wheels
  static redeemInstantGamer(amountEarned: number, gameType: 'scratch' | 'spin'): string {
    if (!this.currentUser) return "Login required.";
    this.checkAndResetTodayEarnings(this.currentUser);
    this.currentUser.balances.main += amountEarned;
    this.currentUser.balances.todayEarnings += amountEarned;
    this.currentUser.balances.totalEarnings += amountEarned;
    this.saveSession();

    this.addTransaction(
      this.currentUser.uid,
      amountEarned,
      gameType === 'scratch' ? 'scratch' : 'spin',
      `Won game credits on Earning ${gameType === 'scratch' ? 'Scratcher' : 'Lucky Wheel'}`
    );

    return `Awarded +${this.settings.currencySymbol}${amountEarned.toFixed(2)} instantly in Main Wallet.`;
  }

  // Redeem Offerwall task
  static redeemOfferwall(amountEarned: number, wallName: string): string {
    if (!this.currentUser) return "Login required.";
    this.checkAndResetTodayEarnings(this.currentUser);
    this.currentUser.balances.main += amountEarned;
    this.currentUser.balances.todayEarnings += amountEarned;
    this.currentUser.balances.totalEarnings += amountEarned;
    this.saveSession();

    this.addTransaction(
      this.currentUser.uid,
      amountEarned,
      'task',
      `Offerwall Reward: ${wallName}`
    );

    return `Awarded +${this.settings.currencySymbol}${amountEarned.toFixed(2)} instantly in Main Wallet via ${wallName}.`;
  }

  // --- SUBMIT PROMO CODE ---
  static redeemCouponCode(promo: string): { success: boolean, message: string } {
    if (!this.currentUser) return { success: false, message: "Login needed." };
    const pClean = promo.trim().toUpperCase();

    // Check dynamic promo codes
    const foundPromo = this.promoCodes.find(p => p.code.trim().toUpperCase() === pClean);
    if (foundPromo) {
      if (foundPromo.maxUses > 0 && foundPromo.useCount >= foundPromo.maxUses) {
        return { success: false, message: `Promo code '${foundPromo.code}' has reached its maximum claim limit.` };
      }
      
      // Check claim limits per user
      const userClaimsCount = foundPromo.claimedBy.filter(uid => uid === this.currentUser!.uid).length;
      const userLimit = foundPromo.maxClaimsPerUser ?? 1;
      if (userClaimsCount >= userLimit) {
        return { success: false, message: `You have reached the maximum claim limit of ${userLimit} time(s) for promo code '${foundPromo.code}'.` };
      }

      // Add reward directly to Main / Withdrawable balance
      this.currentUser.balances.main += foundPromo.rewardAmount;
      this.currentUser.balances.totalEarnings += foundPromo.rewardAmount;
      
      // Update promo code usage
      foundPromo.useCount += 1;
      foundPromo.claimedBy.push(this.currentUser.uid);
      
      this.saveSession();
      this.savePromoCodes();

      this.addTransaction(this.currentUser.uid, foundPromo.rewardAmount, 'promo_code', `Coupon ${foundPromo.code} claimed`);
      return { success: true, message: `Congratulations! Promo code '${foundPromo.code}' awarded you ₹${foundPromo.rewardAmount} withdrawable cash!` };
    }

    return { success: false, message: "Promo coupon doesn't exist or is expired." };
  }

  // --- PROMO CODE CREATION & MANAGEMENT ---
  static createPromoCode(code: string, rewardAmount: number, maxUses: number, maxClaimsPerUser: number = 1): { success: boolean, message: string } {
    const cClean = code.trim().toUpperCase();
    if (!cClean) return { success: false, message: "Code cannot be empty." };
    if (rewardAmount <= 0) return { success: false, message: "Amount must be greater than 0." };
    
    // Check if duplicate
    if (this.promoCodes.some(p => p.code === cClean)) {
      return { success: false, message: "A promo code with this code name already exists." };
    }

    const newPromo: PromoCode = {
      id: "promo_" + generateId(),
      code: cClean,
      rewardAmount,
      maxUses: maxUses > 0 ? maxUses : 999999, // practically unlimited if <= 0
      useCount: 0,
      claimedBy: [],
      createdAt: new Date().toISOString(),
      maxClaimsPerUser: maxClaimsPerUser > 0 ? maxClaimsPerUser : 1
    };

    this.addPendingSavedId(newPromo.id);
    this.promoCodes.push(newPromo);
    this.savePromoCodes();
    return { success: true, message: `Promo code '${cClean}' created successfully with ₹${rewardAmount} reward!` };
  }

  static async deletePromoCode(id: string) {
    await this.deleteDocument('promoCodes', id);
  }

  // --- KYC VERIFICATION MOCK ---
  static submitKYCRequest(): string {
    if (!this.currentUser) return "Auth needed";
    this.currentUser.kycStatus = 'Pending';
    this.saveSession();
    return "KYC documents uploaded successfully and ticket logged contextually under review.";
  }

  // --- WITHDRAW SYSTEM METRICS ---
  static requestWithdrawal(paymentMethod: PayoutMethod, details: string, amount: number): { success: boolean, message: string } {
    if (!this.currentUser) return { success: false, message: "Unauthorized log." };

    if (amount < this.settings.minWithdrawal) {
      return { success: false, message: `Minimum withdrawal amount requirement is ₹${this.settings.minWithdrawal.toFixed(2)}.` };
    }

    const currentMain = this.currentUser.balances.main;
    if (amount > currentMain) {
      return { success: false, message: "Insufficient withdrawable balance in Main Wallet." };
    }

    // Deduct immediately
    this.currentUser.balances.main -= amount;
    this.saveSession();

    const newWd: Withdrawal = {
      id: "wd_" + generateId(),
      userId: this.currentUser.uid,
      userEmail: this.currentUser.email,
      paymentMethod,
      paymentDetails: details,
      amount,
      status: 'pending',
      requestedAt: new Date().toISOString()
    };

    this.withdrawals.unshift(newWd);
    this.saveWithdrawals();

    // Log transaction
    this.addTransaction(
      this.currentUser.uid,
      -amount,
      'withdraw_pending',
      `Payout request created (${paymentMethod.toUpperCase()} with destination: ${details})`
    );

    return { 
      success: true, 
      message: `Your withdrawal request of ₹${amount} is logged successfully and enters safe moderation queues!` 
    };
  }

  // --- ADMIN FUNCTION DESIGN ---
  static adminLogin(pass: string): boolean {
    if (pass === "82503346" || pass === "campaign99") {
      this.isAdminAuthenticated = true;
      localStorage.setItem('cp_admin_auth', 'true');
      return true;
    }
    return false;
  }

  static lockAdminSession() {
    this.isAdminAuthenticated = false;
    localStorage.removeItem('cp_admin_auth');
  }

  static adminAuditBan(userId: string, isBan: boolean, reason: string) {
    const idx = this.users.findIndex(u => u.uid === userId);
    if (idx !== -1) {
      this.users[idx].isBanned = isBan;
      this.users[idx].bannedReason = reason;
      this.saveUsers();
      
      if (this.currentUser && this.currentUser.uid === userId) {
        this.currentUser.isBanned = isBan;
        this.currentUser.bannedReason = reason;
        this.saveSession();
      }
    }
  }

  static adminAdjustBalance(userId: string, amount: number, wallet: 'main' | 'bonus' | 'referral') {
    const idx = this.users.findIndex(u => u.uid === userId);
    if (idx !== -1) {
      const u = this.users[idx];
      u.balances[wallet] += amount;
      if (amount > 0) {
        u.balances.totalEarnings += amount;
      }
      this.saveUsers();
      
      this.addTransaction(userId, amount, 'promo_code', `Admin manual balance adjustment (${wallet})`);
      
      if (this.currentUser && this.currentUser.uid === userId) {
        this.currentUser = u;
        this.saveSession();
      }
    }
  }

  static adminSetBalance(userId: string, exactAmount: number, wallet: 'main' | 'bonus' | 'referral') {
    const idx = this.users.findIndex(u => u.uid === userId);
    if (idx !== -1) {
      const u = this.users[idx];
      const oldVal = u.balances[wallet] || 0;
      u.balances[wallet] = exactAmount;
      if (exactAmount > oldVal) {
        u.balances.totalEarnings += (exactAmount - oldVal);
      }
      this.saveUsers();
      
      this.addTransaction(userId, exactAmount - oldVal, 'promo_code', `Admin set balance directly for ${wallet} to ₹${exactAmount}`);
      
      if (this.currentUser && this.currentUser.uid === userId) {
        this.currentUser = u;
        this.saveSession();
      }
    }
  }

  static adminVerifyKYC(userId: string, newKyc: KYCStatus) {
    const idx = this.users.findIndex(u => u.uid === userId);
    if (idx !== -1) {
      this.users[idx].kycStatus = newKyc;
      this.saveUsers();

      if (this.currentUser && this.currentUser.uid === userId) {
        this.currentUser.kycStatus = newKyc;
        this.saveSession();
      }
    }
  }

  static adminUpdateWithdrawal(wdId: string, status: 'approved' | 'rejected', proofUrl?: string, rejectNote?: string) {
    const idx = this.withdrawals.findIndex(w => w.id === wdId);
    if (idx !== -1) {
      const wd = this.withdrawals[idx];
      wd.status = status;
      wd.processedAt = new Date().toISOString();
      if (proofUrl) wd.paymentProofURL = proofUrl;
      if (rejectNote) wd.adminNote = rejectNote;
      this.saveWithdrawals();

      // If rejected, refund user!
      if (status === 'rejected') {
        const uIdx = this.users.findIndex(u => u.uid === wd.userId);
        if (uIdx !== -1) {
          this.users[uIdx].balances.main += wd.amount;
          this.saveUsers();
          this.addTransaction(wd.userId, wd.amount, 'withdraw_refund', `Refunded ₹${wd.amount} due to withdrawal rejection: ${rejectNote || 'Payout failed'}`);
          
          if (this.currentUser && this.currentUser.uid === wd.userId) {
            this.currentUser = this.users[uIdx];
            this.saveSession();
          }
        }
      } else {
        // Log transaction payout completion
        this.addTransaction(wd.userId, wd.amount, 'withdraw_approve', `Payout approved and verified successfully. Proof attached.`);

        // AWARD REFERRER ₹5 ONLY ON THE FIRST APPROVED WITHDRAWAL
        const previousApprovedCount = this.withdrawals.filter(w => w.userId === wd.userId && w.status === 'approved' && w.id !== wd.id).length;
        if (previousApprovedCount === 0) {
          const relIdx = this.referrals.findIndex(r => r.refereeId === wd.userId && r.status === 'pending');
          if (relIdx !== -1) {
            const rel = this.referrals[relIdx];
            rel.status = 'completed';
            rel.bonusEarned = 5;
            this.saveReferrals();

            // Credit ₹5 to referrer
            const refIdx = this.users.findIndex(u => u.uid === rel.referrerId);
            if (refIdx !== -1) {
              const referrer = this.users[refIdx];
              referrer.balances.referral += 5;
              referrer.balances.totalEarnings += 5;
              this.saveUsers();

              this.addTransaction(referrer.uid, 5, 'referral', `Received ₹5 reward because referred friend ${wd.userEmail} completed their first successful withdrawal!`);

              if (this.currentUser && this.currentUser.uid === referrer.uid) {
                this.currentUser = referrer;
                this.saveSession();
              }
            }
          }
        }
      }
    }
  }

  // Helper to delete any document securely from client, Firestore, and fallback REST server
  static async deleteDocument(tableName: string, docId: string) {
    try {
      console.log(`[DELETE ACTION] Deleting document from table: ${tableName}, id: ${docId}`);
      
      // Register docId in local deleted set and save to prevent sync resurrection race
      if (!this.deletedIds) {
        this.deletedIds = new Set<string>();
      }
      this.deletedIds.add(docId);
      try {
        localStorage.setItem('cp_deleted_ids', JSON.stringify(Array.from(this.deletedIds)));
      } catch (safeguard) {}

      // 1. Delete from Firestore if configured
      if (this.useFirestore) {
        try {
          await deleteDoc(doc(db, tableName, docId));
          const cacheKey = `${tableName}_${docId}`;
          delete this.lastSavedState[cacheKey];
          console.log(`[STORE DELETE] Formally deleted document ${tableName}/${docId} from Cloud Firestore.`);
          
          try {
            await setDoc(doc(db, "deletedIds", docId), { id: docId, docId, tableName, deletedAt: new Date().toISOString() });
          } catch (ruleErr) {
            console.warn("Could not register centralized Firestore deletion marker:", ruleErr);
          }
        } catch (e: any) {
          console.warn(`Firestore delete error for ${tableName}/${docId}:`, e.message || e);
          if (this.isQuotaError(e)) {
            this.handleQuotaExceededException();
          }
        }
      }

      // 2. Clear from local arrays and write to appropriate localStorage key
      const storageKeys: { [key: string]: string } = {
        users: 'cp_users',
        tasks: 'cp_tasks',
        withdrawals: 'cp_withdrawals',
        referrals: 'cp_referrals',
        transactions: 'cp_transactions',
        notifications: 'cp_notifications',
        offerwalls: 'cp_offerwalls',
        promoCodes: 'cp_promocodes',
        taskCompletions: 'cp_task_completions'
      };
      
      const keyField = tableName === 'users' ? 'uid' : 'id';
      const typedThis = this as any;
      if (Array.isArray(typedThis[tableName])) {
        typedThis[tableName] = typedThis[tableName].filter((item: any) => item && item[keyField] !== docId);
        const lsKey = storageKeys[tableName];
        if (lsKey) {
          localStorage.setItem(lsKey, JSON.stringify(typedThis[tableName]));
        }
      }

      // 3. Keep fallback REST server perfectly aligned by invoking explicit delete API
      try {
        const res = await fetch('/api/db/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableName, docId })
        });
        if (!res.ok) {
          console.warn(`REST server deletion failed for table ${tableName} item ${docId}`);
        } else {
          console.log(`[REST DELETE OK] Confirmed deletion from server database for table ${tableName} item ${docId}`);
        }
      } catch (err) {
        console.warn(`Background REST deletion offline:`, err);
      }

    } catch (err) {
      console.error(`[STORE DELETE UNEXPECTED FAIL] Failed to delete ${tableName}/${docId}:`, err);
    }
  }

  static adminAddTask(t: Task) {
    this.addPendingSavedId(t.id);
    const nowStr = new Date().toISOString();
    const prepared = {
      ...t,
      createdAt: t.createdAt || nowStr,
      updatedAt: nowStr
    };
    this.tasks.unshift(prepared);
    this.saveTasks();
  }

  static async adminDeleteTask(tId: string) {
    await this.deleteDocument('tasks', tId);
  }

  static adminUpdateTask(updated: Task) {
    const idx = this.tasks.findIndex(t => t.id === updated.id);
    if (idx !== -1) {
      this.addPendingSavedId(updated.id);
      this.tasks[idx] = {
        ...updated,
        updatedAt: new Date().toISOString()
      };
      this.saveTasks();
    }
  }

  static adminUpdateSettings(s: AppSettings) {
    this.settings = s;
    this.saveSettings();
  }

  static adminUpdateAds(a: AdConfig) {
    this.adConfig = a;
    this.saveAdConfig();
  }

  static adminUpdateOfferwall(updated: OfferwallConfig) {
    const idx = this.offerwalls.findIndex(ow => ow.id === updated.id);
    if (idx !== -1) {
      this.addPendingSavedId(updated.id);
      this.offerwalls[idx] = {
        ...updated,
        updatedAt: new Date().toISOString()
      };
      this.saveOfferwalls();
    }
  }

  static adminAddOfferwall(ow: OfferwallConfig) {
    this.addPendingSavedId(ow.id);
    const nowStr = new Date().toISOString();
    const prepared = {
      ...ow,
      createdAt: ow.createdAt || nowStr,
      updatedAt: nowStr
    };
    this.offerwalls.push(prepared);
    this.saveOfferwalls();
  }

  static async adminDeleteOfferwall(owId: string) {
    await this.deleteDocument('offerwalls', owId);
  }

  static async adminHideTaskCompletion(tcId: string) {
    const idx = this.taskCompletions.findIndex(tc => tc.id === tcId);
    if (idx !== -1) {
      this.taskCompletions[idx].hiddenFromAdmin = true;
      this.taskCompletions[idx].updatedAt = new Date().toISOString();
      this.saveTaskCompletions();
    }
  }

  static adminUpdateTaskCompletionStatus(tcId: string, status: 'completed' | 'rejected' | 'pending') {
    const idx = this.taskCompletions.findIndex(tc => tc.id === tcId);
    if (idx !== -1) {
      const tc = this.taskCompletions[idx];
      const previousStatus = tc.status;
      tc.status = status;
      tc.updatedAt = new Date().toISOString();

      const tablesToSave: { [key: string]: any } = {
        taskCompletions: this.taskCompletions
      };

      // If the task was just approved (completed) and it wasn't already completed, reward the user
      if (status === 'completed' && previousStatus !== 'completed') {
        const userIdx = this.users.findIndex(u => u.uid === tc.userId);
        if (userIdx !== -1) {
          const user = this.users[userIdx];
          const task = this.tasks.find(t => t.id === tc.taskId);
          if (task) {
            // Increment task completion count
            task.completionsToday += 1;
            tablesToSave.tasks = this.tasks;

            // Calculate reward with VIP factor
            const vipFactor = user.vipMember ? 1.5 : 1.0;
            const baseGift = task.rewardAmount * vipFactor;

            // Update user balances
            this.checkAndResetTodayEarnings(user);
            user.balances.main += baseGift;
            user.balances.todayEarnings += baseGift;
            user.balances.totalEarnings += baseGift;
            tablesToSave.users = this.users;

            // Add transaction log directly to memory transactions
            const newTx: Transaction = {
              id: "tx_" + generateId(),
              userId: user.uid,
              amount: baseGift,
              type: 'task',
              description: `Completed: ${task.title}` + (vipFactor > 1 ? " [1.5x VIP bonus]" : ""),
              timestamp: new Date().toISOString()
            };
            this.transactions.push(newTx);
            tablesToSave.transactions = this.transactions;

            // If the current user logged in is this user, also update session
            if (this.currentUser && this.currentUser.uid === user.uid) {
              this.currentUser = user;
            }
          }
        }
      } else if (previousStatus === 'completed' && status !== 'completed') {
        // If we are resetting/reverting from 'completed' to something else, claw back the reward safely
        const userIdx = this.users.findIndex(u => u.uid === tc.userId);
        if (userIdx !== -1) {
          const user = this.users[userIdx];
          const task = this.tasks.find(t => t.id === tc.taskId);
          if (task) {
            // Decrement completionsToday if > 0
            if (task.completionsToday > 0) {
              task.completionsToday -= 1;
              tablesToSave.tasks = this.tasks;
            }

            // Calculate reward to deduct
            const vipFactor = user.vipMember ? 1.5 : 1.0;
            const baseGift = task.rewardAmount * vipFactor;

            // Update user balances (prevent negative balances where possible, but allow natural reversal)
            user.balances.main = Math.max(0, user.balances.main - baseGift);
            user.balances.todayEarnings = Math.max(0, user.balances.todayEarnings - baseGift);
            user.balances.totalEarnings = Math.max(0, user.balances.totalEarnings - baseGift);
            tablesToSave.users = this.users;

            // Add transaction log directly to memory transactions
            const newTx: Transaction = {
              id: "tx_" + generateId(),
              userId: user.uid,
              amount: -baseGift,
              type: 'task',
              description: `Reverted/Rejected Task: ${task.title}`,
              timestamp: new Date().toISOString()
            };
            this.transactions.push(newTx);
            tablesToSave.transactions = this.transactions;

            // If the current user logged in is this user, also update session
            if (this.currentUser && this.currentUser.uid === user.uid) {
              this.currentUser = user;
            }
          }
        }
      }

      // Save everything in one unified atomic REST request!
      this.saveMultipleTables(tablesToSave);
      this.saveSession(); // Always updates local cp_current_user securely
    }
  }

  static async purgeRejectedCompletions() {
    let changed = false;
    this.taskCompletions.forEach(tc => {
      if (tc && tc.status === 'rejected' && !tc.hiddenFromAdmin) {
        tc.hiddenFromAdmin = true;
        tc.updatedAt = new Date().toISOString();
        changed = true;
      }
    });
    if (changed) {
      this.saveTaskCompletions();
    }
  }

  static adminSendPushNotification(title: string, message: string, type: any, targetUserId?: string, targetEmail?: string) {
    const newNotice: AppNotification = {
      id: "not_" + generateId(),
      title,
      message,
      type,
      createdAt: new Date().toISOString(),
      targetUserId: targetUserId ? targetUserId.trim() : undefined,
      targetEmail: targetEmail ? targetEmail.trim() : undefined
    };
    this.addPendingSavedId(newNotice.id);
    this.notifications.unshift(newNotice);
    this.saveNotifications();
  }

  static async adminDeleteNotification(id: string) {
    await this.deleteDocument('notifications', id);
  }

  // --- VPN SIMULATOR AND ANTI SPOOF TOGGLES ---
  static simulateVpnAction(active: boolean) {
    if (this.currentUser) {
      this.currentUser.vpnActive = active;
      this.saveSession();
    }
  }
}
