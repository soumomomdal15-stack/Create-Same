/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Users, Key, Check, X, ShieldAlert, Award, Plus, 
  Trash2, ToggleLeft, ToggleRight, Edit, Sliders, Smartphone, 
  Send, Search, Filter, Ban, RefreshCw, LogOut, CheckCircle, HelpCircle, AlertCircle, Layers, HardDrive,
  Copy, Download, Gift, Upload, Video, Image, Sparkles, Wrench
} from 'lucide-react';
import { CampaignStore } from '../utils/store';
import { Task, User as UserType, Withdrawal, AppSettings, AdConfig, OfferwallConfig, VerificationType } from '../types';
import appLogo from '../assets/images/earnos_app_logo_1779768057177.png';
import PostbackConsoleSection from './PostbackConsoleSection';

interface AdminPanelProps {
  theme: 'light' | 'dark';
  triggerRefresh: () => void;
  onLogout?: () => void;
}

export default function AdminPanel({ theme, triggerRefresh, onLogout }: AdminPanelProps) {
  // Helper to format image base64 safely
  const getSafeImageUrl = (url?: string): string => {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
      return trimmed;
    }
    if (trimmed.startsWith('pwazBL4z') || trimmed.length > 100) {
      return `data:image/jpeg;base64,${trimmed}`;
    }
    return trimmed;
  };

  const [isAdminAuth, setIsAdminAuth] = useState<boolean>(CampaignStore.isAdminAuthenticated);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  const [isUploadingVideo, setIsUploadingVideo] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);

  // Sidebar navigation: 'metrics' | 'users' | 'tasks' | 'campaigns' | 'payouts' | 'settings' | 'notices' | 'offerwalls' | 'storage' | 'coupons' | 'postback'
  const [adminSection, setAdminSection] = useState<'metrics' | 'users' | 'tasks' | 'campaigns' | 'payouts' | 'settings' | 'notices' | 'offerwalls' | 'storage' | 'coupons' | 'postback'>('metrics');

  // Database states
  const [usersList, setUsersList] = useState<UserType[]>([]);
  const [tasksList, setTasksList] = useState<Task[]>([]);
  const [withdrawalsList, setWithdrawalsList] = useState<Withdrawal[]>([]);
  const [offerwallsList, setOfferwallsList] = useState<OfferwallConfig[]>([]);
  const [completionsQueue, setCompletionsQueue] = useState<any[]>([]);
  const [promoCodesList, setPromoCodesList] = useState<any[]>([]);

  // Coupon Creator dynamic form states
  const [newPromoCode, setNewPromoCode] = useState<string>('');
  const [newPromoAmount, setNewPromoAmount] = useState<string>('');
  const [newPromoMaxUses, setNewPromoMaxUses] = useState<string>('50');
  const [newPromoMaxClaimsPerUser, setNewPromoMaxClaimsPerUser] = useState<string>('1');
  const [couponMsg, setCouponMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Filtering states
  const [searchUserQuery, setSearchUserQuery] = useState<string>('');
  const [payoutFilter, setPayoutFilter] = useState<string>('all');
  const [storageFilter, setStorageFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [storageSearch, setStorageSearch] = useState<string>('');
  const [zoomedImage, setZoomedImage] = useState<any | null>(null);

  // Modals & Forms and target references
  const [selectedUserObj, setSelectedUserObj] = useState<UserType | null>(null);
  const [balanceAdjustWallet, setBalanceAdjustWallet] = useState<'main' | 'bonus' | 'referral'>('main');
  const [balanceAdjustVal, setBalanceAdjustVal] = useState<string>('');
  const [balanceAdjustMode, setBalanceAdjustMode] = useState<'adjust' | 'set'>('adjust'); // 'adjust' (incremental/decremental) or 'set' (direct absolute value)
  const [banReasonInput, setBanReasonInput] = useState<string>('Multi-account cheating behavior detected.');

  // Offerwall Form states
  const [showOfferwallModal, setShowOfferwallModal] = useState<boolean>(false);
  const [isEditingOfferwall, setIsEditingOfferwall] = useState<boolean>(false);
  const [owId, setOwId] = useState<string>('');
  const [owName, setOwName] = useState<string>('');
  const [owMultiplier, setOwMultiplier] = useState<string>('');
  const [owIsActive, setOwIsActive] = useState<boolean>(true);
  const [owApiKey, setOwApiKey] = useState<string>('');
  const [owCallbackUrl, setOwCallbackUrl] = useState<string>('');
  const [owLogoUrl, setOwLogoUrl] = useState<string>('');
  const [owRedirectUrl, setOwRedirectUrl] = useState<string>('');

  // Add Task form state
  const [showAddTaskModal, setShowAddTaskModal] = useState<boolean>(false);
  const [isEditingTask, setIsEditingTask] = useState<boolean>(false);
  const [editingTaskId, setEditingTaskId] = useState<string>('');
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskDesc, setNewTaskDesc] = useState<string>('');
  const [newTaskReward, setNewTaskReward] = useState<string>('');
  const [newTaskCategory, setNewTaskCategory] = useState<any>('app_install');
  const [newTaskVerification, setNewTaskVerification] = useState<any>('auto');
  const [newTaskUrl, setNewTaskUrl] = useState<string>('');
  const [newTaskDailyLimit, setNewTaskDailyLimit] = useState<string>('1');
  const [newTaskUserMaxCompletions, setNewTaskUserMaxCompletions] = useState<string>('1');
  const [newTaskRatingAppId, setNewTaskRatingAppId] = useState<string>('');
  const [newTaskLogoUrl, setNewTaskLogoUrl] = useState<string>('');
  const [newTaskTutorialVideoUrl, setNewTaskTutorialVideoUrl] = useState<string>('');
  const [newTaskTutorialImageUrl, setNewTaskTutorialImageUrl] = useState<string>('');
  const [newTaskVerificationMethods, setNewTaskVerificationMethods] = useState<VerificationType[]>([]);
  const [newTaskTextProofPlaceholder, setNewTaskTextProofPlaceholder] = useState<string>('');
  const [newTaskSdkRequirements, setNewTaskSdkRequirements] = useState<string>('');

  // Broadcast Notification Form state
  const [notifyTitle, setNotifyTitle] = useState<string>('');
  const [notifyDesc, setNotifyDesc] = useState<string>('');
  const [notifyType, setNotifyType] = useState<any>('announcement');
  const [notifySuccessMsg, setNotifySuccessMsg] = useState<string>('');
  const [notifyTargetUserId, setNotifyTargetUserId] = useState<string>('');
  const [notifyTargetEmail, setNotifyTargetEmail] = useState<string>('');
  const [notifySearchQuery, setNotifySearchQuery] = useState<string>('');

  // App settings fields
  const [appNameInput, setAppNameInput] = useState<string>('');
  const [minWithdrawInput, setMinWithdrawInput] = useState<string>('');
  const [rateInput, setRateInput] = useState<string>('');
  const [ref1Input, setRef1Input] = useState<string>('');
  const [ref2Input, setRef2Input] = useState<string>('');
  const [ref3Input, setRef3Input] = useState<string>('');
  const [maintMode, setMaintMode] = useState<boolean>(false);
  const [customPostbackDomainInput, setCustomPostbackDomainInput] = useState<string>('');

  // AdMob configs fields
  const [blockBanners, setBlockBanners] = useState<boolean>(true);
  const [bannerIdField, setBannerIdField] = useState<string>('');
  const [interstitialIdField, setInterstitialIdField] = useState<string>('');
   const [rewardedIdField, setRewardedIdField] = useState<string>('');

  const [copiedDetailsId, setCopiedDetailsId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingResetId, setPendingResetId] = useState<string | null>(null);
  const [pendingPurgeTrash, setPendingPurgeTrash] = useState<boolean>(false);
  const [pendingDeletePromoCodeId, setPendingDeletePromoCodeId] = useState<string | null>(null);

  // User detailed audit & inspection states
  const [inspectedUser, setInspectedUser] = useState<UserType | null>(null);
  const [directUidLookup, setDirectUidLookup] = useState<string>('');

  const handleCopyDetails = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDetailsId(id);
    setTimeout(() => setCopiedDetailsId(null), 2000);
  };

  const handleDownloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'screenshot-proof.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = filename || 'screenshot-proof.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Loading databases
  const refreshLocalDatabase = () => {
    CampaignStore.initialize();
    setUsersList([...CampaignStore.users]);
    setTasksList([...CampaignStore.tasks]);
    setWithdrawalsList([...CampaignStore.withdrawals]);
    setOfferwallsList([...CampaignStore.offerwalls]);
    setPromoCodesList([...CampaignStore.promoCodes]);
    const completions = [...CampaignStore.taskCompletions];
    setCompletionsQueue(completions.filter((c: any) => c && !c.hiddenFromAdmin));
  };

  useEffect(() => {
    CampaignStore.initialize();
    refreshLocalDatabase();
    
    // Fill settings inputs once loaded
    setAppNameInput(CampaignStore.settings.appName);
    setMinWithdrawInput(CampaignStore.settings.minWithdrawal.toString());
    setRateInput(CampaignStore.settings.pointsRate.toString());
    setRef1Input(CampaignStore.settings.referralBonusFirstLevel.toString());
    setRef2Input(CampaignStore.settings.referralBonusSecondLevel.toString());
    setRef3Input(CampaignStore.settings.referralBonusThirdLevel.toString());
    setMaintMode(CampaignStore.settings.maintenanceMode);
    setCustomPostbackDomainInput(CampaignStore.settings.customPostbackDomain || '');

    setBlockBanners(CampaignStore.adConfig.bannerEnabled);
    setBannerIdField(CampaignStore.adConfig.admobBannerId);
    setInterstitialIdField(CampaignStore.adConfig.admobInterstitialId);
    setRewardedIdField(CampaignStore.adConfig.admobRewardedId);

    // Initial server fetch sync
    CampaignStore.syncWithServer(() => {
      refreshLocalDatabase();
    });

    // Setup real-time change listener to instantly refresh database when any updates occur
    const changeHandler = () => {
      console.log('[REALTIME] Change detected. Refreshing AdminPanel local list states...');
      refreshLocalDatabase();
    };
    CampaignStore.addChangeListener(changeHandler);

    // Setup periodic polling interval as a silent background fallback (now relaxed to 15s since real-time is active)
    const interval = setInterval(() => {
      CampaignStore.syncWithServer(() => {
        refreshLocalDatabase();
      });
    }, 15000);

    return () => {
      clearInterval(interval);
      CampaignStore.removeChangeListener(changeHandler);
    };
  }, [isAdminAuth]);

  const handleAdminVerifyPIN = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    const res = CampaignStore.adminLogin(pinInput);
    if (res) {
      setIsAdminAuth(true);
      setPinInput('');
    } else {
      setPinError('Incorrect administrator passcode. Hint: 82503346');
    }
  };

  const handleAdminLogout = () => {
    CampaignStore.lockAdminSession();
    setIsAdminAuth(false);
    triggerRefresh();
    if (onLogout) onLogout();
  };

  // BAN/UNBAN Actions
  const handleBanToggle = (usr: UserType) => {
    const isBan = !usr.isBanned;
    CampaignStore.adminAuditBan(usr.uid, isBan, banReasonInput);
    refreshLocalDatabase();
    triggerRefresh();
  };

  // Adjust Wallet Balance Action
  const handleBalanceUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserObj) return;
    
    const amtNum = parseFloat(balanceAdjustVal);
    if (isNaN(amtNum)) return;

    if (balanceAdjustMode === 'set') {
      CampaignStore.adminSetBalance(selectedUserObj.uid, amtNum, balanceAdjustWallet);
    } else {
      CampaignStore.adminAdjustBalance(selectedUserObj.uid, amtNum, balanceAdjustWallet);
    }
    setBalanceAdjustVal('');
    setSelectedUserObj(null);
    refreshLocalDatabase();
    triggerRefresh();
  };

  // Handle KYC submissions
  const handleKycStatusChange = (userId: string, status: 'Approved' | 'Rejected') => {
    CampaignStore.adminVerifyKYC(userId, status);
    refreshLocalDatabase();
    triggerRefresh();
  };

  // Admin approves/rejects payouts
  const handleWithdrawAction = (wdId: string, action: 'approved' | 'rejected', rejectComment?: string) => {
    const mockRefReceipt = action === 'approved' ? 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=300&q=80' : undefined;
    CampaignStore.adminUpdateWithdrawal(wdId, action, mockRefReceipt, rejectComment);
    refreshLocalDatabase();
    triggerRefresh();
  };

  // Admin approves manual rating screenshots
  const handleScreenshotTaskApprove = (tcId: string, verdict: 'completed' | 'rejected') => {
    CampaignStore.adminUpdateTaskCompletionStatus(tcId, verdict);
    refreshLocalDatabase();
    triggerRefresh();
  };

  const compressAndResizeImage = (
    base64Src: string,
    maxWidth: number,
    maxHeight: number,
    quality: number = 0.75
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.src = base64Src;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(base64Src);
          return;
        }
        ctx.fillStyle = "rgba(0, 0, 0, 0)";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(base64Src);
      };
    });
  };

  const uploadFileToServer = async (base64Data: string, fileName: string): Promise<string> => {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Data, fileName })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Upload failed with status ${response.status}`);
    }
    const data = await response.json();
    return data.url;
  };

  const handleUploadVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 300 * 1024 * 1024) {
        alert("❌ Video size bahut zyada bada hai! Please 300MB se choti video file choose karein.");
        return;
      }
      setIsUploadingVideo(true);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const fileUrl = await uploadFileToServer(reader.result as string, file.name);
          setNewTaskTutorialVideoUrl(fileUrl);
        } catch (err: any) {
          alert(`❌ Video upload failed: ${err.message || err}`);
        } finally {
          setIsUploadingVideo(false);
        }
      };
      reader.onerror = () => {
        alert("❌ Error reading file");
        setIsUploadingVideo(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("❌ Image size bahut zyada bada hai! Please 10MB se choti image file choose karein.");
        return;
      }
      setIsUploadingImage(true);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          // Resize and compress tutorial/screenshot images to be extremely compact (< 60 KB)
          const compressedBase64 = await compressAndResizeImage(reader.result as string, 640, 640, 0.7);
          const fileUrl = await uploadFileToServer(compressedBase64, file.name);
          setNewTaskTutorialImageUrl(fileUrl);
        } catch (err: any) {
          alert(`❌ Image upload failed: ${err.message || err}`);
        } finally {
          setIsUploadingImage(false);
        }
      };
      reader.onerror = () => {
        alert("❌ Error reading file");
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("❌ Image size bahut zyada bada hai! Please 10MB se choti image file choose karein.");
        return;
      }
      setIsUploadingLogo(true);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          // Compress logo to microscopic dimensions (128x128 max is perfect and super sharp, file size < 10KB)
          const compressedBase64 = await compressAndResizeImage(reader.result as string, 128, 128, 0.8);
          const fileUrl = await uploadFileToServer(compressedBase64, file.name);
          setNewTaskLogoUrl(fileUrl);
        } catch (err: any) {
          alert(`❌ Logo upload failed: ${err.message || err}`);
        } finally {
          setIsUploadingLogo(false);
        }
      };
      reader.onerror = () => {
        alert("❌ Error reading file");
        setIsUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // New/Edit tasks adding and updating
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    
    const rew = parseFloat(newTaskReward);
    const limit = parseInt(newTaskDailyLimit);
    const userMax = parseInt(newTaskUserMaxCompletions);

    if (!newTaskTitle || isNaN(rew)) return;

    // Use selected methods or default to single dropdown method if none selected
    const selectedMethods = newTaskVerificationMethods.length > 0 
      ? newTaskVerificationMethods 
      : [newTaskVerification as VerificationType];

    const primaryMethod = selectedMethods[0] || 'auto';

    const sdkRequirementsArray = selectedMethods.includes('sdk_postback')
      ? newTaskSdkRequirements.split('\n').map(l => l.trim()).filter(Boolean)
      : undefined;

    if (isEditingTask) {
      const existingTask = CampaignStore.tasks.find(t => t.id === editingTaskId);
      const updatedItem: Task = {
        id: editingTaskId,
        title: newTaskTitle,
        description: newTaskDesc,
        rewardAmount: rew,
        category: newTaskCategory,
        verificationMethod: primaryMethod,
        verificationMethods: selectedMethods,
        textProofPlaceholder: newTaskTextProofPlaceholder || undefined,
        url: newTaskUrl || undefined,
        dailyLimit: isNaN(limit) ? 1 : limit,
        completionsToday: existingTask ? existingTask.completionsToday : 0,
        userMaxCompletions: isNaN(userMax) ? 0 : userMax,
        icon: existingTask ? existingTask.icon : "Award",
        isActive: existingTask ? existingTask.isActive : true,
        ratingAppId: newTaskRatingAppId || undefined,
        logoUrl: newTaskLogoUrl || undefined,
        sdkRequirements: sdkRequirementsArray,
        tutorialVideoUrl: newTaskTutorialVideoUrl || undefined,
        tutorialImageUrl: newTaskTutorialImageUrl || undefined
      };
      CampaignStore.adminUpdateTask(updatedItem);
    } else {
      const newTaskItem: Task = {
        id: "t_custom_" + Math.random().toString(36).substring(2, 9),
        title: newTaskTitle,
        description: newTaskDesc,
        rewardAmount: rew,
        category: newTaskCategory,
        verificationMethod: primaryMethod,
        verificationMethods: selectedMethods,
        textProofPlaceholder: newTaskTextProofPlaceholder || undefined,
        url: newTaskUrl || undefined,
        dailyLimit: isNaN(limit) ? 1 : limit,
        completionsToday: 0,
        userMaxCompletions: isNaN(userMax) ? 0 : userMax,
        icon: "Award",
        isActive: true,
        ratingAppId: newTaskRatingAppId || undefined,
        logoUrl: newTaskLogoUrl || undefined,
        sdkRequirements: sdkRequirementsArray,
        tutorialVideoUrl: newTaskTutorialVideoUrl || undefined,
        tutorialImageUrl: newTaskTutorialImageUrl || undefined
      };
      CampaignStore.adminAddTask(newTaskItem);
    }
    
    // Clear state
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskReward('');
    setNewTaskUrl('');
    setNewTaskVerification('auto');
    setNewTaskVerificationMethods(['auto']);
    setNewTaskTextProofPlaceholder('');
    setNewTaskSdkRequirements('');
    setNewTaskCategory('app_install');
    setNewTaskDailyLimit('1');
    setNewTaskUserMaxCompletions('1');
    setNewTaskRatingAppId('');
    setNewTaskLogoUrl('');
    setNewTaskTutorialVideoUrl('');
    setNewTaskTutorialImageUrl('');
    setIsEditingTask(false);
    setEditingTaskId('');
    setShowAddTaskModal(false);
    
    refreshLocalDatabase();
    triggerRefresh();
  };

  const handleEditTaskClick = (task: Task) => {
    setIsEditingTask(true);
    setEditingTaskId(task.id);
    setNewTaskTitle(task.title);
    setNewTaskDesc(task.description);
    setNewTaskReward(task.rewardAmount.toString());
    setNewTaskCategory(task.category);
    setNewTaskVerification(task.verificationMethod);
    setNewTaskVerificationMethods(task.verificationMethods || [task.verificationMethod]);
    setNewTaskTextProofPlaceholder(task.textProofPlaceholder || '');
    setNewTaskSdkRequirements(task.sdkRequirements ? task.sdkRequirements.join('\n') : '');
    setNewTaskDailyLimit(task.dailyLimit.toString());
    setNewTaskUserMaxCompletions((task.userMaxCompletions !== undefined ? task.userMaxCompletions : 1).toString());
    setNewTaskUrl(task.url || '');
    setNewTaskRatingAppId(task.ratingAppId || '');
    setNewTaskLogoUrl(task.logoUrl || '');
    setNewTaskTutorialVideoUrl(task.tutorialVideoUrl || '');
    setNewTaskTutorialImageUrl(task.tutorialImageUrl || '');
    setShowAddTaskModal(true);
  };

  const handleAddTaskClick = () => {
    setIsEditingTask(false);
    setEditingTaskId('');
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskReward('');
    setNewTaskCategory('app_install');
    setNewTaskVerification('auto');
    setNewTaskVerificationMethods(['auto']);
    setNewTaskTextProofPlaceholder('');
    setNewTaskSdkRequirements('Step 1: Install & Open the App\nStep 2: Register with a new mobile number');
    setNewTaskDailyLimit('100');
    setNewTaskUserMaxCompletions('1');
    setNewTaskUrl('');
    setNewTaskRatingAppId('');
    setNewTaskLogoUrl('');
    setNewTaskTutorialVideoUrl('');
    setNewTaskTutorialImageUrl('');
    setShowAddTaskModal(true);
  };

  // Delete task action
  const handleTaskDelete = async (tId: string) => {
    await CampaignStore.adminDeleteTask(tId);
    refreshLocalDatabase();
    triggerRefresh();
  };

  // Save Settings forms
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    
    const minW = parseFloat(minWithdrawInput);
    const rate = parseFloat(rateInput);

    const updatedSettings: AppSettings = {
      appName: appNameInput,
      currencySymbol: "₹",
      pointsRate: isNaN(rate) ? 100 : rate,
      minWithdrawal: isNaN(minW) ? 100 : minW,
      referralBonusFirstLevel: 5,
      referralBonusSecondLevel: 0,
      referralBonusThirdLevel: 0,
      maintenanceMode: maintMode,
      themeColor: "#3b82f6",
      customPostbackDomain: customPostbackDomainInput.trim()
    };

    CampaignStore.adminUpdateSettings(updatedSettings);
    
    const updatedAds: AdConfig = {
      id: "default_admob_config",
      bannerEnabled: blockBanners,
      interstitialEnabled: true,
      rewardedEnabled: true,
      rewardFrequency: 3,
      admobBannerId: bannerIdField,
      admobInterstitialId: interstitialIdField,
      admobRewardedId: rewardedIdField
    };

    CampaignStore.adminUpdateAds(updatedAds);
    alert("Application Configuration and AdMob Ads IDs updated successfully.");
    refreshLocalDatabase();
    triggerRefresh();
  };

  // Offerwall Action Handlers
  const handleEditOfferwallClick = (wall: OfferwallConfig) => {
    setIsEditingOfferwall(true);
    setOwId(wall.id);
    setOwName(wall.name);
    setOwMultiplier(wall.multiplier.toString());
    setOwIsActive(wall.isActive);
    setOwApiKey(wall.apiKey || '');
    setOwCallbackUrl(wall.callbackUrl || '');
    setOwLogoUrl(wall.logoUrl || '');
    setOwRedirectUrl(wall.redirectUrl || '');
    setShowOfferwallModal(true);
  };

  const handleCreateOfferwallClick = () => {
    setIsEditingOfferwall(false);
    setOwId('ow_' + Math.random().toString(36).substring(2, 9));
    setOwName('');
    setOwMultiplier('1.0');
    setOwIsActive(true);
    setOwApiKey('');
    setOwCallbackUrl('');
    setOwLogoUrl('');
    setOwRedirectUrl('');
    setShowOfferwallModal(true);
  };

  const handleSaveOfferwall = (e: React.FormEvent) => {
    e.preventDefault();
    const mult = parseFloat(owMultiplier);
    if (!owName || isNaN(mult)) return;

    const wallObj: OfferwallConfig = {
      id: owId,
      name: owName,
      multiplier: mult,
      isActive: owIsActive,
      apiKey: owApiKey,
      callbackUrl: owCallbackUrl,
      logoUrl: owLogoUrl,
      redirectUrl: owRedirectUrl
    };

    if (isEditingOfferwall) {
      CampaignStore.adminUpdateOfferwall(wallObj);
    } else {
      CampaignStore.adminAddOfferwall(wallObj);
    }

    setOwId('');
    setOwName('');
    setOwMultiplier('1.0');
    setOwIsActive(true);
    setOwApiKey('');
    setOwCallbackUrl('');
    setOwLogoUrl('');
    setOwRedirectUrl('');
    setShowOfferwallModal(false);
    refreshLocalDatabase();
    triggerRefresh();
  };

  const handleDeleteOfferwall = async (wallId: string) => {
    if (confirm("Are you sure you want to delete this offerwall integration?")) {
      await CampaignStore.adminDeleteOfferwall(wallId);
      refreshLocalDatabase();
      triggerRefresh();
    }
  };

  const handleOfferwallStatusToggle = (wall: OfferwallConfig) => {
    const updated = { ...wall, isActive: !wall.isActive };
    CampaignStore.adminUpdateOfferwall(updated);
    refreshLocalDatabase();
    triggerRefresh();
  };

  // Submit Broadcast Announcement Notice
  const handleSubmitBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    setNotifySuccessMsg('');
    if (!notifyTitle || !notifyDesc) return;

    CampaignStore.adminSendPushNotification(
      notifyTitle, 
      notifyDesc, 
      notifyType, 
      notifyTargetUserId || undefined, 
      notifyTargetEmail || undefined
    );
    setNotifyTitle('');
    setNotifyDesc('');
    
    if (notifyTargetUserId || notifyTargetEmail) {
      setNotifySuccessMsg(`Targeted notification delivered successfully to ${notifyTargetUserId || notifyTargetEmail}!`);
    } else {
      setNotifySuccessMsg("Notice bulletin distributed broadcasted app-wide successfully!");
    }
    
    setNotifyTargetUserId('');
    setNotifyTargetEmail('');
    setNotifySearchQuery('');
    refreshLocalDatabase();
    triggerRefresh();
  };

  const handleTaskStatusToggle = (task: Task) => {
    const updated = { ...task, isActive: !task.isActive };
    CampaignStore.adminUpdateTask(updated);
    refreshLocalDatabase();
    triggerRefresh();
  };

  // Metrics computing calculations
  const totalUsersCount = usersList.length;
  const activeUserTally = usersList.filter(u => !u.isBanned).length;
  const totalPointsDistributed = usersList.reduce((acc, curr) => acc + curr.balances.totalEarnings, 0);
  const pendingPayoutTotal = withdrawalsList.filter(w => w.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);
  const totalRevenueMock = totalPointsDistributed * 1.45; // Simulated ROI formula

  // Filtering users by input search query
  const filteredUsers = usersList.filter(u => 
    u.email.toLowerCase().includes(searchUserQuery.toLowerCase()) || 
    u.displayName.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
    u.referralCode.toLowerCase().includes(searchUserQuery.toLowerCase())
  );

  // Filtering Payouts table
  const filteredPayouts = withdrawalsList.filter(w => {
    if (payoutFilter === 'all') return true;
    return w.status === payoutFilter;
  });

  // Admin PIN Gate design
  if (!isAdminAuth) {
    return (
      <div className="flex-1 min-h-[600px] flex items-center justify-center p-6 bg-slate-50 dark:bg-zinc-950 font-sans">
        <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-3xl shadow-xl space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-zinc-950 border border-zinc-850 rounded-2xl overflow-hidden flex items-center justify-center mx-auto mb-2 shadow-md">
              <img src={appLogo} alt="Admin Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <h1 className="text-xl font-bold font-display text-slate-900 dark:text-zinc-100">Administrator Console</h1>
            <p className="text-xs text-zinc-400 mt-1">Submit passcode to unlock full earning controls panel.</p>
          </div>

          <form onSubmit={handleAdminVerifyPIN} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Admin PASSCODE</label>
              <input 
                type="password" 
                placeholder="Enter 82503346"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl text-center tracking-widest bg-slate-50 dark:bg-zinc-805 border border-slate-200 dark:border-zinc-700 text-sm font-mono text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {pinError && (
              <p className="text-[11px] text-center text-red-500 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-xl border border-red-100 dark:border-red-950">
                {pinError}
              </p>
            )}

            <button 
              type="submit"
              className="w-full bg-slate-950 hover:bg-slate-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
            >
              Sign In to Dashboard
            </button>
          </form>

          <div className="pt-2 text-center border-t border-slate-100 dark:border-zinc-800">
            <span className="text-[10px] text-zinc-400 font-mono">Demo Password Code: 82503346</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-[680px] bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 font-sans">
      
      {/* SIDEBAR NAVIGATION RAIL */}
      <div className="w-full md:w-60 bg-zinc-950 text-zinc-400 p-4 shrink-0 flex flex-col justify-between border-r border-zinc-900">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                <img src={appLogo} alt="Admin Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <span className="block text-xs font-black font-display text-white leading-none">EarnOS Desk</span>
                <span className="text-[9px] opacity-60">Control Console</span>
              </div>
            </div>
            
            <button 
              onClick={refreshLocalDatabase}
              className="p-1 hover:text-white rounded-lg hover:bg-zinc-900"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Nav groups */}
          <div className="space-y-1">
            <button
              onClick={() => setAdminSection('metrics')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                adminSection === 'metrics' ? 'bg-zinc-900 text-white font-extrabold' : 'hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <BarChart className="w-4 h-4 text-blue-500" />
              <span>Telemetry metrics</span>
            </button>

            <button
              onClick={() => setAdminSection('users')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                adminSection === 'users' ? 'bg-zinc-900 text-white font-extrabold' : 'hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Users className="w-4 h-4 text-purple-500" />
              <span>Users Management</span>
              {usersList.filter(u => u.kycStatus === 'Pending').length > 0 && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500"></span>
              )}
            </button>

            <button
              onClick={() => setAdminSection('tasks')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                adminSection === 'tasks' ? 'bg-zinc-900 text-white font-extrabold' : 'hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Award className="w-4 h-4 text-amber-500" />
              <span>Tasks Inventory</span>
            </button>

            <button
              onClick={() => setAdminSection('campaigns')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                adminSection === 'campaigns' ? 'bg-zinc-900 text-white font-extrabold' : 'hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-500 fill-indigo-200" />
              <span>Campaigns Inventory</span>
            </button>

            <button
              onClick={() => setAdminSection('payouts')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                adminSection === 'payouts' ? 'bg-zinc-900 text-white font-extrabold' : 'hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span>Approve Payouts</span>
              {withdrawalsList.filter(w => w.status === 'pending').length > 0 && (
                <span className="ml-auto bg-emerald-600 text-[9px] text-white font-bold px-1.5 py-0.2 rounded-full">
                  {withdrawalsList.filter(w => w.status === 'pending').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setAdminSection('notices')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                adminSection === 'notices' ? 'bg-zinc-900 text-white font-extrabold' : 'hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Send className="w-4 h-4 text-indigo-500" />
              <span>Broadcast Notice</span>
            </button>

            <button
              onClick={() => setAdminSection('offerwalls')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                adminSection === 'offerwalls' ? 'bg-zinc-900 text-white font-extrabold' : 'hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-4 h-4 text-orange-500" />
              <span>Offerwalls Manager</span>
            </button>

            <button
              onClick={() => setAdminSection('settings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                adminSection === 'settings' ? 'bg-zinc-900 text-white font-extrabold' : 'hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Sliders className="w-4 h-4 text-zinc-400" />
              <span>App settings</span>
            </button>

            <button
              onClick={() => setAdminSection('storage')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                adminSection === 'storage' ? 'bg-zinc-900 text-white font-extrabold' : 'hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <HardDrive className="w-4 h-4 text-indigo-400" />
              <span>📁 Storage & Proofs Vault</span>
              {completionsQueue.filter(c => c.status === 'pending').length > 0 && (
                <span className="ml-auto bg-amber-600 text-[10px] text-white font-bold px-1.5 py-0.2 rounded-full">
                  {completionsQueue.filter(c => c.status === 'pending').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setAdminSection('coupons')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                adminSection === 'coupons' ? 'bg-zinc-900 text-white font-extrabold' : 'hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Key className="w-4 h-4 text-emerald-400 font-bold" />
              <span>🎟️ Coupons & Promo Creator</span>
            </button>

            <button
              onClick={() => setAdminSection('postback')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                adminSection === 'postback' ? 'bg-zinc-900 text-white font-extrabold' : 'hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Sliders className="w-4 h-4 text-emerald-400 font-bold" />
              <span>🔌 Ad Postback Console</span>
            </button>
          </div>
        </div>

        <button 
          onClick={handleAdminLogout}
          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-950/20 rounded-xl hover:text-red-400 transition-colors mt-8"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Admin</span>
        </button>
      </div>

      {/* ADMIN CONTENT WORKSPACE */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        
        {CampaignStore.isFirestoreQuotaExceeded && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-3xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-fade-in">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">⚠️</span>
              <div>
                <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm">Firestore Free Tier Quota Exhausted!</h4>
                <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed mt-1 max-w-2xl">
                  Your Firestore database has hit the daily free write units quota under Firebase's Spark Plan. 
                  <strong> No action is required: </strong> EarnOS has automatically and seamlessly downgraded to its integrated robust Express backup database server so that user logins, task completions, offerwalls, referral bonuses, and postbacks continue to process perfectly without data loss. 
                  However, standard real-time client Firestore syncing will be paused until the quota is reset or upgraded.
                </p>
              </div>
            </div>
            <a 
              href="https://console.firebase.google.com/project/smiling-aegis-brwfn/firestore/databases/ai-studio-b2a3bf79-f924-4bce-a9fe-4943d85bc827/data?openUpgradeDialog=true"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-600 hover:bg-amber-500 hover:scale-[1.02] shrink-0 font-bold text-white text-[10px] px-3.5 py-2 rounded-xl transition-all shadow shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              🚀 Upgrade Firestore Quota & Enable Spark/Blaze
            </a>
          </div>
        )}
        
        {/* SECTION A: TELEMETRY & REPORT CHART */}
        {adminSection === 'metrics' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h2 className="text-xl font-bold font-display">System Telemetry & Reports</h2>
                <p className="text-xs text-zinc-400">Total registered profiles and double-payout financials.</p>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">Live UTC: {new Date().toLocaleDateString()}</span>
            </div>

            {/* Metrics cards bento grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200/65 dark:border-zinc-800 p-4 rounded-3xl shadow-xs">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Total Registers</span>
                <h3 className="text-2xl font-black font-display text-slate-900 dark:text-zinc-100 mt-1">{totalUsersCount} users</h3>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">{activeUserTally} accounts unbanned</span>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-slate-200/65 dark:border-zinc-800 p-4 rounded-3xl shadow-xs">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Estimated Revenue</span>
                <h3 className="text-2xl font-black font-display text-blue-600 dark:text-blue-400 mt-1">₹{totalRevenueMock.toFixed(0)}</h3>
                <span className="text-[10px] text-emerald-500 mt-0.5 block">↑ Healthy CTR positive margins</span>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-slate-200/65 dark:border-zinc-800 p-4 rounded-3xl shadow-xs">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Pending Payouts</span>
                <h3 className="text-2xl font-black font-display text-orange-500 mt-1">₹{pendingPayoutTotal.toFixed(0)}</h3>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">{withdrawalsList.filter(w => w.status === 'pending').length} tickets pending</span>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-slate-200/65 dark:border-zinc-800 p-4 rounded-3xl shadow-xs">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Points Distributed</span>
                <h3 className="text-2xl font-black font-display text-purple-600 dark:text-purple-400 mt-1">₹{totalPointsDistributed.toFixed(0)}</h3>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">({totalPointsDistributed * CampaignStore.settings.pointsRate} coins)</span>
              </div>
            </div>

            {/* Custom Responsive SVG Earning Area Chart */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/65 dark:border-zinc-800 p-5 rounded-3xl">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Financial Payout Trends (Monthly Logs)</h3>
              
              {/* Handcrafted animated chart using raw SVG elements */}
              <div className="w-full h-44 relative">
                <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3182ce" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#3182ce" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1="0" y4="20" x2="500" y2="20" stroke="#cbd5e1" strokeDasharray="3,3" strokeOpacity="0.3" />
                  <line x1="0" y4="60" x2="500" y2="60" stroke="#cbd5e1" strokeDasharray="3,3" strokeOpacity="0.3" />
                  <line x1="0" y4="100" x2="500" y2="100" stroke="#cbd5e1" strokeDasharray="3,3" strokeOpacity="0.3" />
                  
                  {/* Filled Gards */}
                  <path 
                    d="M 0 120 L 50 80 L 120 100 L 200 40 L 300 70 L 400 30 L 500 15 L 500 120 Z" 
                    fill="url(#chartGrad)" 
                  />
                  
                  {/* Line Draw */}
                  <path 
                    d="M 0 120 L 50 80 L 120 100 L 200 40 L 300 70 L 400 30 L 500 15" 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="3.5" 
                  />
                  
                  {/* Dot Markers */}
                  <circle cx="50" cy="80" r="4.5" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
                  <circle cx="120" cy="100" r="4.5" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
                  <circle cx="200" cy="40" r="4.5" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
                  <circle cx="300" cy="70" r="4.5" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
                  <circle cx="400" cy="30" r="4.5" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
                  <circle cx="500" cy="15" r="4.5" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
                </svg>
              </div>

              {/* Chart legend label tags */}
              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono mt-3.5 px-2">
                <span>Dec 2025</span>
                <span>Jan 2026</span>
                <span>Feb 2026</span>
                <span>Mar 2026</span>
                <span>Apr 2026</span>
                <span>May 2026 (Active)</span>
              </div>
            </div>

            {/* Side by side mini ledger items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Manual Rate screenshots reviews queue */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200/65 dark:border-zinc-800 p-4 rounded-3xl space-y-3 shadow-xs">
                <h3 className="text-xs font-black text-slate-900 dark:text-zinc-100 flex items-center gap-1.5 uppercase tracking-widest">
                  📸 Screenshot Tasks Audit Review Queue
                </h3>
                {completionsQueue.filter(c => c.status === 'pending').length === 0 ? (
                  <p className="text-xs text-zinc-400 py-6 text-center">No rating proofs pending verification in queue.</p>
                ) : (
                  completionsQueue.filter(c => c.status === 'pending').map(comp => (
                    <div key={comp.id} className="p-3 bg-slate-50 dark:bg-zinc-950/60 rounded-2xl border space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-extrabold block">{comp.userEmail}</span>
                          <span className="text-[10px] text-zinc-400 font-medium">Activity: {comp.taskTitle}</span>
                        </div>
                        <span className="text-xs font-bold text-amber-500">+₹{comp.rewardAmount}</span>
                      </div>

                      {/* Attached proof preview */}
                      {comp.screenshotURL && (
                        <div className="border rounded-xl overflow-hidden max-h-32 bg-zinc-100 dark:bg-zinc-805">
                          <img src={getSafeImageUrl(comp.screenshotURL)} alt="task proof" className="w-full h-full object-cover" />
                        </div>
                      )}

                      {comp.textProof && (
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                          <span className="text-[9px] font-black text-indigo-700 dark:text-indigo-400 block uppercase tracking-wider">📝 Text Proof Submitted:</span>
                          <p className="font-mono text-[10px] text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900/60 rounded p-1.5 border border-zinc-100 dark:border-zinc-805 leading-snug break-all font-bold">
                            {comp.textProof}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleScreenshotTaskApprove(comp.id, 'completed')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 rounded text-[10px]"
                        >
                          Approve credit
                        </button>
                        <button 
                          onClick={() => handleScreenshotTaskApprove(comp.id, 'rejected')}
                          className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1 rounded border border-red-200 text-[10px]"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* High Earners leaderboard */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200/65 dark:border-zinc-800 p-4 rounded-3xl space-y-3 shadow-xs">
                <h3 className="text-xs font-black text-slate-900 dark:text-zinc-100 flex items-center gap-1.5 uppercase tracking-widest">
                  🏆 Dynamic Registers Ledgers (Audit Logs)
                </h3>
                <div className="space-y-2 divide-y divide-slate-100 dark:divide-zinc-800">
                  {usersList.slice().reverse().slice(0, 5).map((u, ui) => (
                    <div key={u.uid} className="pt-2 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold block">{u.displayName}</span>
                        <span className="text-[10px] text-zinc-400 font-mono tracking-wider w-36 block truncate">{u.email}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-emerald-600">₹{u.balances.totalEarnings.toFixed(2)}</span>
                        <span className="block text-[8px] text-zinc-400 font-mono">{u.deviceFingerprint}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SECTION B: MANAGING REGISTERED USERS & BALANCE CONTROLLER */}
        {adminSection === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
              <div>
                <h2 className="text-xl font-bold font-display text-slate-850 dark:text-zinc-50">User Profile Manager</h2>
                <p className="text-xs text-zinc-400">Search registrants, toggle Ban states, edit balances, and approve KYC.</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-48 shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                  <input 
                    type="text" 
                    placeholder="Search name/email..." 
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs rounded-xl focus:outline-none"
                  />
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!directUidLookup.trim()) return;
                    const foundUsr = usersList.find(u => u.uid.toLowerCase() === directUidLookup.trim().toLowerCase());
                    if (foundUsr) {
                      setInspectedUser(foundUsr);
                      setDirectUidLookup('');
                    } else {
                      alert(`❌ Account ID "${directUidLookup}" not found. Verify with target user code.`);
                    }
                  }} 
                  className="flex items-center gap-1 shrink-0"
                >
                  <input 
                    type="text" 
                    placeholder="Direct ID Lookup..." 
                    value={directUidLookup}
                    onChange={(e) => setDirectUidLookup(e.target.value)}
                    className="w-40 px-3 py-1.5 bg-white dark:bg-zinc-905 font-mono text-[11px] border border-slate-200 dark:border-zinc-800 focus:border-indigo-500 rounded-xl focus:outline-none placeholder:font-sans"
                  />
                  <button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Inspect
                  </button>
                </form>
              </div>
            </div>

            {/* Desktop User management table spreadsheet layout */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-950 text-[10px] uppercase font-bold text-zinc-400 tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                      <th className="py-3 px-4">Profile Info</th>
                      <th className="py-3 px-4">Device Fingerprint</th>
                      <th className="py-3 px-4">Finances balances</th>
                      <th className="py-3 px-4">KYC verification</th>
                      <th className="py-3 px-4">Audit Passport</th>
                      <th className="py-3 px-4">Ban State</th>
                      <th className="py-3 px-4 text-right">Adjust balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-zinc-400">No matching user accounts discovered.</td>
                      </tr>
                    ) : (
                      filteredUsers.map(usr => (
                        <tr key={usr.uid} className={usr.isBanned ? 'bg-red-50/20' : ''}>
                          <td className="py-3 px-4">
                            <span className="font-extrabold text-slate-900 dark:text-zinc-100 block">{usr.displayName} {usr.vipMember && '👑'}</span>
                            <span className="text-[10px] text-zinc-400 font-mono block">{usr.email}</span>
                            <span className="text-[9px] text-indigo-650 dark:text-indigo-400 font-medium block mt-1 bg-indigo-50/50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded-lg w-fit font-mono">
                              Password: <strong className="font-bold select-all">{usr.password || 'demo_password123'}</strong>
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-zinc-500 text-[10px]">
                            {usr.deviceFingerprint}
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <span className="block font-bold">Main: ₹{usr.balances.main.toFixed(2)}</span>
                              <span className="block text-[9px] text-zinc-400">Ref: ₹{usr.balances.referral.toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {usr.kycStatus === 'Pending' ? (
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => handleKycStatusChange(usr.uid, 'Approved')}
                                  className="bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded text-[9px]"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleKycStatusChange(usr.uid, 'Rejected')}
                                  className="bg-red-50 text-red-600 font-semibold px-1.5 py-0.5 rounded text-[9px] border border-red-200"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className={`text-[10px] font-extrabold py-0.5 px-1.5 rounded uppercase ${
                                usr.kycStatus === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                                usr.kycStatus === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-zinc-600 dark:bg-zinc-800'
                              }`}>
                                {usr.kycStatus}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => setInspectedUser(usr)}
                              className="px-2.5 py-1 text-[10px] rounded-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 transition-all hover:scale-105 cursor-pointer shadow-xs"
                            >
                              <Search className="w-3.5 h-3.5" />
                              <span>Audit Profile</span>
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => {
                                setSelectedUserObj(usr);
                                handleBanToggle(usr);
                              }}
                              className={`px-3 py-1 text-[10px] rounded-lg font-bold flex items-center gap-1 leading-none ${
                                usr.isBanned 
                                  ? 'bg-red-100 hover:bg-red-200 text-red-600' 
                                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:text-red-500'
                              }`}
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>{usr.isBanned ? 'Unban Account' : 'Ban account'}</span>
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedUserObj(usr);
                                setBalanceAdjustMode('adjust');
                                setBalanceAdjustVal('100');
                              }}
                              className="bg-zinc-950 text-white dark:bg-zinc-200 dark:text-zinc-950 font-bold px-3 py-1 rounded-lg text-[10px] inline-flex items-center gap-1 hover:scale-105 transition-transform"
                            >
                              <Edit className="w-3 h-3" /> Adjust
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected user balance adjustment modal dropdown overlay */}
            {selectedUserObj && balanceAdjustVal !== undefined && (
              <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl space-y-3.5 max-w-md shadow-lg">
                <div className="flex items-center justify-between pb-2 border-b">
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                    Adjust wallet balance for {selectedUserObj.displayName}
                  </h4>
                  <button onClick={() => setSelectedUserObj(null)} className="text-zinc-400 hover:text-zinc-650">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleBalanceUpdate} className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setBalanceAdjustWallet('main')}
                      className={`py-1.5 rounded-xl text-[10px] font-bold border transition-colors ${
                        balanceAdjustWallet === 'main' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/20' : 'border-zinc-100 font-medium text-zinc-400 dark:text-zinc-500 border-zinc-200/60 dark:border-zinc-850'
                      }`}
                    >
                      Withdrawable
                    </button>
                    <button
                      type="button"
                      onClick={() => setBalanceAdjustWallet('bonus')}
                      className={`py-1.5 rounded-xl text-[10px] font-bold border transition-colors ${
                        balanceAdjustWallet === 'bonus' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/20' : 'border-zinc-100 font-medium text-zinc-400 dark:text-zinc-500 border-zinc-200/60 dark:border-zinc-850'
                      }`}
                    >
                      Bonus
                    </button>
                    <button
                      type="button"
                      onClick={() => setBalanceAdjustWallet('referral')}
                      className={`py-1.5 rounded-xl text-[10px] font-bold border transition-colors ${
                        balanceAdjustWallet === 'referral' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/20' : 'border-zinc-100 font-medium text-zinc-400 dark:text-zinc-500 border-zinc-200/60 dark:border-zinc-850'
                      }`}
                    >
                      Invites wallet
                    </button>
                  </div>

                  {/* Highlight Current Wallet balance */}
                  <div className="bg-slate-50 dark:bg-zinc-800/40 p-3 rounded-2xl flex items-center justify-between border border-dashed border-slate-250 dark:border-zinc-700/80">
                    <span className="text-[10px] font-black uppercase text-zinc-400">Current Balance:</span>
                    <span className="text-xs font-black text-emerald-650 dark:text-emerald-400 font-mono">
                      ₹{(selectedUserObj.balances?.[balanceAdjustWallet] || 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Mode Selector */}
                  <div className="flex gap-2 bg-slate-50 dark:bg-zinc-800/20 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setBalanceAdjustMode('adjust');
                        setBalanceAdjustVal('100');
                      }}
                      className={`flex-1 py-1 rounded-lg text-[10px] mt-0 font-bold transition-all cursor-pointer text-center ${
                        balanceAdjustMode === 'adjust' 
                          ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm' 
                          : 'text-zinc-400 hover:text-zinc-650'
                      }`}
                    >
                      Add / Subtract (+ / -)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBalanceAdjustMode('set');
                        setBalanceAdjustVal(String((selectedUserObj.balances?.[balanceAdjustWallet] || 0)));
                      }}
                      className={`flex-1 py-1 rounded-lg text-[10px] mt-0 font-bold transition-all cursor-pointer text-center ${
                        balanceAdjustMode === 'set' 
                          ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm' 
                          : 'text-zinc-400 hover:text-zinc-650'
                      }`}
                    >
                      Set Balance (=)
                    </button>
                  </div>

                  <div>
                    {balanceAdjustMode === 'adjust' ? (
                      <>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Adjustment Amount (₹)</label>
                        <input 
                          type="number" 
                          step="any"
                          placeholder="e.g. 50"
                          value={balanceAdjustVal}
                          onChange={(e) => setBalanceAdjustVal(e.target.value)}
                          required
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750/60 rounded-xl text-xs text-slate-900 dark:text-zinc-100"
                        />
                        <small className="text-[9px] text-zinc-400 mt-1 block">Value can be negative to subtract from ledger bags (e.g. -50 to deduct 50 Rupees).</small>
                      </>
                    ) : (
                      <>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Set Dynamic Target Balance (₹)</label>
                        <div className="flex gap-2">
                          <input 
                            type="number" 
                            step="any"
                            placeholder="e.g. 0"
                            value={balanceAdjustVal}
                            onChange={(e) => setBalanceAdjustVal(e.target.value)}
                            required
                            className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750/60 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-zinc-100"
                          />
                          <button
                            type="button"
                            onClick={() => setBalanceAdjustVal('0')}
                            className="bg-red-500 hover:bg-red-650 text-white text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-wider cursor-pointer transition-colors"
                          >
                            Set to 0
                          </button>
                        </div>
                        <small className="text-[9px] text-zinc-400 mt-1 block">Specify any absolute value. Press the "Set to 0" button to make it exactly zero instantly.</small>
                      </>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-950 hover:bg-slate-905 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold py-2 rounded-xl text-xs shadow-sm transition-transform cursor-pointer hover:scale-[1.01]"
                  >
                    Confirm Adjustments
                  </button>
                </form>
              </div>
            )}

            {/* Detailed User Inspection Passport Modal */}
            {inspectedUser && (() => {
              // Calculation of audited achievements for the inspectedUser:
              const inspectedCompletes = completionsQueue.filter(c => c.userId === inspectedUser.uid);
              const totalCompletedCount = inspectedCompletes.filter(c => c.status === 'completed').length;
              const totalPendingCount = inspectedCompletes.filter(c => c.status === 'pending').length;
              const totalRejectedCount = inspectedCompletes.filter(c => c.status === 'rejected').length;

              // Screenshot submissions count
              const totalScreenshotsCount = inspectedCompletes.filter(c => c.screenshotURL && c.screenshotURL.trim() !== '').length;

              // Offerwall sum: Filter transactions for Offerwalls/CPX
              const userTransactions = (CampaignStore.transactions || []).filter(t => t.userId === inspectedUser.uid);
              const offerwallEarningSum = userTransactions
                .filter(t => t.description.toLowerCase().includes('offerwall') || t.description.toLowerCase().includes('survey') || t.description.toLowerCase().includes('cpx') || t.description.toLowerCase().includes('adgate') || t.description.toLowerCase().includes('ayet') || t.description.toLowerCase().includes('lootably'))
                .reduce((sum, t) => sum + t.amount, 0);

              // Promo codes claimed
              const userPromoTransactions = userTransactions.filter(t => t.type === 'promo_code');
              const promoEarningSum = userPromoTransactions.reduce((sum, t) => sum + t.amount, 0);
              const claimedPromoCodes = (CampaignStore.promoCodes || []).filter(pc => pc.claimedBy && pc.claimedBy.includes(inspectedUser.uid));

              // Ref referrals/invites:
              const invitedFriends = usersList.filter(u => 
                u.referredBy === inspectedUser.uid || 
                (inspectedUser.referralCode && u.referredBy === inspectedUser.referralCode)
              );

              // Referral bonus earned
              const userReferralsList = (CampaignStore.referrals || []).filter(r => r.referrerId === inspectedUser.uid);
              const referralEarningsSum = userReferralsList.reduce((sum, r) => sum + r.bonusEarned, 0);

              // Campaign Task Earnings Sum
              const campaignTaskEarningsSum = inspectedCompletes
                .filter(c => c.status === 'completed')
                .reduce((sum, c) => sum + (c.rewardAmount || 0), 0);

              return (
                <div className="fixed inset-0 bg-zinc-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                  <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative animate-fade-in my-8 max-h-[90vh] overflow-y-auto">
                    
                    {/* Close button */}
                    <button 
                      onClick={() => setInspectedUser(null)} 
                      className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {/* Profile Header */}
                    <div className="flex items-start gap-4 mb-6 pb-5 border-b border-slate-100 dark:border-zinc-800">
                      <div className="w-14 h-14 rounded-3xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-600/20 font-display shrink-0">
                        {inspectedUser.displayName.substring(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-black font-display text-slate-855 dark:text-zinc-100 flex items-center gap-1.5">
                            {inspectedUser.displayName} 
                            {inspectedUser.vipMember && <span className="text-amber-500 text-sm" title="VIP Member 👑">👑 VIP</span>}
                          </h3>
                          <span className="text-[10px] bg-indigo-50 dark:bg-zinc-850 text-indigo-600 dark:text-indigo-400 font-extrabold px-2 py-0.5 rounded-full uppercase">
                            {inspectedUser.userRank}
                          </span>
                          {inspectedUser.isBanned && (
                            <span className="text-[10px] bg-red-100 text-red-600 font-black px-2 py-0.5 rounded-full uppercase">
                              BANNED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">{inspectedUser.email}</p>
                        
                        {/* Unique Code Block */}
                        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">ID Code:</span>
                          <code className="font-mono text-[10px] font-extrabold bg-slate-50 dark:bg-zinc-950 px-2.5 py-0.5 rounded-lg border border-slate-150 dark:border-zinc-850 text-indigo-605 dark:text-indigo-400 select-all">
                            {inspectedUser.uid}
                          </code>
                          <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                          <span className="text-[9px] text-zinc-400">Fingerprint: <strong className="font-mono text-zinc-500 font-semibold">{inspectedUser.deviceFingerprint}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* 3-Column Achievements Bento Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      
                      {/* Tasks Summary */}
                      <div className="bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800 p-4 rounded-2xl flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest block mb-2">Campaign Tasks</span>
                          <h1 className="text-4xl font-extrabold font-display text-slate-800 dark:text-zinc-100 leading-none">
                            {totalCompletedCount} <span className="text-xs text-zinc-400 font-normal">done</span>
                          </h1>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-150/70 dark:border-zinc-850/60 flex items-center justify-between text-[11px]">
                          <span className="text-emerald-600 font-bold">✓ {totalCompletedCount} Paid</span>
                          <span className="text-amber-500 font-bold">⌛ {totalPendingCount} Pending</span>
                          <span className="text-red-500 font-bold">✗ {totalRejectedCount} Reject</span>
                        </div>
                      </div>

                      {/* Earnings Summary */}
                      <div className="bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800 p-4 rounded-2xl flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest block mb-2">Earnings Ledger</span>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-zinc-400">Campaign Tasks:</span>
                              <span className="font-extrabold text-emerald-600">₹{campaignTaskEarningsSum.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-zinc-400">Offerwalls:</span>
                              <span className="font-extrabold text-slate-800 dark:text-zinc-100">₹{offerwallEarningSum.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-zinc-400">Promo Coupons:</span>
                              <span className="font-extrabold text-slate-800 dark:text-zinc-100">₹{promoEarningSum.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-zinc-400">Invites:</span>
                              <span className="font-extrabold text-slate-800 dark:text-zinc-100">₹{referralEarningsSum.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-slate-150/70 dark:border-zinc-850/60 flex items-center justify-between text-[11px] font-bold">
                          <span className="text-zinc-400">Total:</span>
                          <span className="text-indigo-600 dark:text-indigo-400 text-sm">₹{(campaignTaskEarningsSum + offerwallEarningSum + promoEarningSum + referralEarningsSum).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Screnshot File Count */}
                      <div className="bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-805 p-4 rounded-2xl flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest block mb-2">Screenshot Proofs</span>
                          <h1 className="text-4xl font-extrabold font-display text-slate-805 dark:text-zinc-100 leading-none">
                            {totalScreenshotsCount} <span className="text-xs text-zinc-400 font-normal">uploads</span>
                          </h1>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-150/70 dark:border-zinc-850/60 text-[10px] text-zinc-405">
                          Total screenshot verification submissions captured.
                        </div>
                      </div>

                    </div>

                    {/* Details Lists rows */}
                    <div className="space-y-6">

                      {/* Screenshots scroll vault */}
                      {totalScreenshotsCount > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest block">Submitted Screenshots Log</span>
                          <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-thin">
                            {inspectedCompletes.filter(c => c.screenshotURL).map(c => (
                              <div key={c.id} className="w-40 shrink-0 border border-slate-150 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 rounded-xl overflow-hidden flex flex-col justify-between snap-start">
                                <div className="relative h-24 group">
                                  <img 
                                    src={getSafeImageUrl(c.screenshotURL)} 
                                    alt={c.taskTitle} 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute top-1 right-1">
                                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${
                                      c.status === 'completed' ? 'bg-emerald-500 text-white' :
                                      c.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white animate-pulse'
                                    }`}>
                                      {c.status}
                                    </span>
                                  </div>
                                </div>
                                <div className="p-2 space-y-0.5">
                                  <span className="text-[9.5px] font-extrabold text-slate-805 block truncate col-span-2" title={c.taskTitle}>
                                    {c.taskTitle}
                                  </span>
                                  <span className="text-[8px] text-zinc-400 block font-mono">ID: {c.id}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Promo Codes claimed */}
                      <div className="space-y-2.5">
                        <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest block">Claimed Promo Codes ({claimedPromoCodes.length})</span>
                        {claimedPromoCodes.length === 0 ? (
                          <p className="text-xs text-zinc-400 italic bg-slate-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-dashed dark:border-zinc-800">No promotional coupon keys claimed yet.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {claimedPromoCodes.map(pc => {
                              const trans = userPromoTransactions.find(t => t.description.includes(pc.code));
                              const rAmount = trans ? trans.amount : pc.rewardAmount;
                              return (
                                <div key={pc.id} className="px-3 py-1.5 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100/60 dark:border-indigo-900/40 rounded-xl text-xs flex items-center gap-2">
                                  <Gift className="w-3.5 h-3.5 text-indigo-650" />
                                  <span className="font-mono font-black text-slate-800 dark:text-zinc-200 uppercase">{pc.code}</span>
                                  <span className="w-1 h-1 rounded-full bg-indigo-200"></span>
                                  <span className="text-emerald-600 font-extrabold">+₹{rAmount?.toFixed(2)}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Referrals invited users */}
                      <div className="space-y-2.5">
                        <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest block">Invited Friends List ({invitedFriends.length})</span>
                        {invitedFriends.length === 0 ? (
                          <p className="text-xs text-zinc-400 italic bg-slate-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-dashed dark:border-zinc-800">No friends invited to register yet.</p>
                        ) : (
                          <div className="border border-slate-150 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
                            <div className="bg-slate-50 dark:bg-zinc-950 px-4 py-2 font-bold text-[9px] uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                              <span>Invited User Account details</span>
                              <span>Unique ID / Status</span>
                            </div>
                            {invitedFriends.map(friend => {
                              const rel = userReferralsList.find(r => r.refereeId === friend.uid);
                              return (
                                <div key={friend.uid} className="px-4 py-3 bg-white dark:bg-zinc-900/40 flex items-center justify-between hover:bg-slate-50/50">
                                  <div className="space-y-0.5">
                                    <div className="font-bold text-slate-805 dark:text-zinc-200 flex items-center gap-2">
                                      <span>{friend.displayName}</span>
                                      {friend.vipMember && <span className="text-[10px]">👑</span>}
                                    </div>
                                    <div className="text-[10px] text-zinc-400">{friend.email}</div>
                                    <div className="text-[8px] text-zinc-400">Joined: {friend.createdAt ? new Date(friend.createdAt).toLocaleDateString() : 'N/A'}</div>
                                  </div>
                                  <div className="text-right space-y-1">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <span className="text-[8px] font-mono text-zinc-400">UID:</span>
                                      <code className="font-mono text-[9px] font-extrabold bg-zinc-100 dark:bg-zinc-950 px-1.5 py-0.5 border dark:border-zinc-800 rounded text-slate-700 dark:text-zinc-300 select-all">
                                        {friend.uid}
                                      </code>
                                    </div>
                                    <div>
                                      <span className={`text-[8.5px] px-2 py-0.5 font-extrabold rounded-full uppercase leading-none ${
                                        rel?.status === 'completed' 
                                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' 
                                          : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                                      }`}>
                                        {rel?.status === 'completed' ? 'Referrer Paid (₹5)' : 'Pending Withdrawal'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Modal footer action */}
                    <div className="mt-8 pt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
                      <button 
                        onClick={() => setInspectedUser(null)}
                        className="bg-zinc-950 hover:bg-zinc-900 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-955 font-bold px-5 py-2 rounded-2xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        Close Passport
                      </button>
                    </div>

                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* SECTION C: TASKS INVENTORY AND CREATION WIZARD */}
        {adminSection === 'tasks' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h2 className="text-xl font-bold font-display">Standard Tasks Inventory</h2>
                <p className="text-xs text-zinc-400">Launch new app install, survey rating, or web timer tasks instantly.</p>
              </div>

              <button
                onClick={handleAddTaskClick}
                className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 font-bold rounded-2xl text-xs flex items-center gap-1 shadow-lg shadow-brand-500/10"
              >
                <Plus className="w-4 h-4" /> Add Custom Task
              </button>
            </div>

            {/* TROUBLESHOOTING CARD */}
            <div className="bg-amber-50/50 dark:bg-zinc-900/40 border border-amber-200/50 dark:border-zinc-800 p-4 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2 space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-amber-500 shrink-0" />
                  Force Delete Stuck Task / Campaign by ID
                </h3>
                <p className="text-[11px] text-zinc-500">
                  If any task continues to appear on user screens due to synchronization lag, or if you can't see it in the list below to delete it, input its ID below to wipe it completely.
                </p>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="e.g. t_custom_9wpyj5c"
                  id="force_delete_task_id_input"
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-105 placeholder:text-zinc-400 focus:outline-none"
                />
                <button
                  onClick={async () => {
                    const inputEl = document.getElementById('force_delete_task_id_input') as HTMLInputElement;
                    const targetId = inputEl?.value?.trim();
                    if (!targetId) {
                      alert('❌ Please enter a valid Task/Campaign ID to delete.');
                      return;
                    }
                    if (confirm(`Are you absolutely sure you want to FORCE-DELETE task "${targetId}" from all local and cloud storage models permanently? This action is IRREVERSIBLE.`)) {
                      try {
                        await CampaignStore.adminDeleteTask(targetId);
                        alert(`✅ Task "${targetId}" successfully deleted and recorded in deleted IDs registry.`);
                        if (inputEl) inputEl.value = '';
                        refreshLocalDatabase();
                        triggerRefresh();
                      } catch (err: any) {
                        alert(`❌ Error force-deleting: ${err.message || err}`);
                      }
                    }
                  }}
                  className="px-3 py-1.5 bg-red-605 text-white font-bold rounded-xl text-xs transition-colors whitespace-nowrap cursor-pointer hover:bg-red-700"
                >
                  Force Delete
                </button>
              </div>
            </div>

            {/* List custom tasks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasksList.map(task => (
                <div key={task.id} className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 p-4 rounded-3xl space-y-3.5 shadow-xs relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {task.logoUrl ? (
                        <img 
                          src={task.logoUrl} 
                          className="w-10 h-10 object-contain rounded-xl border border-slate-200/50 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-950 p-1" 
                          alt={task.title}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl border border-slate-200/50 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-950 p-1 flex items-center justify-center">
                          <Award className="w-5 h-5 text-indigo-500" />
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 font-mono">{task.category} Panel</span>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 leading-snug mt-1">{task.title}</h4>
                      </div>
                    </div>

                    <span className="text-xs font-black text-emerald-600 font-display">
                      +₹{task.rewardAmount.toFixed(2)}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-500 truncate">{task.description}</p>
                  
                  {task.url && (
                    <div className="text-[10px] text-brand-650 font-medium truncate w-full block bg-slate-50 dark:bg-zinc-950 p-1.5 rounded-lg border">
                      Campaign Landing: {task.url}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-slate-50 dark:border-zinc-800 pt-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-zinc-450">Verified: {task.verificationMethod}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
                      <span className="text-[9px] text-zinc-450">Cap: {task.dailyLimit} daily</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
                      <span className="text-[9px] text-indigo-500 font-extrabold" title="Max times of completions per single user">User Max Limit: {task.userMaxCompletions ? `${task.userMaxCompletions}x` : 'Unlimited'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTaskStatusToggle(task)}
                        className="text-zinc-400 hover:text-zinc-600"
                        title={task.isActive ? "Deactivate Task" : "Activate Task"}
                      >
                        {task.isActive ? (
                          <ToggleRight className="w-8 h-8 text-blue-500" />
                        ) : (
                          <ToggleLeft className="w-8 h-8" />
                        )}
                      </button>

                      <button
                        onClick={() => handleEditTaskClick(task)}
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-blue-600 dark:text-blue-400 transition-colors"
                        title="Edit Task Settings"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleTaskDelete(task.id)}
                        className="p-1 text-red-500 hover:bg-red-950/20 rounded-lg hover:text-red-400 transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add task Drawer overlay modal */}
        {showAddTaskModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                    <h3 className="text-sm font-black font-display uppercase tracking-widest text-zinc-400">
                      {isEditingTask ? 'Modify Task Details' : 'Launch Custom Earning Task'}
                    </h3>
                    <button onClick={() => setShowAddTaskModal(false)} className="text-zinc-400 hover:text-zinc-650">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveTask} className="grid grid-cols-2 gap-4 overflow-y-auto pr-1 flex-1">
                    <div className="col-span-2">
                       <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Task Title Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Subscribe to Earn Channel" 
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        required
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Description instruction</label>
                      <textarea 
                        placeholder="Provide clear steps for user to follow..." 
                        value={newTaskDesc}
                        onChange={(e) => setNewTaskDesc(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-100 h-16 focus:outline-none animate-none"
                      />
                    </div>

                    <div className={newTaskCategory === 'campaign' ? "col-span-2" : ""}>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Wallet Reward Amount (₹)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 15.00" 
                        value={newTaskReward}
                        required
                        onChange={(e) => setNewTaskReward(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                    {newTaskCategory !== 'campaign' && (
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Channel Category</label>
                        <select 
                          value={newTaskCategory}
                          onChange={(e) => setNewTaskCategory(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-100 focus:outline-none"
                        >
                          <option value="app_install" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">Android Install</option>
                          <option value="web_visit" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">Site Visit</option>
                          <option value="youtube" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">YouTube Subscribe</option>
                          <option value="telegram" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">Telegram Room</option>
                          <option value="rating" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">Reviews and Rating</option>
                          <option value="quiz" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">GK Quiz trivia</option>
                          <option value="campaign" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">Campaign (Redirect Link + Custom Logo)</option>
                        </select>
                      </div>
                    )}

                    {newTaskCategory !== 'campaign' && (
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5 flex justify-between items-center">
                          <span>Verification Methods (Choose 1 or more options)</span>
                          <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-extrabold bg-indigo-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md uppercase tracking-wider">Multi-Select</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                          {[
                            { val: 'auto', label: '⚡ Auto Instant Reward' },
                            { val: 'timer', label: '⏱️ Timer (Site visit)' },
                            { val: 'screenshot', label: '📸 Screenshot Proof Review' },
                            { val: 'ai_screenshot', label: '🤖 Gemini AI Auto-Verify' },
                            { val: 'text_proof', label: '📝 User Text Proof Input' },
                            { val: 'postback', label: '🔌 Webhook Postback Routing' }
                          ].map((opt) => {
                            const isChecked = newTaskVerificationMethods.includes(opt.val as VerificationType);
                            return (
                              <label 
                                key={opt.val} 
                                className={`flex items-center gap-2 p-2 rounded-xl border text-[10px] font-bold cursor-pointer select-none transition-all ${
                                  isChecked 
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900 dark:text-indigo-300' 
                                    : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-850 dark:text-zinc-350'
                                }`}
                              >
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      const remains = newTaskVerificationMethods.filter(m => m !== opt.val);
                                      setNewTaskVerificationMethods(remains);
                                      if (newTaskVerification === opt.val) {
                                        setNewTaskVerification(remains[0] || 'auto');
                                      }
                                    } else {
                                      const updated = [...newTaskVerificationMethods, opt.val as VerificationType];
                                      setNewTaskVerificationMethods(updated);
                                      setNewTaskVerification(opt.val);
                                    }
                                  }}
                                  className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer accent-indigo-600"
                                />
                                <span>{opt.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className={newTaskCategory === 'campaign' ? "col-span-2" : ""}>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Daily Limits Cap (Total Camp Limit)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 100" 
                        value={newTaskDailyLimit}
                        onChange={(e) => setNewTaskDailyLimit(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                    {newTaskCategory !== 'campaign' && (
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Max completions per user (0 = Unlimited)</label>
                        <input 
                          type="number" 
                          placeholder="e.g. 1" 
                          value={newTaskUserMaxCompletions}
                          onChange={(e) => setNewTaskUserMaxCompletions(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-100 focus:outline-none"
                        />
                        <span className="text-[9px] text-zinc-400 mt-1 block">Yek user is task ko kitni baar complete kar sakta hai. Unlimited ke liye 0 likhein.</span>
                      </div>
                    )}

                    <div className="col-span-2">
                       <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Redirection Landing Link URL (Optional)</label>
                      <input 
                        type="url" 
                        placeholder="http://play.google.com/store/details?id=..." 
                        value={newTaskUrl}
                        onChange={(e) => setNewTaskUrl(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                    {(newTaskVerificationMethods.includes('screenshot') || newTaskVerificationMethods.includes('ai_screenshot') || newTaskVerification === 'screenshot' || newTaskVerification === 'ai_screenshot') && (
                      <div className="col-span-2 space-y-1">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1.5">
                          <span>🎯 Target Package ID / App Name / Description Keyword (For AI Auto-Approval)</span>
                          <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-[8px] px-1.5 py-0.5 rounded-md font-black">AI Active</span>
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g., com.coinslayer.mobile, CoinsSlayer, or playstore review" 
                          value={newTaskRatingAppId}
                          onChange={(e) => setNewTaskRatingAppId(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-100 placeholder:text-zinc-400 font-mono focus:outline-none"
                        />
                        <p className="text-[9px] text-zinc-400 leading-normal">
                          If provided, our backend Gemini AI will automatically parse the uploaded screenshot at completion to approve/reject immediately!
                        </p>
                      </div>
                    )}

                    {(newTaskVerificationMethods.includes('text_proof') || newTaskVerification === 'text_proof') && (
                      <div className="col-span-2 space-y-1">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1.5">
                          <span>📝 User Text Proof Placeholder Instruction</span>
                          <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 text-[8px] px-1.5 py-0.5 rounded-md font-black text-center">User Form</span>
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g. Enter registered UPI ID, Game ID, Username..." 
                          value={newTaskTextProofPlaceholder}
                          onChange={(e) => setNewTaskTextProofPlaceholder(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
                        />
                        <p className="text-[9px] text-zinc-400 leading-normal">
                          Specify instructions or a guide on what text proof the participant should write (e.g. UPI ID or account username) to verify this task.
                        </p>
                      </div>
                    )}

                    {(newTaskVerificationMethods.includes('postback') || newTaskVerification === 'postback') && (
                      <div className="col-span-2 space-y-2.5 p-4 bg-indigo-50/50 dark:bg-zinc-800/20 rounded-2xl border border-indigo-100 dark:border-zinc-805">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase flex items-center justify-between">
                          <span className="text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center gap-1.5">
                            🔌 Auto-Generated Webhook Postback URL
                          </span>
                          <span className="bg-indigo-100 dark:bg-zinc-800 text-indigo-805 dark:text-indigo-305 text-[8px] px-1.5 py-0.5 rounded-md font-black">Ready to use</span>
                        </label>
                        <p className="text-[10px] text-zinc-455 dark:text-zinc-400 leading-normal font-medium">
                          Whenever a user completes this task, your sponsor or Ad Network should trigger this URL. Our server will automatically authorize the callback, verify parameters, and instantly credit the user's balances in real-time.
                        </p>
                        
                         {(() => {
                          const taskBaseUrl = (CampaignStore.settings.customPostbackDomain && CampaignStore.settings.customPostbackDomain.trim() !== '') 
                            ? CampaignStore.settings.customPostbackDomain.trim() 
                            : window.location.origin;
                          const standardUrl = `${taskBaseUrl}/api/postback?user_id={user_id}&reward=${newTaskReward || '10.0'}&secret_key=postback_secure_key_2026&task_id=${isEditingTask ? editingTaskId : 't_custom_dynamic'}`;
                          const whatsappSafeUrl = standardUrl.replace(/\{/g, '%7B').replace(/\}/g, '%7D');
                          return (
                            <div className="space-y-3.5">
                              <div>
                                <span className="text-[9px] font-bold text-zinc-444 uppercase tracking-wider block mb-1">Standard URL (Use this in Ad Networks)</span>
                                <div className="bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center gap-3 relative overflow-hidden">
                                  <div className="flex-1 font-mono text-[10.5px] text-zinc-300 break-all leading-relaxed select-all">
                                    {standardUrl}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(standardUrl);
                                      alert("📋 Standard Callback URL copied smoothly!");
                                    }}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-305 p-2 rounded-xl shrink-0 cursor-pointer text-center flex items-center justify-center transition-all shadow"
                                    title="Copy Standard URL"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div>
                                <span className="text-[9px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                                  🟢 WhatsApp & Message Clickable Link (Recommended for sharing in Chat)
                                </span>
                                <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3 flex items-center gap-3 relative overflow-hidden">
                                  <div className="flex-1 font-mono text-[10.5px] text-emerald-200 break-all leading-relaxed select-all">
                                    {whatsappSafeUrl}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(whatsappSafeUrl);
                                      alert("🟢 WhatsApp clickable URL copied smoothly!");
                                    }}
                                    className="bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-100 p-2 rounded-xl shrink-0 cursor-pointer text-center flex items-center justify-center transition-all shadow border border-emerald-500/20"
                                    title="Copy WhatsApp Clickable URL"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <p className="text-[9.5px] text-zinc-400 mt-1 font-medium leading-normal">
                                  💡 <strong>Tip:</strong> Messaging apps like WhatsApp truncate links starting at curly braces <code className="bg-zinc-100 dark:bg-zinc-805 px-1 rounded text-[8.5px] font-mono">{`{ }`}</code>. This page automatically converts them into percent-encoded <code className="bg-zinc-100 dark:bg-zinc-850 px-1 rounded text-[8.5px] font-mono">%7D</code> format so the complete link remains clicked & blue!
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                        <p className="text-[9px] text-zinc-400 leading-normal font-medium">
                          <span className="text-amber-500 font-bold">Note: </span>
                          Replace <code className="bg-zinc-150 dark:bg-zinc-800 px-1 py-0.5 rounded text-[8.5px] font-mono">{`{user_id}`}</code> with the parameter format of your sponsor network (e.g. <code className="bg-zinc-150 dark:bg-zinc-800 px-1 py-0.5 rounded text-[8.5px] font-mono">{`{subid}`}</code>, <code className="bg-zinc-150 dark:bg-zinc-800 px-1 py-0.5 rounded text-[8.5px] font-mono">{`{click_id}`}</code>, or <code className="bg-zinc-150 dark:bg-zinc-800 px-1 py-0.5 rounded text-[8.5px] font-mono">{`{s1}`}</code>). Our backend postback parser is optimized to track duplicates automatically using the task ID security parameters!
                        </p>
                      </div>
                    )}

                    <div className="col-span-2 space-y-2">
                      <label className="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        Custom Task Logo Image (Optional)
                      </label>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-805">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase block">Option A: Paste Logo Link</span>
                          <input 
                            type="text" 
                            placeholder="e.g. https://domain.com/my-task-icon.png" 
                            value={newTaskLogoUrl.startsWith('data:') ? '' : newTaskLogoUrl}
                            onChange={(e) => setNewTaskLogoUrl(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase block">Option B: Upload Logo File</span>
                          <input 
                            type="file" 
                            id="logo_image_file_picker"
                            accept="image/*"
                            onChange={handleUploadLogoFile}
                            className="hidden"
                          />
                          <button
                            type="button"
                            disabled={isUploadingLogo}
                            onClick={() => document.getElementById('logo_image_file_picker')?.click()}
                            className="w-full h-8 px-4 rounded-xl border border-dashed border-brand-300 dark:border-zinc-700 bg-white dark:bg-zinc-855 text-[10px] font-bold text-brand-600 dark:text-brand-300 hover:bg-brand-50/50 dark:hover:bg-zinc-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUploadingLogo ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            {isUploadingLogo ? 'Uploading Logo (Wait)...' : 'Direct Upload Logo (Max 10MB)'}
                          </button>
                        </div>
                      </div>

                      {newTaskLogoUrl && (
                        <div className="mt-1.5 p-2 bg-indigo-50/50 dark:bg-zinc-900/60 rounded-xl border border-indigo-100/50 dark:border-zinc-800 flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="w-8 h-8 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-900 flex items-center justify-center shrink-0">
                              <img 
                                src={newTaskLogoUrl} 
                                alt="Task Icon Preview" 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </span>
                            <div className="text-[10px] truncate pr-2">
                              <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase block tracking-wider text-[8px]">Task Logo Active:</span>
                              <span className="font-medium text-zinc-650 dark:text-zinc-350">
                                {newTaskLogoUrl.startsWith('data:') ? 'Custom local image file uploaded' : newTaskLogoUrl}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNewTaskLogoUrl('')}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 rounded-lg transition-colors shrink-0 cursor-pointer"
                            title="Clear logo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <p className="text-[9px] text-zinc-400 leading-normal font-medium">
                        Specify an image link (.png / .jpg) or upload a logo directly to customize this task's visual icon in the user application list. If left blank, it will show a standard award icon.
                      </p>
                    </div>

                    <div className="col-span-2 border-t border-dashed border-slate-200 dark:border-zinc-800 pt-3 space-y-4">
                      <div>
                        <span className="text-xs font-black font-display uppercase text-indigo-600 dark:text-indigo-400 tracking-wide block">💡 Task Tutorial & Guidance</span>
                        <p className="text-[10px] text-zinc-400">Users ko task complete karne ki real-time guide video ya guide image dikhaane ke liye details select karein ya dynamic file upload karein.</p>
                      </div>

                      {/* Video Walkthrough guidance */}
                      <div className="space-y-1.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-805">
                        <label className="block text-[10px] font-black text-zinc-400 dark:text-zinc-300 uppercase tracking-widest">
                          🎥 Video Walkthrough (Choose One Option)
                        </label>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase block">Option A: Paste Video Link</span>
                            <input 
                              type="text" 
                              placeholder="e.g. YouTube Embed, custom MP4 Link" 
                              value={newTaskTutorialVideoUrl.startsWith('data:') ? '' : newTaskTutorialVideoUrl}
                              onChange={(e) => setNewTaskTutorialVideoUrl(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase block">Option B: Upload Video File</span>
                            <input 
                              type="file" 
                              id="tutorial_video_file_picker"
                              accept="video/*"
                              onChange={handleUploadVideoFile}
                              className="hidden"
                            />
                            <button
                              type="button"
                              disabled={isUploadingVideo}
                              onClick={() => document.getElementById('tutorial_video_file_picker')?.click()}
                              className="w-full h-8 px-4 rounded-xl border border-dashed border-brand-300 dark:border-zinc-700 bg-white dark:bg-zinc-850 text-[10px] font-bold text-brand-600 dark:text-brand-300 hover:bg-brand-50/50 dark:hover:bg-zinc-800 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isUploadingVideo ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5" />
                              )}
                              {isUploadingVideo ? 'Uploading Video (Please Wait)...' : 'Direct Upload Video (Max 300MB)'}
                            </button>
                          </div>
                        </div>

                        {newTaskTutorialVideoUrl && (
                          <div className="mt-2.5 p-2 bg-indigo-50/50 dark:bg-zinc-900/60 rounded-xl border border-indigo-100/50 dark:border-zinc-800 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <Video className="w-4 h-4 text-emerald-500 shrink-0" />
                              <div className="text-[10px] truncate pr-2">
                                <span className="font-extrabold text-emerald-600 uppercase block tracking-wider text-[8px]">Walkthrough Video Active:</span>
                                <span className="font-medium text-zinc-650 dark:text-zinc-350">
                                  {newTaskTutorialVideoUrl.startsWith('data:') || newTaskTutorialVideoUrl.includes('/uploads/') ? 'Custom local video file uploaded' : newTaskTutorialVideoUrl}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setNewTaskTutorialVideoUrl('')}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 rounded-lg transition-colors shrink-0"
                              title="Clear video"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Image / Graphic Guidance */}
                      <div className="space-y-1.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-805">
                        <label className="block text-[10px] font-black text-zinc-400 dark:text-zinc-300 uppercase tracking-widest">
                          🖼️ Guide Screenshot / Image (Choose One Option)
                        </label>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase block">Option A: Paste Image Link</span>
                            <input 
                              type="text" 
                              placeholder="e.g. Unsplash, Host link" 
                              value={newTaskTutorialImageUrl.startsWith('data:') ? '' : newTaskTutorialImageUrl}
                              onChange={(e) => setNewTaskTutorialImageUrl(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase block">Option B: Upload Image File</span>
                            <input 
                              type="file" 
                              id="tutorial_image_file_picker"
                              accept="image/*"
                              onChange={handleUploadImageFile}
                              className="hidden"
                            />
                            <button
                              type="button"
                              disabled={isUploadingImage}
                              onClick={() => document.getElementById('tutorial_image_file_picker')?.click()}
                              className="w-full h-8 px-4 rounded-xl border border-dashed border-brand-300 dark:border-zinc-700 bg-white dark:bg-zinc-850 text-[10px] font-bold text-brand-600 dark:text-brand-300 hover:bg-brand-50/50 dark:hover:bg-zinc-800 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isUploadingImage ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5" />
                              )}
                              {isUploadingImage ? 'Uploading Image...' : 'Direct Upload Image (Max 10MB)'}
                            </button>
                          </div>
                        </div>

                        {newTaskTutorialImageUrl && (
                          <div className="mt-2.5 p-2 bg-indigo-50/50 dark:bg-zinc-900/60 rounded-xl border border-indigo-100/50 dark:border-zinc-800 flex items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0 bg-zinc-950">
                                <img src={newTaskTutorialImageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <div className="text-[10px] truncate pr-2">
                                <span className="font-extrabold text-emerald-600 uppercase block tracking-wider text-[8px]">Walkthrough Image Active:</span>
                                <span className="font-medium text-zinc-650 dark:text-zinc-350">
                                  {newTaskTutorialImageUrl.startsWith('data:') || newTaskTutorialImageUrl.includes('/uploads/') ? 'Custom local image file uploaded' : newTaskTutorialImageUrl}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setNewTaskTutorialImageUrl('')}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 rounded-lg transition-colors shrink-0"
                              title="Clear image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 pt-2">
                      <button
                        type="submit"
                        disabled={isUploadingVideo || isUploadingImage || isUploadingLogo}
                        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {(isUploadingVideo || isUploadingImage || isUploadingLogo) && (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        )}
                        {isUploadingVideo || isUploadingImage || isUploadingLogo 
                          ? 'Processing Uploaded Files (Please Wait)...' 
                          : (isEditingTask ? 'Save Task settings' : 'Launch Custom Campaign Live')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

        {/* SECTION FOR SPECIAL CAMPAIGNS INVENTORY */}
        {adminSection === 'campaigns' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h2 className="text-xl font-bold font-display text-slate-900 dark:text-zinc-100">Special Campaigns Inventory</h2>
                <p className="text-xs text-zinc-400">Launch and edit redirects campaigns, custom logos, rewards and links.</p>
              </div>

              <button
                onClick={() => {
                  setIsEditingTask(false);
                  setEditingTaskId('');
                  setNewTaskTitle('');
                  setNewTaskDesc('');
                  setNewTaskReward('');
                  setNewTaskCategory('campaign');
                  setNewTaskVerification('auto');
                  setNewTaskVerificationMethods(['auto']);
                  setNewTaskTextProofPlaceholder('');
                  setNewTaskDailyLimit('100');
                  setNewTaskUserMaxCompletions('0');
                  setNewTaskUrl('');
                  setNewTaskLogoUrl('');
                  setNewTaskTutorialVideoUrl('');
                  setNewTaskTutorialImageUrl('');
                  setShowAddTaskModal(true);
                }}
                className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 font-bold rounded-2xl text-xs flex items-center gap-1 shadow-lg shadow-brand-500/10 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add New Campaign
              </button>
            </div>

            {/* List custom campaigns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tasksList.filter(t => t.category === 'campaign').length === 0 ? (
                <div className="col-span-2 text-center py-12 bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 rounded-[32px] space-y-2">
                  <p className="text-sm font-bold text-zinc-400">No special campaigns available.</p>
                  <p className="text-xs text-zinc-400">Click the button above to add your first campaign!</p>
                </div>
              ) : (
                tasksList.filter(t => t.category === 'campaign').map(campaign => (
                  <div key={campaign.id} className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 p-5 rounded-3xl space-y-4 hover:shadow-md transition-shadow relative flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {campaign.logoUrl ? (
                            <img 
                              src={campaign.logoUrl} 
                              className="w-12 h-12 object-contain rounded-2xl border border-slate-200/50 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-950 p-1.5 shrink-0" 
                              alt={campaign.title}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl border border-slate-200/50 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-950 p-1.5 flex items-center justify-center shrink-0">
                              <Sparkles className="w-6 h-6 text-indigo-500 fill-indigo-200" />
                            </div>
                          )}
                          <div>
                            <span className="text-[10px] uppercase font-mono font-bold text-indigo-500">Special Campaign</span>
                            <h4 className="text-base font-extrabold text-slate-900 dark:text-zinc-100 leading-snug mt-0.5">{campaign.title}</h4>
                          </div>
                        </div>

                        <span className="text-sm font-black text-emerald-600 font-display">
                          +₹{campaign.rewardAmount.toFixed(2)}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-500 leading-relaxed">{campaign.description}</p>
                      
                      {campaign.url && (
                        <div className="p-3 bg-indigo-50/50 dark:bg-indigo-955/20 rounded-2xl border border-indigo-100/50 dark:border-zinc-850 space-y-1">
                          <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 block uppercase tracking-wider">🔗 Redirect URL Path:</span>
                          <p className="font-mono text-[10.5px] text-zinc-850 dark:text-zinc-200 bg-white dark:bg-zinc-900 rounded-lg p-2 border border-zinc-100 dark:border-zinc-800 leading-normal break-all font-semibold select-all">
                            {campaign.url}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 dark:border-zinc-800 pt-3.5 mt-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-450 font-semibold">
                        <span>Cap: {campaign.dailyLimit} daily</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                        <span className="text-indigo-500 font-bold">Limit: {campaign.userMaxCompletions ? `${campaign.userMaxCompletions}x` : 'Unlimited'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTaskStatusToggle(campaign)}
                          className="text-zinc-400 hover:text-zinc-650 cursor-pointer"
                          title={campaign.isActive ? "Deactivate Campaign" : "Activate Campaign"}
                        >
                          {campaign.isActive ? (
                            <ToggleRight className="w-8 h-8 text-indigo-500" />
                          ) : (
                            <ToggleLeft className="w-8 h-8" />
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setIsEditingTask(true);
                            setEditingTaskId(campaign.id);
                            setNewTaskTitle(campaign.title);
                            setNewTaskDesc(campaign.description);
                            setNewTaskReward(campaign.rewardAmount.toString());
                            setNewTaskCategory('campaign');
                            setNewTaskVerification(campaign.verificationMethod);
                            setNewTaskVerificationMethods(campaign.verificationMethods || [campaign.verificationMethod]);
                            setNewTaskTextProofPlaceholder(campaign.textProofPlaceholder || '');
                            setNewTaskSdkRequirements(campaign.sdkRequirements ? campaign.sdkRequirements.join('\n') : '');
                            setNewTaskDailyLimit(campaign.dailyLimit.toString());
                            setNewTaskUserMaxCompletions((campaign.userMaxCompletions !== undefined ? campaign.userMaxCompletions : 0).toString());
                            setNewTaskUrl(campaign.url || '');
                            setNewTaskRatingAppId(campaign.ratingAppId || '');
                            setNewTaskLogoUrl(campaign.logoUrl || '');
                            setNewTaskTutorialVideoUrl(campaign.tutorialVideoUrl || '');
                            setNewTaskTutorialImageUrl(campaign.tutorialImageUrl || '');
                            setShowAddTaskModal(true);
                          }}
                          className="p-1.5 px-2 bg-slate-50 dark:bg-zinc-800 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-700 text-indigo-650 dark:text-indigo-400 transition-colors font-bold text-xs flex items-center gap-1 cursor-pointer"
                          title="Edit Campaign Settings"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>

                        <button
                          onClick={() => handleTaskDelete(campaign.id)}
                          className="p-1.5 text-red-500 hover:bg-red-950/20 rounded-xl hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SECTION D: PAYOUT MODERATION QUEUES APPROVE / REJECT */}
        {adminSection === 'payouts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h2 className="text-xl font-bold font-display">UPI / Paytm / Bank Cashout Logs</h2>
                <p className="text-xs text-zinc-400">Moderating withdraw tickets before approving transaction proofs.</p>
              </div>

              <div className="flex gap-2 text-xs shrink-0 font-bold">
                <button 
                  onClick={() => setPayoutFilter('all')}
                  className={`px-3 py-1.5 rounded-lg border transition-colors ${
                    payoutFilter === 'all' ? 'border-zinc-950 bg-slate-950 text-white dark:bg-white dark:text-zinc-950' : 'border-zinc-100 font-medium bg-white dark:bg-zinc-900'
                  }`}
                >
                  All request
                </button>
                <button 
                  onClick={() => setPayoutFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg border transition-colors ${
                    payoutFilter === 'pending' ? 'border-zinc-950 bg-slate-950 text-white dark:bg-white dark:text-zinc-950' : 'border-zinc-100 font-medium bg-white dark:bg-zinc-900'
                  }`}
                >
                  Pending ({withdrawalsList.filter(w => w.status === 'pending').length})
                </button>
              </div>
            </div>

            {/* Desktop list payouts queue layout */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-950 border-b text-[10px] uppercase font-bold text-zinc-400">
                      <th className="py-3 px-4">Applicant details</th>
                      <th className="py-3 px-4">Destination channel</th>
                      <th className="py-3 px-4">Withdraw Amount</th>
                      <th className="py-3 px-4">Lodged Date</th>
                      <th className="py-3 px-4 text-right">Moderations actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {filteredPayouts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-400">No withdrawal requests identified under this profile search query.</td>
                      </tr>
                    ) : (
                      filteredPayouts.map(wd => (
                        <tr key={wd.id}>
                          <td className="py-3.5 px-4">
                            <span className="font-extrabold block">{wd.userEmail}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">ID: {wd.userId}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            <span className="block text-[11px] font-bold uppercase">{wd.paymentMethod}</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] text-zinc-600 dark:text-zinc-350 tracking-normal break-all font-semibold bg-slate-50 dark:bg-zinc-950 px-2 py-1 rounded-lg border border-slate-100 dark:border-zinc-850">
                                {wd.paymentDetails}
                              </span>
                              <button
                                onClick={() => handleCopyDetails(wd.id, wd.paymentDetails)}
                                title="Copy Payment Details / UPI ID"
                                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 rounded-lg hover:scale-105 transition-all cursor-pointer flex items-center justify-center shrink-0"
                              >
                                {copiedDetailsId === wd.id ? (
                                  <span className="text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-400 px-1 font-sans">Copied!</span>
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-black">
                            ₹{wd.amount}
                          </td>
                          <td className="py-3.5 px-4 text-zinc-450 text-[10px]">
                            {new Date(wd.requestedAt).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {wd.status === 'pending' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleWithdrawAction(wd.id, 'approved')}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3.5 rounded-lg text-[10px] shadow-sm flex items-center gap-1.5"
                                >
                                  <Check className="w-3.5 h-3.5" /> Approve Payout
                                </button>
                                <button
                                  onClick={() => {
                                    const r = prompt("Provide brief reason for payout rejection:");
                                    if (r) handleWithdrawAction(wd.id, 'rejected', r);
                                  }}
                                  className="border border-red-200 hover:bg-red-50 text-red-600 font-bold py-1.5 px-3 rounded-lg text-[10px]"
                                >
                                  Reject Refund
                                </button>
                              </div>
                            ) : (
                              <span className={`text-[10.5px] font-extrabold uppercase px-2.5 py-0.5 rounded-full inline-block ${
                                wd.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}>
                                Status: {wd.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECTION E: BROADCAST ANNOUNCEMENT MESSAGING */}
        {adminSection === 'notices' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h2 className="text-xl font-bold font-display">Broadcast & Targeted bulletins</h2>
                <p className="text-xs text-zinc-400">Publish urgent global alerts, payouts receipts proofs, or send direct message notifications to specific users by ID and Gmail.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <form onSubmit={handleSubmitBroadcast} className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-805 p-6 rounded-3xl space-y-4 shadow-sm text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Notice Alert Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 🛠️ Critical Bank transfer maintenance"
                    value={notifyTitle}
                    onChange={(e) => setNotifyTitle(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Broadcast content</label>
                  <textarea 
                    placeholder="Write message detailing rewards limits, double referrals commission payout timers..."
                    value={notifyDesc}
                    onChange={(e) => setNotifyDesc(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl h-24 text-slate-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Notice Type tag</label>
                  <select 
                    value={notifyType}
                    onChange={(e) => setNotifyType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="announcement" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">Announcement Carousel Ticker (Default Blue)</option>
                    <option value="update" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">Platform System Update (Purple)</option>
                    <option value="alert" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">Critical Alert Banner (Amber Warning)</option>
                  </select>
                </div>

                {/* Targeted User System */}
                <div className="bg-slate-50 dark:bg-zinc-850 p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 space-y-3">
                  <h4 className="font-bold text-[10px] text-zinc-505 dark:text-zinc-305 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    🎯 Target Specific Recipient (Optional)
                  </h4>
                  <p className="text-[9px] text-zinc-400 leading-relaxed">
                    Fill these fields to send this notice <strong>exclusively</strong> to a single user. To send an app-wide broadcast announcement, leave them completely blank!
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] text-zinc-400 mb-1 font-semibold uppercase tracking-wider">Target User ID (UID)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. user_92fsh1k"
                        value={notifyTargetUserId}
                        onChange={(e) => setNotifyTargetUserId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-zinc-100 focus:outline-none placeholder-zinc-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-zinc-400 mb-1 font-semibold uppercase tracking-wider">Target User Email/Gmail</label>
                      <input 
                        type="email" 
                        placeholder="e.g. soumomomdal15@gmail.com"
                        value={notifyTargetEmail}
                        onChange={(e) => setNotifyTargetEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-zinc-100 focus:outline-none placeholder-zinc-400"
                      />
                    </div>
                  </div>

                  {/* Live Registered User Search Assistant */}
                  <div className="pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                    <label className="block text-[9px] text-zinc-400 mb-1 font-semibold uppercase tracking-wider">
                      🔍 Live User Search Helper
                    </label>
                    <input
                      type="text"
                      placeholder="Search registered user by name/email/ID..."
                      value={notifySearchQuery}
                      onChange={(e) => setNotifySearchQuery(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-zinc-100 focus:outline-none placeholder-zinc-400 text-[10px]"
                    />
                    {notifySearchQuery.trim() && (
                      <div className="mt-1.5 max-h-32 overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-1 space-y-1 block shadow-md z-45">
                        {usersList
                          .filter(u => 
                            u.email.toLowerCase().includes(notifySearchQuery.toLowerCase()) ||
                            u.displayName.toLowerCase().includes(notifySearchQuery.toLowerCase()) ||
                            u.uid.toLowerCase().includes(notifySearchQuery.toLowerCase())
                          )
                          .slice(0, 5)
                          .map(u => (
                            <div 
                              key={u.uid}
                              onClick={() => {
                                setNotifyTargetUserId(u.uid);
                                setNotifyTargetEmail(u.email);
                                setNotifySearchQuery('');
                              }}
                              className="p-1.5 hover:bg-slate-105 dark:hover:bg-zinc-800 rounded-md cursor-pointer flex items-center justify-between text-[10px]"
                            >
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 dark:text-zinc-200">{u.displayName}</span>
                                <span className="text-[9px] text-zinc-400">{u.email}</span>
                              </div>
                              <span className="text-[9px] text-indigo-500 font-mono font-black">{u.uid}</span>
                            </div>
                          ))}
                        {usersList.filter(u => 
                          u.email.toLowerCase().includes(notifySearchQuery.toLowerCase()) ||
                          u.displayName.toLowerCase().includes(notifySearchQuery.toLowerCase()) ||
                          u.uid.toLowerCase().includes(notifySearchQuery.toLowerCase())
                        ).length === 0 && (
                          <div className="p-2 text-zinc-400 text-center text-[9px]">No matching user found.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {notifySuccessMsg && (
                  <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/40 font-semibold text-[11px]">
                    {notifySuccessMsg}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-slate-950 hover:bg-slate-900 text-white dark:bg-white dark:text-zinc-950 font-bold py-2.5 rounded-xl text-xs"
                >
                  Deliver Notice / bulletin
                </button>
              </form>

              {/* SENT NOTIFICATIONS TIMELINE TABLE */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-805 p-6 rounded-3xl space-y-4 shadow-sm text-xs">
                <div>
                  <h3 className="text-sm font-bold font-display">📜 Sent Bulletins & Campaign Logs</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Below are all active notices in circulation. You can delete outdated notices instantly.</p>
                </div>

                <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[10px] uppercase text-zinc-400 tracking-wider">
                        <th className="py-2">Type</th>
                        <th className="py-2">Notice Info</th>
                        <th className="py-2">Targeting</th>
                        <th className="py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CampaignStore.notifications.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-zinc-400 italic">No sent notices found.</td>
                        </tr>
                      ) : (
                        CampaignStore.notifications.map((n) => {
                          const isPersonal = n.targetUserId || n.targetEmail;
                          return (
                            <tr key={n.id} className="border-b border-zinc-50 dark:border-zinc-850 hover:bg-slate-50/50 dark:hover:bg-zinc-850/50 text-[11px]">
                              <td className="py-3 pr-2">
                                <span className={`text-[8px] uppercase font-mono font-bold px-1.5 py-0.5 rounded-full ${
                                  n.type === 'alert' 
                                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' 
                                    : n.type === 'update' 
                                      ? 'bg-purple-150 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400' 
                                      : 'bg-blue-105 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400'
                                }`}>
                                  {n.type}
                                </span>
                              </td>
                              <td className="py-3 max-w-xs pr-4">
                                <div className="font-bold text-slate-800 dark:text-zinc-200">{n.title}</div>
                                <div className="text-[10px] text-zinc-400 mt-0.5 max-h-12 overflow-hidden overflow-ellipsis line-clamp-2">{n.message}</div>
                                <span className="text-[8px] text-zinc-405 font-mono block mt-1">
                                  {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </td>
                              <td className="py-3">
                                {isPersonal ? (
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] bg-amber-500 text-white font-bold px-1 py-0.2 rounded-full uppercase tracking-wider block w-fit">
                                      Targeted User
                                    </span>
                                    {n.targetEmail && <span className="text-[9px] text-zinc-400 block font-mono">Mail: {n.targetEmail}</span>}
                                    {n.targetUserId && <span className="text-[9px] text-zinc-400 block font-mono">UID: {n.targetUserId}</span>}
                                  </div>
                                ) : (
                                  <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase">
                                    📢 Global Feed
                                  </span>
                                )}
                              </td>
                              <td className="py-3 text-right">
                                <button 
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this notification from all feeds?")) {
                                      CampaignStore.adminDeleteNotification(n.id);
                                      refreshLocalDatabase();
                                      triggerRefresh();
                                    }
                                  }}
                                  className="bg-red-50 hover:bg-red-100 dark:bg-red-950/25 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold text-[9px] px-2 py-1 rounded-xl border border-red-100 dark:border-red-900/30 transition-all cursor-pointer"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {adminSection === 'storage' && (
          <div className="space-y-6 animate-fade-in">
            <div className="pb-4 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold font-display">📁 Screenshot Proofs & Storage</h2>
                <p className="text-xs text-zinc-400">Manage all participant screenshot uploads, automated Gemini AI logs, and storage telemetry.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    if (pendingPurgeTrash) {
                      CampaignStore.purgeRejectedCompletions();
                      refreshLocalDatabase();
                      triggerRefresh();
                      setPendingPurgeTrash(false);
                    } else {
                      setPendingPurgeTrash(true);
                      setTimeout(() => setPendingPurgeTrash(false), 4500);
                    }
                  }}
                  className={`border font-bold px-3 py-1.5 rounded-2xl text-[10px] uppercase tracking-wider font-mono flex items-center gap-1.5 cursor-pointer transition-all ${
                    pendingPurgeTrash 
                      ? 'bg-red-650 text-white border-red-750 animate-pulse'
                      : 'bg-red-50 hover:bg-red-105 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/40'
                  }`}
                >
                  {pendingPurgeTrash ? '⚠️ Confirm Purge Trash?' : '🧹 Clear Trash Files'}
                </button>
              </div>
            </div>

            {/* Storage Stats Telemetry Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 p-4 rounded-3xl space-y-1">
                <span className="text-[9px] uppercase font-black text-zinc-400 font-mono tracking-widest block">Total Uploaded Files</span>
                <span className="text-xl font-black">{completionsQueue.length} items</span>
                <span className="text-[9px] text-zinc-400 block font-medium">Virtual files initialized</span>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 p-4 rounded-3xl space-y-1">
                <span className="text-[9px] uppercase font-black text-amber-500 font-mono tracking-widest block">Pending Review</span>
                <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                  {completionsQueue.filter(c => c.status === 'pending').length} items
                </span>
                <span className="text-[9px] text-zinc-400 block font-medium">Requires audit checks</span>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 p-4 rounded-3xl space-y-1">
                <span className="text-[9px] uppercase font-black text-emerald-500 font-mono tracking-widest block">Approved Proofs</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {completionsQueue.filter(c => c.status === 'completed').length} items
                </span>
                <span className="text-[9px] text-zinc-400 block font-medium">Auto-rewarded users</span>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 p-4 rounded-3xl space-y-1">
                <span className="text-[9px] uppercase font-black text-indigo-500 font-mono tracking-widest block">Active Storage Size</span>
                <span className="text-xl font-black text-indigo-650 dark:text-indigo-400">
                  {(completionsQueue.length * 1.15).toFixed(2)} MB
                </span>
                <span className="text-[9px] text-zinc-400 block font-medium">Avg ~1.15MB per file block</span>
              </div>
            </div>

            {/* Filter Controls Row */}
            <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-3xl border border-slate-200/40 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { key: 'all', label: '🗄️ All Uploaded Files' },
                  { key: 'pending', label: '⏳ Pending' },
                  { key: 'completed', label: '✅ Approved' },
                  { key: 'rejected', label: '❌ Rejected' }
                ].map((btn) => (
                  <button
                    key={btn.key}
                    type="button"
                    onClick={() => setStorageFilter(btn.key as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      storageFilter === btn.key 
                        ? 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 font-extrabold shadow-xs'
                        : 'bg-white dark:bg-zinc-900 text-zinc-650 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by participant email or Task description..."
                  value={storageSearch}
                  onChange={(e) => setStorageSearch(e.target.value)}
                  className="w-full md:w-64 px-4 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-sans placeholder:text-zinc-400 text-zinc-800 dark:text-zinc-100"
                />
              </div>
            </div>

            {/* Storage Gallery Grid */}
            {completionsQueue.filter(c => {
              if (storageFilter !== 'all' && c.status !== storageFilter) return false;
              if (storageSearch) {
                const searchLower = storageSearch.toLowerCase();
                const emailMatch = (c.userEmail || "").toLowerCase().includes(searchLower);
                const titleMatch = (c.taskTitle || "").toLowerCase().includes(searchLower);
                return emailMatch || titleMatch;
              }
              return true;
            }).length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 rounded-[32px] space-y-2">
                <p className="text-sm font-bold text-zinc-400">No screenshot files match your filter parameters.</p>
                <p className="text-xs text-zinc-400">User uploads automatically store screenshot proofs in client-side storage structures.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {completionsQueue.filter(c => {
                  if (storageFilter !== 'all' && c.status !== storageFilter) return false;
                  if (storageSearch) {
                    const searchLower = storageSearch.toLowerCase();
                    const emailMatch = (c.userEmail || "").toLowerCase().includes(searchLower);
                    const titleMatch = (c.taskTitle || "").toLowerCase().includes(searchLower);
                    return emailMatch || titleMatch;
                  }
                  return true;
                }).map(comp => (
                  <div key={comp.id} className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
                       {/* Image Preview click triggered if present */}
                      {comp.screenshotURL ? (
                        <div className="relative cursor-zoom-in group" onClick={() => setZoomedImage(comp)}>
                          <img 
                            src={getSafeImageUrl(comp.screenshotURL)} 
                            alt="user proof screenshot" 
                            className="w-full h-44 object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-3 right-3">
                            <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-lg border shadow-sm ${
                              comp.status === 'completed' ? 'bg-emerald-100 text-emerald-850 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-350 dark:border-emerald-800' :
                              comp.status === 'rejected' ? 'bg-red-100 text-red-850 border-red-300 dark:bg-red-950/90 dark:text-red-350 dark:border-red-800' :
                              'bg-amber-100 text-amber-850 border-amber-300 dark:bg-amber-950/95 dark:text-amber-350 dark:border-amber-800 animate-pulse'
                            }`}>
                              {comp.status}
                            </span>
                          </div>
                          <div className="absolute bottom-2 left-2 bg-black/60 text-[8px] text-zinc-200 px-1.5 py-0.5 rounded font-mono">
                            🔍 Click to zoom
                          </div>
                        </div>
                      ) : (
                        <div className="bg-indigo-50/50 dark:bg-indigo-950/10 h-32 flex flex-col items-center justify-center gap-1.5 border-b border-dashed dark:border-zinc-850 relative">
                          <span className="text-[10px] font-black tracking-wider text-indigo-600 dark:text-indigo-400">📝 TEXT PROOF ONLY</span>
                          <div className="absolute top-3 right-3">
                            <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-lg border shadow-sm ${
                              comp.status === 'completed' ? 'bg-emerald-100 text-emerald-850 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-350 dark:border-emerald-800' :
                              comp.status === 'rejected' ? 'bg-red-100 text-red-850 border-red-300 dark:bg-red-950/90 dark:text-red-350 dark:border-red-800' :
                              'bg-amber-100 text-amber-850 border-amber-300 dark:bg-amber-950/95 dark:text-amber-350 dark:border-amber-800 animate-pulse'
                            }`}>
                              {comp.status}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="p-4 space-y-3">
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-400 font-mono font-bold block">Participant Acc:</span>
                          <span className="text-xs font-black text-slate-900 dark:text-zinc-100 block truncate" title={comp.userEmail}>
                            {comp.userEmail}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-400 font-mono block">Campaign Title:</span>
                          <span className="text-xs font-bold text-zinc-650 dark:text-zinc-300 block truncate" title={comp.taskTitle}>
                            {comp.taskTitle}
                          </span>
                        </div>

                        {comp.textProof && (
                          <div className="p-2.5 bg-indigo-50/80 dark:bg-indigo-950/25 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-1">
                            <span className="text-[9px] font-black text-indigo-700 dark:text-indigo-450 block uppercase tracking-wider">📝 Text Evidence:</span>
                            <p className="font-mono text-[10px] text-zinc-850 dark:text-zinc-200 bg-white dark:bg-zinc-900/80 rounded p-1.5 border border-zinc-100 dark:border-zinc-805 leading-snug break-all font-semibold">
                              {comp.textProof}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] bg-slate-50 dark:bg-zinc-950/60 p-2 rounded-xl text-zinc-500 font-mono">
                          <span>Reward: ₹{comp.rewardAmount}</span>
                          <span className="text-[9px]">{new Date(comp.completedAt).toLocaleDateString()}</span>
                        </div>

                        {comp.screenshotURL && (
                          <button
                            onClick={() => handleDownloadImage(getSafeImageUrl(comp.screenshotURL) || '', `proof-${comp.userEmail.replace(/[@.]/g, '_')}-${comp.id}.png`)}
                            className="w-full mt-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 py-1.5 px-3 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 hover:scale-[1.01] transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" /> Save to Device / Gallery
                          </button>
                        )}
                      </div>

                      <div className="p-4 pt-0 border-t border-slate-50 dark:border-zinc-800 mt-2 space-y-2 bg-slate-50/50 dark:bg-zinc-950/20">
                      {comp.status === 'pending' && (
                        <div className="flex gap-2 w-full pt-3">
                          <button
                            onClick={() => handleScreenshotTaskApprove(comp.id, 'completed')}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] py-1.5 rounded-xl uppercase transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleScreenshotTaskApprove(comp.id, 'rejected')}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] py-1.5 rounded-xl uppercase transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between w-full pt-2">
                        {comp.status !== 'pending' ? (
                          <button
                            onClick={() => {
                              if (pendingResetId === comp.id) {
                                CampaignStore.adminUpdateTaskCompletionStatus(comp.id, 'pending');
                                refreshLocalDatabase();
                                triggerRefresh();
                                setPendingResetId(null);
                              } else {
                                setPendingResetId(comp.id);
                                setPendingDeleteId(null);
                                setTimeout(() => setPendingResetId(null), 4000);
                              }
                            }}
                            className={`text-[9px] font-mono cursor-pointer transition-all px-1.5 py-0.5 rounded-lg font-bold ${
                              pendingResetId === comp.id 
                                ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 animate-pulse' 
                                : 'text-zinc-400 hover:underline hover:text-zinc-650'
                            }`}
                          >
                            {pendingResetId === comp.id ? '⚠️ Confirmed? Reset Status' : '🔄 Reset status'}
                          </button>
                        ) : (
                          <span className="text-[9px] text-amber-500 font-bold uppercase">⏳ Pending Audit</span>
                        )}

                        <button
                          onClick={async () => {
                            if (pendingDeleteId === comp.id) {
                              await CampaignStore.adminHideTaskCompletion(comp.id);
                              refreshLocalDatabase();
                              triggerRefresh();
                              setPendingDeleteId(null);
                            } else {
                              setPendingDeleteId(comp.id);
                              setPendingResetId(null);
                              setTimeout(() => setPendingDeleteId(null), 4000);
                            }
                          }}
                          className={`text-[9px] font-bold cursor-pointer transition-all px-1.5 py-0.5 rounded-lg ${
                            pendingDeleteId === comp.id 
                              ? 'text-white bg-red-600 hover:bg-red-700' 
                              : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'
                          }`}
                        >
                          {pendingDeleteId === comp.id ? '⚠️ Confirm Delete!' : '🗑️ Delete Proof'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Live Media Zoom Modal */}
            {zoomedImage && (
              <div 
                className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4"
                onClick={() => setZoomedImage(null)}
              >
                <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[32px] overflow-hidden border dark:border-zinc-800 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between p-4 border-b">
                    <div>
                      <h4 className="text-xs font-black font-display uppercase tracking-widest text-zinc-450">Media Lightbox Auditor</h4>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate max-w-md">{zoomedImage.taskTitle} • {zoomedImage.userEmail}</p>
                    </div>
                    <button onClick={() => setZoomedImage(null)} className="text-zinc-400 hover:text-zinc-700 p-1 bg-slate-100 dark:bg-zinc-800 rounded-full cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-slate-950 flex items-center justify-center p-2 min-h-[350px] max-h-[500px] overflow-auto">
                    <img 
                      src={getSafeImageUrl(zoomedImage.screenshotURL)} 
                      alt="enlarged participant screenshot" 
                      className="max-w-full max-h-[480px] object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-zinc-950 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <span className="block font-bold">Completion Time:</span>
                      <span className="text-zinc-450 font-mono text-[10px]">{new Date(zoomedImage.completedAt).toLocaleString()}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownloadImage(getSafeImageUrl(zoomedImage.screenshotURL), `proof-${zoomedImage.userEmail.replace(/[@.]/g, '_')}-${zoomedImage.id}.png`)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl uppercase text-[10px] cursor-pointer flex items-center gap-1"
                        title="Download proof screenshot to your device / gallery"
                      >
                        <Download className="w-3.5 h-3.5" /> Save Image
                      </button>
                      <button
                        onClick={() => {
                          handleScreenshotTaskApprove(zoomedImage.id, 'completed');
                          setZoomedImage(null);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-xl uppercase text-[10px] cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          handleScreenshotTaskApprove(zoomedImage.id, 'rejected');
                          setZoomedImage(null);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-1.5 rounded-xl uppercase text-[10px] cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION F: ADMIN SETTINGS PANEL AND ADMOB KEYS CONFIG */}
        {adminSection === 'settings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h2 className="text-xl font-bold font-display">System Settings & Integrated Ads IDs</h2>
                <p className="text-xs text-zinc-400">Configure minimum payouts constraints, tiered referrals factors, and AdMob test IDs.</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs text-zinc-700 dark:text-zinc-300">
              
              {/* General App controls */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 p-6 rounded-3xl space-y-4 shadow-sm">
                <h3 className="text-xs font-black uppercase text-slate-900 dark:text-zinc-100 font-display">General App Rules</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Application Name</label>
                    <input 
                      type="text" 
                      value={appNameInput}
                      onChange={(e) => setAppNameInput(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Exchange rate (Rs 1 = X Coins)</label>
                    <input 
                      type="number" 
                      value={rateInput}
                      onChange={(e) => setRateInput(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono text-slate-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Minimum withdraws (₹)</label>
                    <input 
                      type="number" 
                      value={minWithdrawInput}
                      onChange={(e) => setMinWithdrawInput(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono text-slate-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Maintenance state Mode</label>
                    <select 
                      value={maintMode ? 'on' : 'off'}
                      onChange={(e) => setMaintMode(e.target.value === 'on')}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100 focus:outline-none font-medium"
                    >
                      <option value="off" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">Deactivated: App works fully</option>
                      <option value="on" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">Activated: Blocks all user features</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/30 dark:bg-zinc-950/40 rounded-2xl border border-indigo-100/50 dark:border-zinc-800 space-y-2">
                  <label className="block text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">Lock Postback Base Domain URL (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. https://my-production-earnos-site.com" 
                    value={customPostbackDomainInput}
                    onChange={(e) => setCustomPostbackDomainInput(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono text-xs text-slate-900 dark:text-zinc-100 placeholder:text-zinc-450 focus:outline-none"
                  />
                  <p className="text-[8.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
                    By default, displayed postback links change depending on your active browser tab (e.g. Dev app vs. Published app). <strong>Enter your final Shared App URL/Custom Domain</strong> here to lock the postback generation permanently!
                  </p>
                </div>

                {/* Level referrals controls */}
                <h4 className="text-[11px] font-black uppercase text-zinc-400 pt-2 font-display border-t border-slate-50 dark:border-zinc-800">
                  Referral Reward System Config
                </h4>
                
                <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-950 text-[10px] text-emerald-800 dark:text-emerald-400 leading-relaxed">
                  <strong>🚀 Direct Payout Referral Rules:</strong>
                  <p className="mt-1">
                    Multi-level tiered rates are bypassed. The referrer receives exactly <strong>₹5.00 withdrawable cash</strong> logged into their direct balance immediately when their referred teammate successfully completes their first approved withdrawal request on the task simulation!
                  </p>
                </div>
              </div>

              {/* Integrated AdMob Ad spots configuration keys */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 p-6 rounded-3xl space-y-4 shadow-sm">
                <h3 className="text-xs font-black uppercase text-slate-900 dark:text-zinc-100 font-display">AdMob Placements config IDs</h3>
                
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">AdMob active Banner Ads</label>
                  <select 
                    value={blockBanners ? 'on' : 'off'}
                    onChange={(e) => setBlockBanners(e.target.value === 'on')}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="on" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">Activated Displays</option>
                    <option value="off" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">Deactivated System-wide</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Banner Ad Unit ID</label>
                  <input 
                    type="text" 
                    value={bannerIdField}
                    onChange={(e) => setBannerIdField(e.target.value)}
                    className="w-full px-3.5 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono text-[11px] text-slate-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Interstitial Ad Unit ID</label>
                  <input 
                    type="text" 
                    value={interstitialIdField}
                    onChange={(e) => setInterstitialIdField(e.target.value)}
                    className="w-full px-3.5 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono text-[11px] text-slate-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Rewarded Ad Unit ID</label>
                  <input 
                    type="text" 
                    value={rewardedIdField}
                    onChange={(e) => setRewardedIdField(e.target.value)}
                    className="w-full px-3.5 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-mono text-[11px] text-slate-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="col-span-1 lg:col-span-2 pt-2">
                <button
                  type="submit"
                  className="w-full bg-slate-950 hover:bg-slate-900 text-white dark:bg-white dark:text-zinc-950 font-bold py-3 rounded-2xl shadow-lg shadow-zinc-800/10 transition-transform hover:scale-[1.002] cursor-pointer"
                >
                  Save Global Campaign Configurations
                </button>
              </div>

            </form>

            {/* SECURE DATABASE BACKUP & RESTORE MODULE TO PREVENT DATA LOSS ON APP REPUBLISHING */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-zinc-900 dark:to-zinc-950 border border-blue-100 dark:border-zinc-800 p-6 rounded-3xl mt-6 shadow-sm space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500 text-white rounded-2xl">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 font-display">
                    Prevent Data Loss on Publishing Updates (Zero-Loss Backup & Restore system)
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Whenever you modify files or republish/compile the app code, the temporary server file resets. Use this backup system to download and restore your full cloud data.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export Side */}
                <div className="bg-white dark:bg-zinc-800/50 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1">Step 1: Download Database Backup before update (Naya update se pehle download karein)</span>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                      Download the entire backup database payload containing all registered users, tasks, transaction records, UPI withdrawal logs and configurations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/db/export');
                        if (!res.ok) throw new Error("Failed to export database backup.");
                        const blob = await res.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.style.display = 'none';
                        a.href = url;
                        a.download = 'earnos_campaignpanel_backup.json';
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        window.URL.revokeObjectURL(url);
                      } catch (err: any) {
                        alert("Export backup error: " + err.message);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl shadow transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download Backup JSON File
                  </button>
                </div>

                {/* Import Side */}
                <div className="bg-white dark:bg-zinc-800/50 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">Step 2: Upload/Restore Backup after publish (Compile/update hone ke baad restore karein)</span>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                      Upload your previously downloaded backup file to instantly override and restore all data records on the cloud server.
                    </p>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        
                        const confirmImport = confirm("Are you sure you want to restore the database from this file? This will completely overwrite current data.");
                        if (!confirmImport) {
                          event.target.value = '';
                          return;
                        }

                        const reader = new FileReader();
                        reader.onload = async (e) => {
                          try {
                            const rawText = e.target?.result as string;
                            const parsedData = JSON.parse(rawText);
                            
                            const res = await fetch('/api/db/import', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(parsedData)
                            });
                            
                            const result = await res.json();
                            if (!res.ok) {
                              throw new Error(result.error || "Failed to restore database from backup.");
                            }
                            
                            // Success path: wipe old configurations as local representation, then fetch new ones
                            localStorage.clear();
                            CampaignStore.initialize();
                            await CampaignStore.syncWithServer();
                            refreshLocalDatabase();
                            triggerRefresh();
                            
                            alert("Success: Campaign Panel database has been fully restored! All users and transaction histories match the uploaded backup file exactly.");
                          } catch (err: any) {
                            alert("Import Database Failed: " + (err.message || "Invalid database file format."));
                          } finally {
                            event.target.value = '';
                          }
                        };
                        reader.readAsText(file);
                      }}
                      className="hidden"
                      id="database-backup-uploader"
                    />
                    <label
                      htmlFor="database-backup-uploader"
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl shadow transition-colors cursor-pointer text-center"
                    >
                      <Plus className="w-4 h-4" /> Upload & Restore JSON Database
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-100 dark:border-amber-900/30 text-[10px] text-amber-800 dark:text-amber-400 leading-relaxed">
                📢 <strong>Important (Hindi Tip):</strong> Jab bhi aap koi bug fix karwayein, to code update compile hone se pehle is page me upar diye gaye **Download Backup JSON File** button se ek copy download kar len. Naya update live hone ke baad usi JSON file ko naye server par **Upload & Restore** se upload kar den. Is tarike se aapka user balance, task registration aur withdrawal records kabhi bhi delete nahi honge!
              </div>
            </div>
          </div>
        )}

        {adminSection === 'offerwalls' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h2 className="text-xl font-bold font-display">Offerwalls Configurations</h2>
                <p className="text-xs text-zinc-400">Configure mock offerwalls multiplier, secret callback credentials, and toggles.</p>
              </div>

              <button
                onClick={handleCreateOfferwallClick}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 font-bold rounded-2xl text-xs flex items-center gap-1 shadow-lg shadow-orange-500/10"
              >
                <Plus className="w-4 h-4" /> Add Custom Offerwall
              </button>
            </div>

            {/* List custom offerwalls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {offerwallsList.map(wall => (
                <div key={wall.id} className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 p-5 rounded-3xl space-y-4 hover:shadow-md transition-shadow relative flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-orange-500 font-mono tracking-wider">
                          ID: {wall.id}
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-zinc-100 leading-snug mt-1">
                          {wall.name}
                        </h4>
                      </div>

                      <span className="text-xs font-black text-orange-600 bg-orange-55/40 dark:bg-orange-955/20 px-2 py-1 rounded-xl">
                        {wall.multiplier}x multiplier
                      </span>
                    </div>

                    <div className="space-y-2 text-xs bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-slate-100 dark:border-zinc-850 font-mono">
                      <div className="flex justify-between items-center text-[10px] truncate">
                        <span className="text-zinc-400 font-bold">API KEY:</span>
                        <span className="text-zinc-650 dark:text-zinc-400 font-medium truncate max-w-[150px]" title={wall.apiKey || 'None'}>
                          {wall.apiKey || 'No secret API key configured'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] truncate border-t border-slate-100 dark:border-zinc-850 pt-1.5 mt-1.5">
                        <span className="text-zinc-400 font-bold">CALLBACK:</span>
                        <span className="text-zinc-655 dark:text-zinc-400 font-medium truncate max-w-[150px]" title={wall.callbackUrl || 'None'}>
                          {wall.callbackUrl || 'No callback url configured'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] truncate border-t border-slate-100 dark:border-zinc-850 pt-1.5 mt-1.5">
                        <span className="text-zinc-400 font-bold">LOGO URL:</span>
                        <span className="text-zinc-655 dark:text-zinc-400 font-medium truncate max-w-[150px]" title={wall.logoUrl || 'None'}>
                          {wall.logoUrl || 'Standard icon'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] truncate border-t border-slate-100 dark:border-zinc-850 pt-1.5 mt-1.5">
                        <span className="text-zinc-400 font-bold">REDIRECT:</span>
                        <span className="text-zinc-655 dark:text-zinc-400 font-medium truncate max-w-[150px]" title={wall.redirectUrl || 'None'}>
                          {wall.redirectUrl || 'Default simulations'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-50 dark:border-zinc-800 pt-3.5 mt-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-zinc-400">Status:</span>
                      <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${
                        wall.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-slate-100 text-zinc-500 dark:bg-zinc-800'
                      }`}>
                        {wall.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOfferwallStatusToggle(wall)}
                        className="text-zinc-400 hover:text-zinc-600 focus:outline-none"
                        title="Toggle Active Status"
                      >
                        {wall.isActive ? (
                          <ToggleRight className="w-8 h-8 text-orange-500" />
                        ) : (
                          <ToggleLeft className="w-8 h-8" />
                        )}
                      </button>

                      <button
                        onClick={() => handleEditOfferwallClick(wall)}
                        className="p-1 px-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg hover:bg-slate-205 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs"
                        title="Edit config parameters"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteOfferwall(wall.id)}
                        className="p-1 text-red-500 hover:bg-red-950/20 rounded-lg hover:text-red-400 transition-colors"
                        title="Delete this offerwall"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Offerwall Add/Edit Modal overlay popup */}
            {showOfferwallModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] p-6 w-full max-w-lg shadow-2xl space-y-4 font-sans max-h-[90vh] flex flex-col">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-805 shrink-0">
                    <h3 className="text-sm font-black font-display uppercase tracking-widest text-zinc-400">
                      {isEditingOfferwall ? 'Modify Offerwall Settings' : 'Create Custom Offerwall'}
                    </h3>
                    <button onClick={() => setShowOfferwallModal(false)} className="text-zinc-400 hover:text-zinc-605">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveOfferwall} className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-800 dark:text-zinc-300 overflow-y-auto pr-1 flex-1">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Offerwall System ID</label>
                      <input 
                        type="text" 
                        value={owId}
                        onChange={(e) => setOwId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        required
                        disabled={isEditingOfferwall}
                        placeholder="e.g. adgatemedia"
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 rounded-xl text-xs font-mono disabled:opacity-50 text-slate-900 dark:text-zinc-100 focus:outline-none"
                      />
                      {!isEditingOfferwall && (
                        <small className="text-[10px] text-zinc-400 mt-1 block">A lowercase alphanumeric key string used as the identifier.</small>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Company / Display Name</label>
                      <input 
                        type="text" 
                        value={owName}
                        onChange={(e) => setOwName(e.target.value)}
                        required
                        placeholder="e.g. AdGate Media"
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 rounded-xl text-xs text-slate-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Rewards Multiplier</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={owMultiplier}
                        onChange={(e) => setOwMultiplier(e.target.value)}
                        required
                        placeholder="e.g. 1.5"
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 rounded-xl text-xs font-mono text-slate-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Security API Key (Secret)</label>
                      <input 
                        type="text" 
                        value={owApiKey}
                        onChange={(e) => setOwApiKey(e.target.value)}
                        placeholder="e.g. key_6f7f6da73406282..."
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 rounded-xl text-xs font-mono text-slate-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Callback / Postback Endpoint URL</label>
                      <input 
                        type="text" 
                        value={owCallbackUrl}
                        onChange={(e) => setOwCallbackUrl(e.target.value)}
                        placeholder="https://yourapp.com/api/callback/adgate"
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 rounded-xl text-xs font-mono text-slate-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Custom logo image url (Web Address)</label>
                      <input 
                        type="text" 
                        value={owLogoUrl}
                        onChange={(e) => setOwLogoUrl(e.target.value)}
                        placeholder="e.g. https://domain.com/cpx_logo.png"
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 rounded-xl text-xs font-mono text-slate-900 dark:text-zinc-100 focus:outline-none"
                      />
                      <small className="text-[10px] text-zinc-400 mt-1 block">Specify an image link (.png / .jpg) to customize this offerwall's visual logo icon on the user panel.</small>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Offerwall Destination Redirect URL</label>
                      <input 
                        type="text" 
                        value={owRedirectUrl}
                        onChange={(e) => setOwRedirectUrl(e.target.value)}
                        placeholder="e.g. https://your-offerwall-link.com?id={user_id}"
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 rounded-xl text-xs font-mono text-slate-900 dark:text-zinc-100 focus:outline-none"
                      />
                      <small className="text-[10px] text-zinc-400 mt-1 block">When users click on this offerwall, they can click a button to visit this external offerwall link.</small>
                    </div>

                    <div className="col-span-2 flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-950/40 border rounded-2xl">
                      <div>
                        <span className="block text-xs font-bold text-slate-900 dark:text-zinc-100">Enabled Status</span>
                        <span className="text-[10px] text-zinc-400 font-normal">Show this offerwall to participants inside the user panel.</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setOwIsActive(!owIsActive)}
                        className="text-zinc-500 hover:text-zinc-700 focus:outline-none"
                      >
                        {owIsActive ? (
                          <ToggleRight className="w-10 h-10 text-orange-500" />
                        ) : (
                          <ToggleLeft className="w-10 h-10" />
                        )}
                      </button>
                    </div>

                    <div className="col-span-2 pt-2">
                      <button
                        type="submit"
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all uppercase tracking-wider"
                      >
                        {isEditingOfferwall ? 'Save Offerwall configurations' : 'Create Custom Integration'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {adminSection === 'coupons' && (
          <div className="space-y-6 animate-fade-in text-slate-900 dark:text-zinc-100">
            <div className="pb-4 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold font-display">🎟️ Dynamic Coupons & Promo Code Creator</h2>
                <p className="text-xs text-zinc-400">Create, customize, and manage promotional bonus coupon codes for your members.</p>
              </div>
            </div>

            {/* Main container grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Creator Card */}
              <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 p-5 rounded-3xl space-y-4 shadow-sm">
                <h3 className="text-sm font-bold font-display text-slate-800 dark:text-zinc-100 border-b pb-2">Create New Coupon</h3>
                
                {couponMsg && (
                  <div className={`p-3 text-xs font-medium rounded-xl border-t-2 border ${
                    couponMsg.success 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-100 dark:border-emerald-950' 
                      : 'bg-red-50 dark:bg-red-950/20 text-red-650 border-red-100 dark:border-red-950'
                  }`}>
                    {couponMsg.text}
                  </div>
                )}

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    setCouponMsg(null);
                    const amt = parseFloat(newPromoAmount);
                    const maxUs = parseInt(newPromoMaxUses);
                    const maxClaims = parseInt(newPromoMaxClaimsPerUser);
                    
                    if (!newPromoCode.trim()) {
                      setCouponMsg({ success: false, text: "Promo code title is required" });
                      return;
                    }
                    if (isNaN(amt) || amt <= 0) {
                      setCouponMsg({ success: false, text: "Reward rupees amount must be greater than zero" });
                      return;
                    }

                    const res = CampaignStore.createPromoCode(
                      newPromoCode, 
                      amt, 
                      isNaN(maxUs) ? 0 : maxUs, 
                      isNaN(maxClaims) ? 1 : maxClaims
                    );
                    setCouponMsg({ success: res.success, text: res.message });
                    
                    if (res.success) {
                      setNewPromoCode('');
                      setNewPromoAmount('');
                      setNewPromoMaxUses('50');
                      setNewPromoMaxClaimsPerUser('1');
                      // Refresh list
                      refreshLocalDatabase();
                      triggerRefresh();
                    }
                  }} 
                  className="space-y-3.5"
                >
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">PROMO CODE STRING</label>
                    <input 
                      type="text" 
                      value={newPromoCode}
                      onChange={(e) => setNewPromoCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      placeholder="E.G. WINNER100"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs font-mono text-slate-900 dark:text-zinc-100 focus:outline-none"
                      required
                    />
                    <small className="text-[9px] text-zinc-400">Format: uppercase letters & numbers only.</small>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">REWARD AMOUNT (₹)</label>
                    <input 
                      type="number" 
                      value={newPromoAmount}
                      onChange={(e) => setNewPromoAmount(e.target.value)}
                      placeholder="e.g. 150"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs font-mono text-slate-900 dark:text-zinc-100 focus:outline-none"
                      required
                    />
                    <small className="text-[9px] text-zinc-400">Total balance credited to participant's Bonus Wallet instantly.</small>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">MAX USES LIMIT (USERS)</label>
                    <input 
                      type="number" 
                      value={newPromoMaxUses}
                      onChange={(e) => setNewPromoMaxUses(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs font-mono text-slate-900 dark:text-zinc-100 focus:outline-none"
                      required
                    />
                    <small className="text-[9px] text-zinc-400">Max limit of times this coupon code can be redeemed. Use 0 for unlimited.</small>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">CLAIM LIMIT PER USER (TIMES)</label>
                    <input 
                      type="number" 
                      value={newPromoMaxClaimsPerUser}
                      onChange={(e) => setNewPromoMaxClaimsPerUser(e.target.value)}
                      placeholder="e.g. 1"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs font-mono text-slate-900 dark:text-zinc-100 focus:outline-none"
                      required
                    />
                    <small className="text-[9px] text-zinc-400">How many times a single user can redeem this code. Default is 1.</small>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <Plus className="w-4 h-4" /> Create Coupon Code
                  </button>
                </form>
              </div>

              {/* Coupons List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 p-5 rounded-3xl shadow-sm">
                  <div className="flex items-center justify-between border-b pb-2 mb-3">
                    <h3 className="text-sm font-bold font-display text-zinc-800 dark:text-zinc-100">Live Custom Promo Coupons</h3>
                    <span className="bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-[9px] font-black">{promoCodesList.length} Promo Codes</span>
                  </div>

                  {promoCodesList.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-xs text-zinc-400">No active custom coupon codes established yet.</p>
                      <p className="text-[10px] text-zinc-500 mt-1">Use the panel on the left to create dynamic codes instantly.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-400">
                            <th className="py-2.5">Code</th>
                            <th className="py-2.5">Reward Status</th>
                            <th className="py-2.5 font-sans">Claims Redeemed</th>
                            <th className="py-2.5 font-sans">User Limit</th>
                            <th className="py-2.5 text-right">Settings</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                          {promoCodesList.map((promo: any) => (
                            <tr key={promo.id} className="hover:bg-slate-50/40 dark:hover:bg-zinc-950/20">
                              <td className="py-3 font-mono font-bold text-sky-600 dark:text-sky-400">
                                {promo.code}
                              </td>
                              <td className="py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                                ₹{promo.rewardAmount.toFixed(2)}
                              </td>
                              <td className="py-3">
                                <span className="font-bold">{promo.useCount}</span> / <span className="text-zinc-400 font-mono">{promo.maxUses >= 999999 ? 'Unlimited' : promo.maxUses}</span>
                                <div className="w-24 bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full mt-1 overflow-hidden">
                                  <div 
                                    className="bg-sky-500 h-full rounded-full"
                                    style={{ width: `${Math.min(100, (promo.useCount / (promo.maxUses >= 999999 ? 1000 : promo.maxUses)) * 100)}%` }}
                                  ></div>
                                </div>
                              </td>
                              <td className="py-3 font-bold text-zinc-700 dark:text-zinc-300">
                                {promo.maxClaimsPerUser ?? 1} claim(s)
                              </td>
                              <td className="py-3 text-right flex items-center justify-end">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (pendingDeletePromoCodeId === promo.id) {
                                      await CampaignStore.deletePromoCode(promo.id);
                                      refreshLocalDatabase();
                                      triggerRefresh();
                                      setPendingDeletePromoCodeId(null);
                                    } else {
                                      setPendingDeletePromoCodeId(promo.id);
                                      setTimeout(() => setPendingDeletePromoCodeId(null), 4000);
                                    }
                                  }}
                                  className={`p-1.5 rounded-lg transition-all inline-flex cursor-pointer text-[10px] font-bold items-center gap-1 ${
                                    pendingDeletePromoCodeId === promo.id
                                      ? 'bg-red-600 text-white border border-red-700 animate-pulse px-2 py-1'
                                      : 'text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20'
                                  }`}
                                  title="Delete Promo Code"
                                >
                                  {pendingDeletePromoCodeId === promo.id ? '⚠️ Confirm Purge?' : <Trash2 className="w-4 h-4" />}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                 {/* Built-in Defaults Information Panel */}
                <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-3xl border border-slate-200/40 dark:border-zinc-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-sky-500" /> Coupon System Guidelines
                  </h4>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    All created coupon/promo codes are activated instantly. Key rules of the dynamic promo system:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px]">
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 p-3 rounded-2xl">
                      <span className="block font-bold text-sky-600 dark:text-sky-400 mb-0.5">Withdrawable Rewards</span>
                      <span className="text-zinc-550 dark:text-zinc-400">All redeemed promo code cash rewards are added directly to the user's Main Wallet (withdrawable balance) instead of a bonus wallet!</span>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 p-3 rounded-2xl">
                      <span className="block font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">Safety & Limits</span>
                      <span className="text-zinc-550 dark:text-zinc-400">Each account can claim a unique promo code only once. You can customize the maximum use count limit to prevent excessive claims.</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {adminSection === 'postback' && (
          <PostbackConsoleSection 
            users={usersList} 
            theme={theme}
            refreshData={refreshLocalDatabase}
            settings={CampaignStore.settings}
          />
        )}

      </div>

    </div>
  );
}
