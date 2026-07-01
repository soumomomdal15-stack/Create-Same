/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, Gift, Coins, Users, User, ArrowRight, CheckCircle2, 
  AlertTriangle, Play, RotateCw, X, CircleCheck, CircleDollarSign, 
  Send, Share2, Award, ShieldAlert, Star, Copy, Check, Download, 
  Globe, Youtube, HelpCircle, Instagram, Eye, AlertCircle, RefreshCw, Sparkles,
  Camera, Upload, ExternalLink, Smartphone, Terminal, Cpu, Database, Wifi, Lock
} from 'lucide-react';
import { CampaignStore } from '../utils/store';
import { Task, User as UserType, Withdrawal, KYCStatus, PayoutMethod, AppNotification } from '../types';
import appLogo from '../assets/images/earnos_app_logo_1779768057177.png';
import { MOCK_LEADERBOARD } from '../utils/data';

interface UserPanelProps {
  theme: 'light' | 'dark';
  refreshAdminDb: () => void;
  onLogout?: () => void;
}

export default function UserPanel({ theme, refreshAdminDb, onLogout }: UserPanelProps) {
  // Navigation: 'home' | 'wallet' | 'referrals' | 'profile'
  const [activeTab, setActiveTab] = useState<'home' | 'wallet' | 'referrals' | 'profile'>('home');
  const [user, setUser] = useState<UserType | null>(CampaignStore.currentUser);
  
  // Auth Form State
  const [isLoginView, setIsLoginView] = useState<boolean>(true);
  const [emailInput, setEmailInput] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [referralInput, setReferralInput] = useState<string>('');
  const [otpInput, setOtpInput] = useState<string>('');
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [authSuccess, setAuthSuccess] = useState<string>('');

  // CAPTCHA verification
  const [captchaNum1, setCaptchaNum1] = useState<number>(0);
  const [captchaNum2, setCaptchaNum2] = useState<number>(0);
  const [captchaAnswer, setCaptchaAnswer] = useState<string>('');
  const [isCaptchaVerified, setIsCaptchaVerified] = useState<boolean>(false);

  // General States
  const [activeNotification, setActiveNotification] = useState<AppNotification | null>(null);
  const [clipboardCopied, setClipboardCopied] = useState<boolean>(false);
  const [codeCopied, setCodeCopied] = useState<boolean>(false);

  // Filter notifications belonging to the current user (either targeted or global)
  const myNotifications = CampaignStore.notifications.filter(n => {
    if (!n) return false;
    if (!n.targetUserId && !n.targetEmail) return true; // global broadcast
    if (user) {
      if (n.targetUserId && n.targetUserId.trim().toLowerCase() === user.uid.trim().toLowerCase()) return true;
      if (n.targetEmail && n.targetEmail.trim().toLowerCase() === user.email.trim().toLowerCase()) return true;
    }
    return false;
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [timerCount, setTimerCount] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [screenshotUpload, setScreenshotUpload] = useState<string>('');
  const [screenshotUploadedName, setScreenshotUploadedName] = useState<string>('');
  const [textProofInput, setTextProofInput] = useState<string>('');
  const [screenshotTaskStarted, setScreenshotTaskStarted] = useState<boolean>(false);
  const [aiVerifying, setAiVerifying] = useState<boolean>(false);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [userCompletions, setUserCompletions] = useState<any[]>([]);

  // SDK Track States
  const [sdkStage, setSdkStage] = useState<'not_installed' | 'link_opened' | 'started' | 'downloading' | 'installing' | 'registering' | 'handshake' | 'rewarded'>('not_installed');
  const [simulatedPhoneNumber, setSimulatedPhoneNumber] = useState<string>('');
  const [sdkLogs, setSdkLogs] = useState<string[]>([]);
  const [sdkSimulating, setSdkSimulating] = useState<boolean>(false);
  const [selectedSdkTab, setSelectedSdkTab] = useState<'sandbox' | 'telemetry'>('sandbox');
  const [sdkIsCopied, setSdkIsCopied] = useState<boolean>(false);
  const [completedSdkRequirements, setCompletedSdkRequirements] = useState<string[]>([]);
  const [activeRequirementIndex, setActiveRequirementIndex] = useState<number>(0);
  const [requirementSimulatingIndex, setRequirementSimulatingIndex] = useState<number | null>(null);

  // Command Console & Parameter override states
  const [sdkSimSpeed, setSdkSimSpeed] = useState<'normal' | 'fast' | 'instant'>('normal');
  const [customSimIp, setCustomSimIp] = useState<string>('157.44.112.55');
  const [customSimPackage, setCustomSimPackage] = useState<string>('');
  const [customSimDevice, setCustomSimDevice] = useState<string>('Samsung Galaxy S24 Ultra');
  const [isSimDeviceRooted, setIsSimDeviceRooted] = useState<boolean>(false);
  const [terminalQuery, setTerminalQuery] = useState<string>('');
  const [terminalConsoleLines, setTerminalConsoleLines] = useState<string[]>([
    'Welcome to EarnOS Developer Command Line v2.4.9',
    'Type /help for a list of available emulator commands.',
    'System ready.'
  ]);

  // Webhook Option state
  const [webhookLogs, setWebhookLogs] = useState<string[]>([]);
  const [isWebhookSending, setIsWebhookSending] = useState<boolean>(false);
  const [webhookResultJson, setWebhookResultJson] = useState<string>('');

  // Packages Option state
  const [packageScanLogs, setPackageScanLogs] = useState<string[]>([]);
  const [isPackageScanning, setIsPackageScanning] = useState<boolean>(false);
  const [packageScanMatch, setPackageScanMatch] = useState<boolean>(false);

  // Telemetry Option state
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
  const [isTelemetryProbing, setIsTelemetryProbing] = useState<boolean>(false);
  
  // Games States
  const [scratchScraped, setScratchScraped] = useState<boolean>(false);
  const [scratchedValue, setScratchedValue] = useState<number>(0);
  const [scratchRevealed, setScratchRevealed] = useState<boolean>(false);
  const [wheelSpinning, setWheelSpinning] = useState<boolean>(false);
  const [wheelAngle, setWheelAngle] = useState<number>(0);
  const [wheelResult, setWheelResult] = useState<string>('');

  // Quiz States
  const [activeQuizIndex, setActiveQuizIndex] = useState<number>(0);
  const [quizAnswersSelection, setQuizAnswersSelection] = useState<number[]>([]);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);

  // Withdraw requests State
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>('upi');
  const [payoutDetails, setPayoutDetails] = useState<string>('');
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [savedUpiId, setSavedUpiId] = useState<string>(localStorage.getItem('cp_saved_upi') || '');
  const [withdrawMsg, setWithdrawMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Offerwall Completer
  const [selectedOfferwall, setSelectedOfferwall] = useState<string | null>(null);
  const [offerCompletedNotice, setOfferCompletedNotice] = useState<string>('');

  // Promo Code coupon
  const [promoInput, setPromoInput] = useState<string>('');
  const [promoMsg, setPromoMsg] = useState<{ success: boolean; text: string } | null>(null);

  // KYC input simulator
  const [kycFileMock, setKycFileMock] = useState<boolean>(false);
  const [kycMsg, setKycMsg] = useState<string>('');

  // Zoom lightbox state for references & user screenshot proofs
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

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

  // Task lists
  const [tasksList, setTasksList] = useState<Task[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Ad simulation timer
  const [adTimerActive, setAdTimerActive] = useState<boolean>(false);
  const [adSecondsMax, setAdSecondsMax] = useState<number>(5);
  const [adTimeLeft, setAdTimeLeft] = useState<number>(5);

  // Regenerate dynamic captcha logic
  const genCaptcha = () => {
    setCaptchaNum1(Math.floor(Math.random() * 9) + 1);
    setCaptchaNum2(Math.floor(Math.random() * 9) + 1);
    setCaptchaAnswer('');
    setIsCaptchaVerified(false);
  };

  useEffect(() => {
    if (!user && onLogout) {
      onLogout();
    }
  }, [user, onLogout]);

  useEffect(() => {
    setSdkStage('not_installed');
    setSimulatedPhoneNumber('');
    setSdkLogs([]);
    setSdkSimulating(false);
    setSelectedSdkTab('sandbox');
    setWebhookLogs([]);
    setIsWebhookSending(false);
    setWebhookResultJson('');
    setPackageScanLogs([]);
    setIsPackageScanning(false);
    setPackageScanMatch(false);
    setTelemetryLogs([]);
    setIsTelemetryProbing(false);
    setCompletedSdkRequirements([]);
    setActiveRequirementIndex(0);
    setRequirementSimulatingIndex(null);
  }, [selectedTask]);

  // Background polling for postback callback completions
  useEffect(() => {
    if (!selectedTask) return;
    
    const isPostback = selectedTask.verificationMethods
      ? (selectedTask.verificationMethods.includes('postback') || selectedTask.verificationMethods.includes('sdk_postback'))
      : (selectedTask.verificationMethod === 'postback' || selectedTask.verificationMethod === 'sdk_postback');
      
    if (!isPostback) return;
    
    const checkPostbackTx = () => {
      const hasCompletedTx = CampaignStore.transactions.some(tx => 
        tx.userId === user?.uid && 
        tx.id.startsWith("tx_pb_") && 
        tx.id.includes(selectedTask.id)
      );
      if (hasCompletedTx && sdkStage !== 'rewarded') {
        setSdkStage('rewarded');
        setUser({ ...CampaignStore.currentUser! });
      }
    };
    checkPostbackTx();

    const intervalId = setInterval(() => {
      CampaignStore.syncWithServer().then(() => {
        checkPostbackTx();
      });
    }, 4000);

    return () => clearInterval(intervalId);
  }, [selectedTask, user?.uid, sdkStage]);

  const startSdkTrackingSimulation = () => {
    if (!selectedTask) return;
    
    setSdkSimulating(true);
    setSdkStage('started');
    
    // Use user-customized simulated phone or generate a new random phone number
    const targetPhone = simulatedPhoneNumber || `98308${Math.floor(Math.random() * 9000 + 1000)}`;
    setSimulatedPhoneNumber(targetPhone);

    const targetPkg = customSimPackage || `com.merchant.install_${selectedTask.id.slice(0, 4)}`;

    // Initial logs showing tracking initialization
    setSdkLogs([
      `[${new Date().toLocaleTimeString()}] 🚀 INIT: Starting automated installer target tracking routing...`,
      `[${new Date().toLocaleTimeString()}] 🌎 REDIRECT: Connecting to play store CDN and tracking gateway...`,
      `[${new Date().toLocaleTimeString()}] 🔍 TELEMETRY: Active device signature detected: ${user?.deviceFingerprint || 'f199a2cd71b29a28'}`,
      `[${new Date().toLocaleTimeString()}] 📱 DEVICE: Emulating hardware: ${customSimDevice} (Root Check: ${isSimDeviceRooted ? "WARNING: ROOTED" : "PASS: SECURE"})`
    ]);

    const speedVal = sdkSimSpeed === 'instant' ? 50 : sdkSimSpeed === 'fast' ? 700 : 2000;

    // Step 1: Downloading state
    setTimeout(() => {
      setSdkStage('downloading');
      setSdkLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ⬇️ DOWNLOAD: Target app package bundle identified: ${targetPkg}`,
        `[${new Date().toLocaleTimeString()}] ⚙️ TELEMETRY: Unpacking manifest and reading required permissions list...`
      ]);
    }, speedVal);

    // Step 2: Installing state
    setTimeout(() => {
      setSdkStage('installing');
      setSdkLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] 🔄 INSTALL: Installed target bundle "${targetPkg}" on secure sandbox partitions.`,
        `[${new Date().toLocaleTimeString()}] ⚡ BROADCAST: Listening for first-launch triggers and click beacons...`
      ]);
    }, speedVal * 2);

    // Step 3: Registering state
    setTimeout(() => {
      setSdkStage('registering');
      setSdkLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] 📲 AUTO TRACK: Target App initialized inside emulator space...`,
        `[${new Date().toLocaleTimeString()}] 👥 REGISTRATION: Signed up with active cellular account phone: +91 ******${targetPhone.slice(-4)}`,
        `[${new Date().toLocaleTimeString()}] ⚙️ TELEMETRY: Dispatching cryptographic conversion handshake to server node: ${customSimIp}`
      ]);
    }, speedVal * 3.5);

    // Step 4: Callback Postback state
    setTimeout(() => {
      setSdkStage('handshake');
      setSdkLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] 🔗 POSTBACK: Gateway callback token verification broadcast received through cell router...`,
        `[${new Date().toLocaleTimeString()}] 🛡️ SECURE KEY: Token checksum integrity successfully matched (Active IP: ${customSimIp}).`,
        `[${new Date().toLocaleTimeString()}] 💰 REWARD: Processing direct currency release credits sequence...`
      ]);
    }, speedVal * 5);

    // Step 5: Reward state & final callback completed
    setTimeout(() => {
      if (selectedTask) {
        setSdkStage('rewarded');
        setSdkLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] 🎉 TELEMETRY: Approved! Perfect match confirmation received from target advertiser partner db.`,
          `[${new Date().toLocaleTimeString()}] 💸 WALLET: ₹${selectedTask.rewardAmount.toFixed(2)} dispatched securely to your account wallet.`,
          `[${new Date().toLocaleTimeString()}] ✅ STATUS: STATUS_VERIFIED_OK.`
        ]);

        const res = CampaignStore.redeemTaskReward(selectedTask.id);
        if (res.success) {
          alert(`💸 Auto Postback Received!\n₹${selectedTask.rewardAmount.toFixed(2)} reward instantly credited to your Main Wallet!`);
          setUser({ ...CampaignStore.currentUser! });
          refreshAdminDb();
        } else {
          alert(res.message);
        }
      }
    }, speedVal * 6);
  };

  const triggerPostbackApiSimulation = () => {
    if (!selectedTask) return;
    setIsWebhookSending(true);
    setWebhookResultJson('');
    setWebhookLogs([
      `[${new Date().toLocaleTimeString()}] 🚀 POSTBACK EMULATOR: Sending GET request packet...`,
      `[${new Date().toLocaleTimeString()}] Target Endpoint: https://api.earnos.com/v1/postback/receive`,
      `[${new Date().toLocaleTimeString()}] Query params matched: user_id=${user?.uid || 'guest'} | task_id=${selectedTask.id} | ip=${customSimIp} | secret=secure_live_node_token`
    ]);

    const speedVal = sdkSimSpeed === 'instant' ? 50 : sdkSimSpeed === 'fast' ? 400 : 1000;

    setTimeout(() => {
      setWebhookLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] 🌎 GATEWAY: Verification handshake initiated.`,
        `[${new Date().toLocaleTimeString()}] Verification criteria checklist verified okay.`
      ]);
    }, speedVal);

    setTimeout(() => {
      setIsWebhookSending(false);
      setWebhookResultJson(JSON.stringify({
        status: "success",
        message: "Payout verification authorized",
        data: {
          transaction_id: `tx_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
          user_id: user?.uid,
          task_id: selectedTask.id,
          task_title: selectedTask.title,
          payout_amount_inr: selectedTask.rewardAmount,
          telemetry_verified: true,
          simulated_ip: customSimIp,
          device_fingerprint: user?.deviceFingerprint || 'f199a2cd71b29a28',
          timestamp_utc: new Date().toISOString()
        }
      }, null, 2));

      setWebhookLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] 🎉 CALLBACK OK: Received status 200 HTTP SUCCESS response.`,
        `[${new Date().toLocaleTimeString()}] Balance dynamically auto-applied inside publisher DB.`
      ]);

      const res = CampaignStore.redeemTaskReward(selectedTask.id);
      if (res.success) {
        alert(`💸 API Webhook Postback Simulated!\n₹${selectedTask.rewardAmount.toFixed(2)} success callback registered to Main Wallet!`);
        setUser({ ...CampaignStore.currentUser! });
        refreshAdminDb();
      } else {
        alert(res.message);
      }
    }, speedVal * 2);
  };

  const startPackageNameQueryScan = () => {
    if (!selectedTask) return;
    setIsPackageScanning(true);
    const targetPkg = customSimPackage || `com.merchant.install_${selectedTask.id.slice(0, 4)}`;
    setPackageScanLogs([
      `[${new Date().toLocaleTimeString()}] 🔍 APK SCANNER: Requesting app registration lists...`,
      `[${new Date().toLocaleTimeString()}] Register Target Package criteria: "${targetPkg}"`
    ]);

    const speedVal = sdkSimSpeed === 'instant' ? 50 : sdkSimSpeed === 'fast' ? 500 : 1200;

    setTimeout(() => {
      setPackageScanLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Checking "com.android.chrome" ... INSTALLED`,
        `[${new Date().toLocaleTimeString()}] Checking "com.phonepe.app" ... INSTALLED`
      ]);
    }, speedVal * 0.5);

    setTimeout(() => {
      setPackageScanLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Scanning target registry for installer package context matching: "${targetPkg}" ...`
      ]);
    }, speedVal * 1.2);

    setTimeout(() => {
      setIsPackageScanning(false);
      setPackageScanMatch(true);
      setPackageScanLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ☑️ IN-APP PROBE MATCHED: Package fingerprint found in Android system user logs!`,
        `[${new Date().toLocaleTimeString()}] Registry ID: 0x${Math.floor(Math.random() * (1000000)).toString(16).toUpperCase()}`,
        `[${new Date().toLocaleTimeString()}] Triggering local payout trigger via CPI registry...`,
        `[${new Date().toLocaleTimeString()}] STATUS: VALIDATED OK`
      ]);

      const res = CampaignStore.redeemTaskReward(selectedTask.id);
      if (res.success) {
        alert(`📦 System Package Scan Approved!\nFound "${targetPkg}" on device! ₹${selectedTask.rewardAmount.toFixed(2)} credited.`);
        setUser({ ...CampaignStore.currentUser! });
        refreshAdminDb();
      } else {
        alert(res.message);
      }
    }, speedVal * 2);
  };

  const startTelemetryNodeCheck = () => {
    if (!selectedTask) return;
    setIsTelemetryProbing(true);
    setTelemetryLogs([
      `[${new Date().toLocaleTimeString()}] 📡 TELEMETRY HANDSHAKE: Authenticating connection with cell towers and IP gateways...`,
      `[${new Date().toLocaleTimeString()}] Client Signature IP: ${customSimIp}`,
      `[${new Date().toLocaleTimeString()}] Network Carrier: Simulated Telecom Jio/Airtel 5G`
    ]);

    const speedVal = sdkSimSpeed === 'instant' ? 50 : sdkSimSpeed === 'fast' ? 500 : 1100;

    setTimeout(() => {
      setTelemetryLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Querying click-to-install timestamp delay logs...`,
        `[${new Date().toLocaleTimeString()}] Checking deep-link routing referral hash: dlnk_${Math.random().toString(36).substring(2, 8)}_track`,
        `[${new Date().toLocaleTimeString()}] Checking VPN Integrity ... PASS (No proxy detected)`
      ]);
    }, speedVal);

    setTimeout(() => {
      setIsTelemetryProbing(false);
      setTelemetryLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ✅ TELEMETRY SIGNATURE VERIFIED: Installation event matches IP and device context securely!`,
        `[${new Date().toLocaleTimeString()}] Verification successful! Fining coin wallet release broadcast...`
      ]);

      const res = CampaignStore.redeemTaskReward(selectedTask.id);
      if (res.success) {
        alert(`📡 Telemetry Context Verified!\nYour IP & click-delay data matches our server tracking hash exactly. ₹${selectedTask.rewardAmount.toFixed(2)} rewards credited.`);
        setUser({ ...CampaignStore.currentUser! });
        refreshAdminDb();
      } else {
        alert(res.message);
      }
    }, speedVal * 2);
  };

  const handleCommandLineSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = terminalQuery.trim();
    if (!query) return;

    // Append user input to terminal lines
    setTerminalConsoleLines(prev => [...prev, `earnos-sdk@android :~$ ${query}`]);
    setTerminalQuery('');

    const args = query.split(' ');
    const command = args[0].toLowerCase();
    const param = args.slice(1).join(' ');

    switch (command) {
      case '/help':
        setTerminalConsoleLines(prev => [
          ...prev,
          '💡 AVAILABLE EMULATOR COMMANDS:',
          '  /ip <val>       - Set simulated gateway IP (e.g., /ip 103.45.1.92)',
          '  /package <val>  - Set target application package bundle id string',
          '  /phone <val>    - Set target user registration phone number',
          '  /device <val>   - Set Android device model context string',
          '  /root           - Toggle device ROOT privileges (on/off)',
          '  /speed <val>    - Set simulation delays: normal, fast, or instant',
          '  /force-match    - Instantly bypass all checks and dispatch automatic payout',
          '  /logs           - Output complete environment diagnostic logs',
          '  /reset          - Wipe and restart current session variables'
        ]);
        break;
      case '/ip':
        if (!param) {
          setTerminalConsoleLines(prev => [...prev, '❌ Error: Specify an IP address (e.g. /ip 8.8.8.8)']);
        } else {
          setCustomSimIp(param);
          setTerminalConsoleLines(prev => [...prev, `🟢 OK: Simulation client IP updated to: ${param}`]);
        }
        break;
      case '/package':
        if (!param) {
          setTerminalConsoleLines(prev => [...prev, '❌ Error: Specify a package bundle ID string']);
        } else {
          setCustomSimPackage(param);
          setTerminalConsoleLines(prev => [...prev, `🟢 OK: Bundle target package overwritten to: ${param}`]);
        }
        break;
      case '/phone':
        if (!param) {
          setTerminalConsoleLines(prev => [...prev, '❌ Error: Specify a mobile phone number']);
        } else {
          setSimulatedPhoneNumber(param);
          setTerminalConsoleLines(prev => [...prev, `🟢 OK: Device signup registration phone set to: +91 ${param}`]);
        }
        break;
      case '/device':
        if (!param) {
          setTerminalConsoleLines(prev => [...prev, '❌ Error: Specify device name string']);
        } else {
          setCustomSimDevice(param);
          setTerminalConsoleLines(prev => [...prev, `🟢 OK: Device hardware model set to: ${param}`]);
        }
        break;
      case '/root':
        setIsSimDeviceRooted(prev => {
          const newVal = !prev;
          setTerminalConsoleLines(lines => [...lines, `🟢 OK: Android system root partition checked: ${newVal ? 'ENABLED (Rooted Device warning)' : 'DISABLED (Secure production build)'}`]);
          return newVal;
        });
        break;
      case '/speed':
        if (param === 'normal' || param === 'fast' || param === 'instant') {
          setSdkSimSpeed(param);
          setTerminalConsoleLines(prev => [...prev, `🟢 OK: Simulation processing speed set to: *${param.toUpperCase()}*`]);
        } else {
          setTerminalConsoleLines(prev => [...prev, '❌ Error: Available speeds are: normal, fast, instant']);
        }
        break;
      case '/bypass':
      case '/force-match':
        if (!selectedTask) {
          setTerminalConsoleLines(prev => [...prev, '❌ Error: Select a specific campaign task first!']);
          return;
        }
        if (selectedTask.sdkRequirements && selectedTask.sdkRequirements.length > 0) {
          const allStepsDone = selectedTask.sdkRequirements.every(req => completedSdkRequirements.includes(req));
          if (!allStepsDone) {
            setTerminalConsoleLines(prev => [
              ...prev,
              '❌ Error: Admin has enforced strict verification requirement parameters!',
              'You must complete all sequential step simulations manually on the device interface first.'
            ]);
            break;
          }
        }
        setTerminalConsoleLines(prev => [...prev, '🚀 COMMAND INJECTED: Dispatching force-verify bypass postback trigger...']);
        setSdkStage('rewarded');
        const res = CampaignStore.redeemTaskReward(selectedTask.id);
        if (res.success) {
          setTerminalConsoleLines(prev => [
            ...prev,
            `🎉 SUCCESS: Task ₹${selectedTask.rewardAmount} payment instantly approved and credited!`,
            'STATUS_VERIFIED_OK'
          ]);
          setUser({ ...CampaignStore.currentUser! });
          refreshAdminDb();
        } else {
          setTerminalConsoleLines(prev => [...prev, `❌ Error calling database: ${res.message}`]);
        }
        break;
      case '/logs':
        setTerminalConsoleLines(prev => [
          ...prev,
          `📝 ENVIRONMENT METADATA LOGS:`,
          ` - Client IP: ${customSimIp}`,
          ` - App Bundle Target: ${customSimPackage || `com.merchant.install_${selectedTask?.id.slice(0, 4) || 'app'}`}`,
          ` - Auth Target Phone: ${simulatedPhoneNumber || 'Not simulated yet'}`,
          ` - Device Emulation: ${customSimDevice}`,
          ` - Root Check status: ${isSimDeviceRooted ? 'Rooted' : 'Secure User partition'}`,
          ` - Speed Profile: ${sdkSimSpeed}`,
          ` - SDK Current State: ${sdkStage}`,
          ` - Target Reward Valuation: ₹${selectedTask?.rewardAmount || 0}`
        ]);
        break;
      case '/reset':
        setSdkStage('not_installed');
        setSdkLogs([]);
        setSdkSimulating(false);
        setSimulatedPhoneNumber('');
        setTerminalConsoleLines([
          '♻️ Session restarted.',
          'Ready for input commands. Type /help for assistance.'
        ]);
        break;
      default:
        setTerminalConsoleLines(prev => [
          ...prev,
          `❌ Command not found: "${command}". Type /help to view command list.`
        ]);
        break;
    }
  };

  useEffect(() => {
    CampaignStore.initialize();
    setUser(CampaignStore.currentUser);
    setTasksList(CampaignStore.tasks);
    genCaptcha();

    // Trigger standard passive timer logic
    let t: any;
    if (isTimerRunning && timerCount > 0) {
      t = setInterval(() => {
        setTimerCount(tc => {
          if (tc <= 1) {
            setIsTimerRunning(false);
            // Complete standard web view timer task
            if (selectedTask) {
              const res = CampaignStore.redeemTaskReward(selectedTask.id);
              if (res.success) {
                alert(res.message);
                setUser({ ...CampaignStore.currentUser! });
                refreshAdminDb();
              }
              setSelectedTask(null);
            }
            return 0;
          }
          return tc - 1;
        });
      }, 1000);
    }
    return () => clearInterval(t);
  }, [isTimerRunning, timerCount, selectedTask]);

  // Synchronize state with central cloud database periodically and instantly in real-time
  useEffect(() => {
    const handleSyncUpdate = () => {
      if (CampaignStore.currentUser) {
        setUser({ ...CampaignStore.currentUser });
        const allCompletions = CampaignStore.taskCompletions;
        const filtered = allCompletions.filter((c: any) => c.userId === CampaignStore.currentUser?.uid);
        setUserCompletions(filtered);
      } else {
        setUser(null);
      }
      setTasksList([...CampaignStore.tasks]);
    };

    CampaignStore.syncWithServer(handleSyncUpdate);

    // Register real-time change listener to instantly apply push updates
    CampaignStore.addChangeListener(handleSyncUpdate);

    // Silent periodic polling as background fallback (relaxed to 15s)
    const syncInterval = setInterval(() => {
      CampaignStore.syncWithServer(handleSyncUpdate);
    }, 15000);

    return () => {
      clearInterval(syncInterval);
      CampaignStore.removeChangeListener(handleSyncUpdate);
    };
  }, []);

  // Sync user's submitted proofs whenever the user changes or active tab shifts
  useEffect(() => {
    if (user) {
      const allCompletions = CampaignStore.taskCompletions;
      const filtered = allCompletions.filter((c: any) => c.userId === user.uid);
      setUserCompletions(filtered);
    }
  }, [user, activeTab]);

  // Handle ad videos countdown ticker
  useEffect(() => {
    let adInterval: any;
    if (adTimerActive && adTimeLeft > 0) {
      adInterval = setInterval(() => {
        setTimeLeft(atl => {
          if (atl <= 1) {
            setAdTimerActive(false);
            // Pay reward points
            const win = 10; // Rs 10 reward standard for ads
            const msg = CampaignStore.redeemInstantGamer(win, 'spin'); // uses spin rewards method
            alert(`🎉 Add Finished! ${msg}`);
            setUser({ ...CampaignStore.currentUser! });
            refreshAdminDb();
            return 0;
          }
          return atl - 1;
        });
      }, 1000);
    }
    return () => clearInterval(adInterval);
  }, [adTimerActive, adTimeLeft]);

  // Handle dynamic setting changes
  const setTimeLeft = (act: any) => {
    setAdTimeLeft(act);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!emailInput) {
      setAuthError('Please enter a valid Gmail address.');
      return;
    }

    // Verify Captcha
    const expected = captchaNum1 + captchaNum2;
    if (parseInt(captchaAnswer) !== expected) {
      setAuthError('Anti-bot CAPTCHA failed. Submit the correct sum.');
      genCaptcha();
      return;
    }

    if (!isOtpSent) {
      // Simulate sending OTP authentication code
      setIsOtpSent(true);
      setAuthSuccess('Verification OTP code sent successfully to ' + emailInput + ' [Simulated OTP: 7799]');
      return;
    }

    // Checking simulation code
    if (otpInput !== '7799' && otpInput !== '1234') {
      setAuthError('Invalid OTP security key entered.');
      return;
    }

    // Complete SignUp / In
    const loginResult = CampaignStore.registerOrLoginUser(emailInput, nameInput || emailInput.split('@')[0], 'demo_password123', referralInput);
    if (!loginResult.success) {
      setAuthError(loginResult.message);
      setIsOtpSent(false);
      genCaptcha();
    } else {
      setUser(CampaignStore.currentUser);
      setAuthSuccess('Logged in securely!');
      refreshAdminDb();
    }
  };

  const handleMockGoogleLogin = () => {
    setAuthError('');
    const simEmail = "google_user_" + Math.floor(Math.random() * 900) + "@gmail.com";
    const simName = "Google User " + Math.floor(Math.random() * 100);
    
    // Auto captcha correct
    const loginResult = CampaignStore.registerOrLoginUser(simEmail, simName, 'google_pass_sim_123', referralInput);
    if (!loginResult.success) {
      setAuthError(loginResult.message);
    } else {
      setUser(CampaignStore.currentUser);
      refreshAdminDb();
    }
  };

  const handleLogout = () => {
    CampaignStore.logout();
    setUser(null);
    setIsOtpSent(false);
    setEmailInput('');
    setNameInput('');
    setOtpInput('');
    setReferralInput('');
    setAuthSuccess('');
    setAuthError('');
    genCaptcha();
    setActiveTab('home');
    if (onLogout) onLogout();
  };

  // Check checkIn claims
  const processCheckIn = () => {
    const res = CampaignStore.claimDailyCheckIn();
    if (res.success) {
      setUser({ ...CampaignStore.currentUser! });
      alert(res.message);
      refreshAdminDb();
    } else {
      alert(res.message);
    }
  };

  // Launch sponsored video trigger
  const triggerAdVideo = () => {
    if (adTimerActive) return;
    setAdTimeLeft(adSecondsMax);
    setAdTimerActive(true);
  };

  // Clipboard copies invite 
  const copyInviterCode = () => {
    if (!user) return;
    const inviteLink = `https://sitecopy-ai-365634036726.asia-southeast1.run.app?code=${user.referralCode}`;
    navigator.clipboard.writeText(inviteLink);
    setClipboardCopied(true);
    setTimeout(() => setClipboardCopied(false), 2000);
  };

  // Clipboard copies invite code (only code)
  const copyOnlyCode = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.referralCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const getTaskUrl = (task: Task | null) => {
    if (!task || !task.url) return '';
    const taskBaseUrl = (CampaignStore.settings.customPostbackDomain && CampaignStore.settings.customPostbackDomain.trim() !== '') 
      ? CampaignStore.settings.customPostbackDomain.trim() 
      : window.location.origin;
    return `${taskBaseUrl}/api/redirect?task_id=${encodeURIComponent(task.id)}&user_id=${encodeURIComponent(user ? user.uid : '')}`;
  };

  // Start selected earning activity 
  const startTaskActivity = (task: Task) => {
    if (user?.vpnActive) {
      alert("❌ Operational Block: Anti-cheat module detected an active VPN. Disable VPN to proceed with tasks.");
      return;
    }

    if (task.completionsToday >= task.dailyLimit) {
      alert("❌ You have hit the continuous daily limit for this specific activity today.");
      return;
    }

    const userMax = task.userMaxCompletions !== undefined ? task.userMaxCompletions : 0;
    if (userMax > 0) {
      const userCompletedCount = userCompletions.filter((c: any) => c.taskId === task.id && c.status !== 'rejected').length;
      if (userCompletedCount >= userMax) {
        alert(`❌ Limitation Alert: Aap is task ko maximum ${userMax} baar hi complete kar sakte hain.`);
        return;
      }
    }

    setSelectedTask(task);
    setScreenshotTaskStarted(false);
    setScreenshotUpload('');
    setScreenshotUploadedName('');
    setTextProofInput('');

    // Dynamic verification routing
    if (task.verificationMethod === 'timer') {
      setTimerCount(task.timerSeconds || 15);
      setIsTimerRunning(true);
    } else if (task.category === 'quiz') {
      setActiveQuizIndex(0);
      setQuizAnswersSelection([]);
      setQuizFinished(false);
      setQuizScore(0);
    } else {
      setTimerCount(0);
      setIsTimerRunning(false);
    }
  };

  // Task screenshots simulation with AI Auto-Approval assistance
  const handleScreenshotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    const isScreenshotRequired = selectedTask.verificationMethods 
      ? (selectedTask.verificationMethods.includes('screenshot') || selectedTask.verificationMethods.includes('ai_screenshot'))
      : (selectedTask.verificationMethod === 'screenshot' || selectedTask.verificationMethod === 'ai_screenshot');

    const isTextProofRequired = selectedTask.verificationMethods
      ? selectedTask.verificationMethods.includes('text_proof')
      : (selectedTask.verificationMethod === 'text_proof');

    if (isScreenshotRequired && !screenshotUploadedName) {
      alert("Attach a virtual proof screenshot file.");
      return;
    }

    if (isTextProofRequired && !textProofInput.trim()) {
      alert("Please enter the required text proof input details.");
      return;
    }

    if (isScreenshotRequired && screenshotUpload) {
      const completionsList = JSON.parse(localStorage.getItem('cp_task_completions') || '[]');
      const isMockImage = screenshotUpload.includes("images.unsplash.com");
      
      if (!isMockImage) {
        const isDuplicateLocal = completionsList.some((c: any) => 
          c.screenshotURL && 
          c.screenshotURL.trim() === screenshotUpload.trim() && 
          c.status !== 'rejected'
        );
        
        const isDuplicateStore = CampaignStore.taskCompletions.some((c: any) => 
          c.screenshotURL && 
          c.screenshotURL.trim() === screenshotUpload.trim() && 
          c.status !== 'rejected'
        );
        
        if (isDuplicateLocal || isDuplicateStore) {
          alert("❌ Duplicate Image Detected:\nYeh screenshot pehle se hi platform par kisi user dwara upload kiya ja chuka hai! Aap same image/proof dobara submit nahi kar sakte.");
          return;
        }
      }
    }
    
    if (selectedTask) {
      const completionsList = JSON.parse(localStorage.getItem('cp_task_completions') || '[]');
      const newTcId = "tc_" + Math.random().toString(36).substring(2, 9);
      
      const newTc = {
        id: newTcId,
        userId: user!.uid,
        userEmail: user!.email,
        taskId: selectedTask.id,
        taskTitle: selectedTask.title,
        rewardAmount: selectedTask.rewardAmount,
        status: 'pending' as 'pending' | 'completed' | 'rejected',
        screenshotURL: isScreenshotRequired ? (screenshotUpload || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=350&q=80") : undefined,
        textProof: isTextProofRequired ? textProofInput.trim() : undefined,
        completedAt: new Date().toISOString()
      };

      const isAiScreenshot = selectedTask.verificationMethods 
        ? selectedTask.verificationMethods.includes('ai_screenshot')
        : selectedTask.verificationMethod === 'ai_screenshot';

      // Check if task has the auto-verification config or is configured for AI verification
      if (isScreenshotRequired && (isAiScreenshot || selectedTask.ratingAppId)) {
        setAiVerifying(true);
        setAiFeedback("Analyzing screenshot via Gemini Vision Engine...");
        try {
          const res = await fetch("/api/verify-screenshot", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              screenshotBase64: screenshotUpload || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=350&q=80",
              taskTitle: selectedTask.title,
              taskDescription: selectedTask.description,
              ratingAppId: selectedTask.ratingAppId || "",
            }),
          });
          const data = await res.json();
          if (data && data.approved) {
            newTc.status = 'completed';
            // Payout reward automatically!
            const redeemRes = CampaignStore.redeemTaskReward(selectedTask.id);
            alert(`✅ AI auto-verification APPROVED:\n\n${data.reason}\n\nRewarded ${selectedTask.rewardAmount} Rupees instantly!`);
            
            // Adjust local state user balance
            setUser({ ...CampaignStore.currentUser! });
          } else {
            newTc.status = 'rejected';
            const reqLabel = selectedTask.ratingAppId ? ` matching "${selectedTask.ratingAppId}"` : "";
            alert(`❌ AI auto-verification REJECTED:\n\n${data.reason}\n\nPlease upload a proper screenshot proving configuration details${reqLabel}.`);
          }
        } catch (err: any) {
          console.error("AI verify failed:", err);
          alert("⚠️ Network issue during AI verification. Pushed to manual review queue!");
        } finally {
          setAiVerifying(false);
          setAiFeedback("");
        }
      } else {
        alert("🎉 Proof submitted successfully for manual audit. Admin dashboard will review the queue!");
      }

      CampaignStore.taskCompletions.unshift(newTc);
      CampaignStore.saveTaskCompletions();

      // Instantly sync local state for immediate user view
      if (user) {
        setUserCompletions(CampaignStore.taskCompletions.filter((c: any) => c.userId === user.uid));
      }

      setSelectedTask(null);
      setScreenshotUpload('');
      setScreenshotUploadedName('');
      setTextProofInput('');
      refreshAdminDb();
    }
  };

  // Perform standard auto verification claims
  const handleAutoTaskClaim = () => {
    if (selectedTask) {
      const res = CampaignStore.redeemTaskReward(selectedTask.id);
      if (res.success) {
        alert(res.message);
        setUser({ ...CampaignStore.currentUser! });
        refreshAdminDb();
      }
      setSelectedTask(null);
    }
  };

  // Scratch card gamer mechanics
  const initScratchCard = () => {
    setScratchedValue(Math.floor(Math.random() * 15) + 2); // random winnings between Rs 2 and Rs 17
    setScratchRevealed(false);
    setScratchScraped(false);
  };

  const handleScratchAction = () => {
    if (scratchScraped) return;
    setScratchScraped(true);
    setTimeout(() => {
      setScratchRevealed(true);
      const logMsg = CampaignStore.redeemInstantGamer(scratchedValue, 'scratch');
      setUser({ ...CampaignStore.currentUser! });
      refreshAdminDb();
    }, 1000);
  };

  // Spin Wheel gamer Mechanics
  const handleSpinWheel = () => {
    if (wheelSpinning) return;
    setWheelSpinning(true);
    setWheelResult('');
    
    // Choose arbitrary rewards degrees: [30, 90, 150, 210, 270, 330] corresponding to ₹5, ₹20, Try Again, ₹50, ₹10, ₹15
    const segments = [
      { t: "₹5 Bonus", a: 5 },
      { t: "₹15 Earning", a: 15 },
      { t: "Try Again", a: 0 },
      { t: "₹50 Jackpot", a: 50 },
      { t: "₹10 Earning", a: 10 },
      { t: "₹2 Bonus", a: 2 }
    ];

    const targetIndex = Math.floor(Math.random() * segments.length);
    const stopRotationDeg = 360 * 5 + (targetIndex * 60) + 30; // Spin 5 times fully then land
    
    setWheelAngle(stopRotationDeg);

    setTimeout(() => {
      setWheelSpinning(false);
      const outcome = segments[targetIndex];
      setWheelResult(outcome.t);
      if (outcome.a > 0) {
        CampaignStore.redeemInstantGamer(outcome.a, 'spin');
        setUser({ ...CampaignStore.currentUser! });
        refreshAdminDb();
      }
    }, 2500);
  };

  const resetWheel = () => {
    setWheelAngle(0);
    setWheelResult('');
  };

  // Quiz submission
  const registerQuizAnswer = (optionIndex: number) => {
    if (!selectedTask || !selectedTask.quizQuestions) return;
    
    const isCorrect = optionIndex === selectedTask.quizQuestions[activeQuizIndex].correctIndex;
    const nextAnswers = [...quizAnswersSelection, optionIndex];
    setQuizAnswersSelection(nextAnswers);
    
    if (isCorrect) {
      setQuizScore(s => s + 1);
    }

    if (activeQuizIndex < selectedTask.quizQuestions.length - 1) {
      setActiveQuizIndex(a => a + 1);
    } else {
      // Quiz complete
      setQuizFinished(true);
      const earnedFull = nextAnswers.every((ans, qIdx) => ans === selectedTask.quizQuestions![qIdx].correctIndex);
      
      if (earnedFull) {
        CampaignStore.redeemTaskReward(selectedTask.id);
        setUser({ ...CampaignStore.currentUser! });
        refreshAdminDb();
      }
    }
  };

  // Withdraw requests submission
  const handleWithdrawalRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawMsg(null);

    const amountNum = parseFloat(payoutAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setWithdrawMsg({ success: false, text: "Provide a valid numeric cashout amount." });
      return;
    }

    if (!payoutDetails) {
      setWithdrawMsg({ success: false, text: "Destination address details are required." });
      return;
    }

    const res = CampaignStore.requestWithdrawal(payoutMethod, payoutDetails, amountNum);
    setWithdrawMsg({ success: res.success, text: res.message });

    if (res.success) {
      setPayoutAmount('');
      setUser({ ...CampaignStore.currentUser! });
      // Saving UPI ID cache logic
      if (payoutMethod === 'upi') {
        localStorage.setItem('cp_saved_upi', payoutDetails);
        setSavedUpiId(payoutDetails);
      }
      refreshAdminDb();
    }
  };

  // Coupon submitting
  const handlePromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoMsg(null);
    if (!promoInput) return;
    
    const res = CampaignStore.redeemCouponCode(promoInput);
    setPromoMsg({ success: res.success, text: res.message });
    
    if (res.success) {
      setPromoInput('');
      setUser({ ...CampaignStore.currentUser! });
      refreshAdminDb();
    }
  };

  // KYC Simulation Submit
  const handleKycSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycFileMock) {
      alert("Please select a simulated identity card file.");
      return;
    }
    const msg = CampaignStore.submitKYCRequest();
    setKycMsg(msg);
    setUser({ ...CampaignStore.currentUser! });
    refreshAdminDb();
  };

  // Simulated Offerwall complete action trigger
  const handleOfferwallSimulateComplete = (wallId: string, wallName: string) => {
    setOfferCompletedNotice('');
    const cashReward = Math.floor(Math.random() * 80) + 15; // Random Rs 15 to Rs 95 payout
    
    // Redeem payout coins
    CampaignStore.redeemOfferwall(cashReward, wallName);
    setUser({ ...CampaignStore.currentUser! });
    setOfferCompletedNotice(`Success: Completer Callback received for ${wallName}! Postback verified securely in background. Awarded +₹${cashReward.toFixed(2)} cash directly.`);
    refreshAdminDb();
  };

  // Filter tasks list view
  const filteredTasks = tasksList.filter(t => {
    if (!t.isActive) return false;
    if (t.category === 'campaign') return false; // Exclude campaigns entirely from generic tasks list
    if (categoryFilter === 'all') return true;
    return t.category === categoryFilter;
  });

  // VPN Anti Cheat triggers simulated
  const toggleVpnSim = () => {
    if (!user) return;
    const currentVpn = !user.vpnActive;
    CampaignStore.simulateVpnAction(currentVpn);
    setUser({ ...CampaignStore.currentUser! });
    refreshAdminDb();
  };

  const triggerKycReset = () => {
    if (!user) return;
    CampaignStore.adminVerifyKYC(user.uid, 'None');
    setUser({ ...CampaignStore.currentUser! });
    setKycMsg('');
    refreshAdminDb();
  };

  // Check user balance sums
  const coinsRate = CampaignStore.settings.pointsRate;
  const mainCoins = Math.floor((user?.balances.main || 0) * coinsRate);
  const bonusCoins = Math.floor((user?.balances.bonus || 0) * coinsRate);
  const referralCoins = Math.floor((user?.balances.referral || 0) * coinsRate);
  const totalCoinsToday = Math.floor((user?.balances.todayEarnings || 0) * coinsRate);

  // Authenticate user check layout
  if (!user) {
    return (
      <div className="flex-1 p-5 flex flex-col justify-between font-sans relative overflow-y-auto no-scrollbar">
        <div className="flex flex-col items-center mt-6">
          <div className="w-16 h-16 rounded-3xl bg-zinc-950 overflow-hidden flex items-center justify-center shadow-lg shadow-indigo-500/10 mb-3 border border-zinc-800">
            <img src={appLogo} alt="EarnOS Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-center">EarnOS</h1>
          <p className="text-xs text-zinc-400 text-center mt-1">Premium Earning App Simulator</p>
        </div>

        {/* Dynamic Auth Forms */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-5 shadow-xl my-4">
          <h2 className="text-lg font-bold font-display flex items-center gap-1.5 mb-2">
            <Award className="w-5 h-5 text-zinc-500" />
            {isLoginView ? 'OTP Sign In / Register' : 'Google Authentication'}
          </h2>
          <p className="text-xs text-zinc-400 mb-4">
            {isLoginView ? 'Submit your Gmail to receive a mock OTP 1-time password code.' : 'Experience fast seamless Google Signup simulations.'}
          </p>

          <form onSubmit={handleAuthSubmit} className="space-y-3.5">
            {isLoginView && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">Gmail Address</label>
                  <input 
                    type="email" 
                    placeholder="name@gmail.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-zinc-800 dark:text-zinc-100"
                  />
                </div>

                {!isOtpSent && (
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">User Nickname (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Rahul Sharma"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                )}

                {!isOtpSent && (
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">Referrer Code (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="Claim ₹10 Welcome Reward"
                      value={referralInput}
                      onChange={(e) => setReferralInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                )}
              </>
            )}

            {/* Simulated OTP field */}
            {isOtpSent && (
              <div className="bg-brand-50/50 dark:bg-brand-950/10 p-3 rounded-2xl border border-brand-100 dark:border-brand-950">
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">OTP CODE [Demo Token: 7799]</label>
                <input 
                  type="text" 
                  maxLength={4}
                  placeholder="Enter 7799"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm tracking-widest font-mono text-center bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-zinc-800 dark:text-zinc-100"
                />
              </div>
            )}

            {/* Interactive Anti-Bot Captcha */}
            <div className="bg-slate-50 dark:bg-zinc-800 p-3 rounded-2xl border border-slate-100 dark:border-zinc-700 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-brand-500" />
                <span className="text-xs font-semibold text-zinc-500">Security Captcha:</span>
                <span className="font-mono text-sm font-bold bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded text-zinc-800 dark:text-zinc-100">
                  {captchaNum1} + {captchaNum2}
                </span>
              </div>
              <input 
                type="number" 
                placeholder="Sum"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                required
                className="w-16 px-2 py-1 bg-white dark:bg-zinc-950 border border-slate-200 rounded-lg text-center text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none"
              />
            </div>

            {authError && (
              <div className="text-[11px] leading-relaxed text-red-500 bg-red-50/50 dark:bg-red-900/10 p-2.5 rounded-xl border border-red-100 dark:border-red-950 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {authError}
              </div>
            )}

            {authSuccess && (
              <div className="text-[11px] leading-relaxed text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-950 flex items-center gap-1">
                <CircleCheck className="w-3.5 h-3.5 flex-shrink-0" /> {authSuccess}
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
            >
              <span>{isOtpSent ? 'Verify & Continue' : 'Request Security Access'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-100 dark:border-zinc-800"></div>
            <span className="flex-shrink mx-4 text-[10px] text-zinc-400 font-mono uppercase font-semibold">Or</span>
            <div className="flex-grow border-t border-slate-100 dark:border-zinc-800"></div>
          </div>

          <button 
            type="button"
            onClick={handleMockGoogleLogin}
            className="w-full border border-slate-200 dark:border-zinc-800 space-x-2 py-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center font-medium bg-white dark:bg-zinc-950"
          >
            <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.65 1.58 15.01 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.86 3C6.4 7.55 8.95 5.04 12 5.04z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.88 3.39-8.5z" />
              <path fill="#FBBC05" d="M5.36 14.54c-.24-.72-.38-1.5-.38-2.3a7.8 7.8 0 01.38-2.3L1.5 6.94A11.96 11.96 0 000 12c0 1.83.41 3.56 1.14 5.12l4.22-2.58z" />
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.3 1.09-3.96 1.09-3.05 0-5.6-2.51-6.64-5.46L1.5 16.02C3.4 19.85 7.35 23 12 23z" />
            </svg>
            <span>Simulate Google One-Tap SDK</span>
          </button>
        </div>

        {/* Guest access notice */}
        <div className="text-center">
          <p className="text-[10px] text-zinc-400 leading-normal">
            By connecting, you consent to device verification hashes to blocks fraud accounts. Earning balances are simulated.
          </p>
        </div>
      </div>
    );
  }

  const isScreenshotRequired = selectedTask
    ? (selectedTask.verificationMethods 
        ? (selectedTask.verificationMethods.includes('screenshot') || selectedTask.verificationMethods.includes('ai_screenshot'))
        : (selectedTask.verificationMethod === 'screenshot' || selectedTask.verificationMethod === 'ai_screenshot'))
    : false;

  const isTextProofRequired = selectedTask
    ? (selectedTask.verificationMethods
        ? selectedTask.verificationMethods.includes('text_proof')
        : (selectedTask.verificationMethod === 'text_proof'))
    : false;

  const isTimerRequired = selectedTask
    ? (selectedTask.verificationMethods
        ? selectedTask.verificationMethods.includes('timer')
        : (selectedTask.verificationMethod === 'timer'))
    : false;

  const isPostbackRequired = selectedTask
    ? (selectedTask.verificationMethods
        ? (selectedTask.verificationMethods.includes('postback') || selectedTask.verificationMethods.includes('sdk_postback'))
        : (selectedTask.verificationMethod === 'postback' || selectedTask.verificationMethod === 'sdk_postback'))
    : false;

  const isAutoPayout = selectedTask
    ? (!isScreenshotRequired && !isTextProofRequired && !isTimerRequired && !isPostbackRequired && selectedTask.category !== 'campaign')
    : false;

  return (
    <div className="flex-1 flex flex-col justify-between h-full bg-slate-50 dark:bg-zinc-950">
      
      {/* 1. HEADER SECTION */}
      <div className="bg-brand-600 text-white rounded-b-[32px] pt-4 px-4 pb-5 shadow-lg shadow-brand-500/15 relative">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-zinc-950 overflow-hidden flex items-center justify-center border border-white/10 shrink-0">
              <img src={appLogo} alt="EarnOS Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h3 className="text-xs font-bold font-display tracking-tight leading-none">{CampaignStore.settings.appName}</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Logout button */}
            <button 
              onClick={handleLogout}
              className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg text-white"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Earning stats bento grid */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-2.5 border border-white/5">
            <span className="text-[9px] font-semibold text-white/70 block uppercase tracking-wider">Main Wallet</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold font-display">₹{user.balances.main.toFixed(2)}</span>
              <span className="text-[9px] text-white/80">({mainCoins} c)</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-2.5 border border-white/5">
            <span className="text-[9px] font-semibold text-white/70 block uppercase tracking-wider">Today Earned</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-bold font-display text-amber-300">₹{user.balances.todayEarnings.toFixed(2)}</span>
              <span className="text-[9px] text-white/80">({totalCoinsToday} c)</span>
            </div>
          </div>
        </div>

        {/* Auxiliary Stats mini rail */}
        <div className="flex items-center justify-around text-[10px] mt-3.5 opacity-90 px-1 pt-2 border-t border-white/10">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-emerald-300" />
            <span>Referrals: ₹{user.balances.referral.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-sky-200" />
            <span>Streak: {user.streakDays} days</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN SCROLLABLE BODY PANELS */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-8">
        


        {/* VPN active alert banner in Android App (Anti-Cheat system) */}
        {user.vpnActive && (
          <div className="mb-3.5 bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-3 rounded-2xl border border-red-200 dark:border-red-950 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-500 animate-bounce" />
              <div className="text-[10px] font-semibold">
                VPN Cheat Mode Detected! Tasks are blocked.
              </div>
            </div>
            <button 
              onClick={toggleVpnSim}
              className="text-[9px] bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-0.5 rounded-lg"
            >
              Kill VPN
            </button>
          </div>
        )}

        {/* Dynamic Static Ads Banner Simulation */}
        {CampaignStore.adConfig.bannerEnabled && (
          <div className="mb-3 bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 p-1.5 rounded-xl text-center flex flex-col items-center justify-center">
            <span className="text-[8px] uppercase tracking-widest text-zinc-400 font-mono font-bold">SPONSORED AD SPOT (AdMob TEST ID)</span>
            <div className="text-[9px] text-zinc-500 font-sans font-medium">
              Ears Rs 100/day by doing easy micro installations!
            </div>
          </div>
        )}

        {/* 2A. TAB VIEW: HOME / EARN PANEL */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            
            {/* Announcements Carousels Header */}
            {myNotifications.length > 0 && (
              <div 
                onClick={() => setActiveNotification(myNotifications[0])}
                className="bg-gradient-to-r from-brand-50 to-brand-100/50 dark:from-zinc-900 dark:to-zinc-800 border border-brand-200 dark:border-zinc-800 p-3 rounded-2xl flex items-center justify-between cursor-pointer shadow-sm hover:scale-[1.01] transition-transform"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-brand-100 dark:bg-brand-900/30 text-brand-600">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold flex items-center gap-1.5">
                      Latest Notice Info:
                      {(myNotifications[0].targetUserId || myNotifications[0].targetEmail) && (
                        <span className="text-[8px] bg-amber-500 text-white font-black px-1 py-0.2 rounded-full uppercase tracking-wider animate-pulse">
                          Personal
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-zinc-500 truncate w-56">{myNotifications[0].title}</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </div>
            )}

            {/* Dynamic Offerwall list panel */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Top Offerwalls Integrated</h3>
              
              <div className="grid grid-cols-3 gap-1.5">
                {CampaignStore.offerwalls.map(wall => (
                  <button
                    key={wall.id}
                    onClick={() => {
                      if (!wall.isActive) {
                        alert(`${wall.name} is currently deactivated by the administrator.`);
                        return;
                      }
                      setSelectedOfferwall(wall.id);
                    }}
                    className={`p-2 rounded-xl text-center border transition-all flex flex-col items-center justify-between h-22 bg-white dark:bg-zinc-900/60 ${
                      wall.isActive 
                        ? 'border-slate-200 dark:border-zinc-800 hover:border-brand-500' 
                        : 'border-zinc-100 dark:border-zinc-900 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-[9px] font-extrabold text-zinc-400 font-display leading-tight truncate w-full">{wall.name.split(' ')[0]}</span>
                    {wall.logoUrl ? (
                      <img 
                        src={wall.logoUrl} 
                        className="w-8 h-8 object-contain rounded-md" 
                        alt={wall.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          // Fallback to standard icon on error
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <CircleDollarSign className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="text-[8px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-extrabold px-1.5 rounded-full">
                      {wall.multiplier}x
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Premium Campaign Tasks Section */}
            {(() => {
              const campaignTasks = tasksList.filter(t => t.category === 'campaign' && t.isActive);
              if (campaignTasks.length === 0) return null;
              
              return (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500 fill-amber-300 animate-pulse" /> Live Campaign Offers
                    </h3>
                    <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">High Rewards</span>
                  </div>
                  
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                    {campaignTasks.map(task => {
                      const globalLimitReached = task.completionsToday >= task.dailyLimit;
                      const userMax = task.userMaxCompletions !== undefined ? task.userMaxCompletions : 0;
                      const userCompletedCount = userCompletions.filter((c: any) => c.taskId === task.id && c.status !== 'rejected').length;
                      const userLimitReached = userMax > 0 && userCompletedCount >= userMax;
                      const limitReached = globalLimitReached || userLimitReached;
                      
                      return (
                        <div 
                          key={task.id}
                          onClick={() => startTaskActivity(task)}
                          role="button"
                          tabIndex={0}
                          className={`bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 p-2 sm:p-2.5 rounded-[16px] flex flex-col items-center justify-between text-center shadow-3xs hover:scale-[1.03] hover:shadow-xs hover:border-indigo-200 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer active:scale-[0.98] select-none ${
                            limitReached ? 'opacity-50' : ''
                          }`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              startTaskActivity(task);
                            }
                          }}
                        >
                          {/* Square Rounded Logo Centered */}
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-slate-50 dark:bg-zinc-950 flex items-center justify-center border border-slate-100 dark:border-zinc-800 shrink-0 overflow-hidden shadow-3xs relative">
                            {task.logoUrl ? (
                              <img 
                                src={task.logoUrl} 
                                className="w-full h-full object-contain p-1" 
                                alt={task.title}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%233b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>';
                                }}
                              />
                            ) : (
                              <Sparkles className="w-5 h-5 text-indigo-500 fill-indigo-200" />
                            )}
                          </div>
                          
                          {/* Title and Shortened Description centered */}
                          <div className="w-full mt-2 flex-1 flex flex-col justify-center min-w-0">
                            <h4 className="text-[10px] sm:text-[11px] font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-tight truncate w-full px-0.5">
                              {task.title}
                            </h4>
                            <p className="text-[8.5px] text-zinc-400 dark:text-zinc-400 font-semibold leading-none truncate w-full px-0.5 mt-0.5">
                              {task.description}
                            </p>
                          </div>
                          
                          {/* Capsule / Pill button containing Coin details */}
                          <div className={`mt-2 py-0.5 px-2 rounded-full flex items-center justify-center gap-1 border transition-all ${
                            limitReached
                              ? 'bg-zinc-100 border-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700'
                              : 'bg-amber-50 border-amber-200/50 dark:bg-amber-950/20 dark:border-amber-900/30 text-amber-600 dark:text-amber-400 font-extrabold font-display'
                          }`}>
                            <div className="w-3 h-3 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-full flex items-center justify-center text-white font-black text-[7px] shadow-3xs select-none shrink-0">
                              ₹
                            </div>
                            <span className="text-[8.5px] sm:text-[9.5px] font-black tracking-tight leading-none select-none">
                              {limitReached ? (userLimitReached ? 'Claimed' : 'Full') : `+₹${task.rewardAmount.toFixed(0)}`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Tasks Filtering tab controllers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Earning Tasks Hub</h3>
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent text-[11px] text-brand-600 font-bold focus:outline-none"
                >
                  <option value="all">All Channels</option>
                  <option value="app_install">Install Packs</option>
                  <option value="web_visit">Site Visits</option>
                  <option value="youtube">YouTube Channels</option>
                  <option value="telegram">Telegram joins</option>
                  <option value="quiz">GK Quizzes</option>
                  <option value="rating">Reviews</option>
                </select>
              </div>

              {/* Verified Tasks listing */}
              <div className="space-y-2">
                {filteredTasks.length === 0 ? (
                  <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl text-center border border-slate-100 dark:border-zinc-800">
                    <p className="text-xs text-zinc-400">No active tasks found in this section right now.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                    {filteredTasks.map(task => {
                      const globalLimitReached = task.completionsToday >= task.dailyLimit;
                      const userMax = task.userMaxCompletions !== undefined ? task.userMaxCompletions : 0;
                      const userCompletedCount = userCompletions.filter((c: any) => c.taskId === task.id && c.status !== 'rejected').length;
                      const userLimitReached = userMax > 0 && userCompletedCount >= userMax;
                      const limitReached = globalLimitReached || userLimitReached;
                      
                      return (
                        <div 
                          key={task.id}
                          onClick={() => startTaskActivity(task)}
                          role="button"
                          tabIndex={0}
                          className={`bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 p-2 sm:p-2.5 rounded-[16px] flex flex-col items-center justify-between text-center shadow-3xs hover:scale-[1.03] hover:shadow-xs hover:border-indigo-200 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer active:scale-[0.98] select-none ${
                            limitReached ? 'opacity-50' : ''
                          }`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              startTaskActivity(task);
                            }
                          }}
                        >
                          {/* Square Rounded Logo Centered */}
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-slate-50 dark:bg-zinc-950 flex items-center justify-center border border-slate-100 dark:border-zinc-800 shrink-0 overflow-hidden shadow-3xs relative">
                            {task.logoUrl ? (
                              <img 
                                src={task.logoUrl} 
                                className="w-full h-full object-contain p-1" 
                                alt={task.title}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  // Fallback SVG award icon on error
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%233b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>';
                                }}
                              />
                            ) : (
                              <>
                                {task.category === 'web_visit' && <Globe className="w-5 h-5 text-indigo-500" />}
                                {task.category === 'youtube' && <Youtube className="w-5 h-5 text-red-500" />}
                                {task.category === 'telegram' && <Send className="w-5 h-5 text-blue-500" />}
                                {task.category === 'rating' && <Star className="w-5 h-5 text-amber-500 fill-amber-500" />}
                                {task.category === 'app_install' && <Download className="w-5 h-5 text-emerald-500" />}
                                {task.category === 'quiz' && <HelpCircle className="w-5 h-5 text-amber-500" />}
                                {task.category === 'social' && <Instagram className="w-5 h-5 text-pink-500" />}
                                {task.category === 'campaign' && <Sparkles className="w-5 h-5 text-indigo-500 fill-indigo-200" />}
                              </>
                            )}
                          </div>
                          
                          {/* Title and Shortened Description centered */}
                          <div className="w-full mt-2 flex-1 flex flex-col justify-center min-w-0">
                            <h4 className="text-[10px] sm:text-[11px] font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-tight truncate w-full px-0.5" title={task.title}>
                              {task.title}
                            </h4>
                            <p className="text-[8.5px] text-zinc-400 dark:text-zinc-400 font-semibold leading-none truncate w-full px-0.5 mt-0.5" title={task.description}>
                              {task.description}
                            </p>
                          </div>
                          
                          {/* Capsule / Pill button containing Coin details */}
                          <div className={`mt-2 py-0.5 px-2 rounded-full flex items-center justify-center gap-1 border transition-all ${
                            limitReached
                              ? 'bg-zinc-100 border-zinc-200 text-zinc-400 dark:bg-zinc-805 dark:border-zinc-700'
                              : 'bg-amber-50 border-amber-200/50 dark:bg-amber-950/20 dark:border-amber-900/30 text-amber-600 dark:text-amber-400 font-extrabold font-display'
                          }`}>
                            <div className="w-3 h-3 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-full flex items-center justify-center text-white font-black text-[7px] shadow-3xs select-none shrink-0">
                              ₹
                            </div>
                            <span className="text-[8.5px] sm:text-[9.5px] font-black tracking-tight leading-none select-none">
                              {limitReached ? (userLimitReached ? 'Claimed' : 'Full') : `+₹${task.rewardAmount.toFixed(0)}`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 📸 User Screenshot Submissions Vault / Storage */}
            {userCompletions.filter(comp => comp.screenshotURL && comp.screenshotURL.trim() !== '').length > 0 && (
              <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 p-4 rounded-3xl shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black font-display flex items-center gap-1.5 text-zinc-850 dark:text-zinc-100 uppercase tracking-widest text-[9px]">
                    <Camera className="w-4 h-4 text-indigo-500" /> 📸 My Uploaded Screenshots & Proofs ({userCompletions.filter(comp => comp.screenshotURL && comp.screenshotURL.trim() !== '').length})
                  </h3>
                  <span className="text-[9px] bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-zinc-300 font-mono font-bold px-1.5 py-0.5 rounded-full">Secure Storage</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {userCompletions.filter(comp => comp.screenshotURL && comp.screenshotURL.trim() !== '').map((comp) => (
                    <div key={comp.id} className="border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/60 rounded-2xl overflow-hidden flex flex-col justify-between">
                      <div className="relative group cursor-zoom-in" onClick={() => setZoomedImageUrl(getSafeImageUrl(comp.screenshotURL))}>
                        <img 
                          src={getSafeImageUrl(comp.screenshotURL)} 
                          alt={comp.taskTitle} 
                          className="w-full h-24 object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-1.5 right-1.5">
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase border ${
                            comp.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800' :
                            comp.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/85 dark:text-red-350 dark:border-red-800' :
                            'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800 animate-pulse'
                          }`}>
                            {comp.status}
                          </span>
                        </div>
                      </div>
                      <div className="p-2 space-y-1">
                        <span className="text-[8px] font-mono font-bold text-zinc-400 block pb-0.5 border-b border-dashed dark:border-zinc-800">File ID: {comp.id}</span>
                        <span className="text-[10px] font-bold text-slate-800 dark:text-zinc-100 block truncate" title={comp.taskTitle}>
                          {comp.taskTitle}
                        </span>
                        <div className="flex items-center justify-between text-[8px] pt-1 mt-1 border-t border-slate-150/50 dark:border-zinc-850">
                          <span className="text-emerald-600 font-extrabold">+₹{Number(comp.rewardAmount).toFixed(1)}</span>
                          <span className="text-zinc-400 font-mono">
                            {new Date(comp.completedAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* 2C. TAB VIEW: WALLET PANEL */}
        {activeTab === 'wallet' && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-base font-bold font-display">Cash Withdraw desk</h2>
              <p className="text-[10px] text-zinc-400 mt-0.5">Secure instantaneous payments via UPI or Bank payouts.</p>
            </div>

            {/* Quick Balance summary sheet */}
            <div className="bg-slate-900 text-white border border-slate-950 p-4 rounded-2xl">
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Available balance payout ready</span>
              <h3 className="text-2xl font-black font-display text-emerald-400 whitespace-nowrap mt-1">
                ₹{user.balances.main.toFixed(2)}
              </h3>
              
              <div className="flex gap-4 mt-3 pt-3 border-t border-slate-800 text-[10px] text-zinc-400">
                <div>
                  <span className="block text-[8px] text-zinc-500 lowercase">Ref cash</span>
                  <span className="font-bold text-slate-100 font-display">₹{user.balances.referral.toFixed(2)}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-zinc-500 lowercase">Min requirement</span>
                  <span className="font-bold text-amber-400">₹{CampaignStore.settings.minWithdrawal.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Withdraw form */}
            <form onSubmit={handleWithdrawalRequest} className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 p-4 rounded-2xl space-y-4 shadow-sm">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Select Payout Wallet</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPayoutMethod('upi');
                      if (savedUpiId) setPayoutDetails(savedUpiId);
                    }}
                    className={`py-2 px-3 border rounded-xl text-center font-bold text-[11px] font-display transition-colors ${
                      payoutMethod === 'upi' ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/20' : 'border-slate-200 text-zinc-500 dark:border-zinc-800'
                    }`}
                  >
                    UPI Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('bank')}
                    className={`py-2 px-3 border rounded-xl text-center font-bold text-[11px] font-display transition-colors ${
                      payoutMethod === 'bank' ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/20' : 'border-slate-200 text-zinc-500 dark:border-zinc-800'
                    }`}
                  >
                    Bank Account
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  {payoutMethod === 'upi' && 'Active UPI ID'}
                  {payoutMethod === 'paytm' && 'Paytm Account Mobile Number'}
                  {payoutMethod === 'bank' && 'Account No + IFSC Code'}
                  {payoutMethod === 'crypto' && 'TRC20 Wallet Address'}
                </label>
                <input 
                  type="text"
                  placeholder={
                    payoutMethod === 'upi' ? 'e.g. name@okaxis' :
                    payoutMethod === 'paytm' ? '10-digit mobile number' :
                    payoutMethod === 'bank' ? 'Account Number, IFSC' : 'TRX/USDT Address'
                  }
                  value={payoutDetails}
                  onChange={(e) => setPayoutDetails(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Withdrawal Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">₹</span>
                  <input 
                    type="number"
                    placeholder="Enter sum"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    required
                    className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              {withdrawMsg && (
                <div className={`p-2.5 rounded-xl text-[10px] leading-relaxed border ${
                  withdrawMsg.success 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20' 
                    : 'bg-red-50 text-red-500 border-red-100 dark:bg-red-950/20'
                }`}>
                  {withdrawMsg.text}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/20"
              >
                Submit Withdrawal Request
              </button>
            </form>

            {/* Withdraw logs list */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Withdraw Payout logs</h3>
              {CampaignStore.withdrawals.filter(w => w.userId === user.uid).length === 0 ? (
                <p className="text-[11px] text-zinc-400 text-center py-4">No previous withdrawal requests logged yet.</p>
              ) : (
                CampaignStore.withdrawals.filter(w => w.userId === user.uid).map(wd => (
                  <div key={wd.id} className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 p-3 rounded-2xl flex items-center justify-between gap-2 shadow-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase text-zinc-400">{wd.paymentMethod} Payment</span>
                        <span className={`text-[8px] px-1.5 rounded uppercase font-extrabold ${
                          wd.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                          wd.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                          'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        }`}>
                          {wd.status}
                        </span>
                      </div>
                      <p className="text-[9px] text-zinc-500 mt-1 truncate w-40">Destination: {wd.paymentDetails}</p>
                      <p className="text-[8px] text-zinc-400 mt-0.5">{new Date(wd.requestedAt).toLocaleDateString()}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-slate-800 dark:text-zinc-100 font-display">₹{wd.amount}</span>
                      {wd.paymentProofURL && (
                        <a 
                          href={wd.paymentProofURL} 
                          target="_blank" 
                          rel="noreferrer"
                          className="block text-[8px] text-brand-600 font-extrabold underline mt-1"
                        >
                          View Receipt
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 2D. TAB VIEW: REFERRALS PANEL */}
        {activeTab === 'referrals' && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-base font-bold font-display">Invite & Earn</h2>
              <p className="text-[10px] text-zinc-400 mt-0.5">Invite your friends and earn direct withdrawable cash.</p>
            </div>

            {/* Invite card layout */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 rounded-2xl shadow-md border border-indigo-700">
              <span className="text-[9px] uppercase tracking-widest text-indigo-200 block font-bold">Your Unique Referral coupon</span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2 bg-white/10 backdrop-blur p-3 rounded-xl border border-white/5">
                <span className="font-mono text-xl font-bold font-display tracking-widest text-center sm:text-left">{user.referralCode}</span>
                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                  <button 
                    onClick={copyOnlyCode}
                    className="bg-white/20 active:scale-95 hover:bg-white/30 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer"
                  >
                    {codeCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{codeCopied ? 'Code Copied' : 'Copy Code'}</span>
                  </button>
                  <button 
                    onClick={copyInviterCode}
                    className="bg-white active:scale-95 hover:bg-zinc-50 text-zinc-950 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow transition-all cursor-pointer"
                  >
                    {clipboardCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{clipboardCopied ? 'Link Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
              
              <div className="mt-4 text-center text-[10px] bg-white/10 p-2 rounded-xl border border-white/10 leading-snug">
                <p className="font-medium text-indigo-100">
                  🎁 Invite reward: <strong className="text-white">₹5.00 Cash</strong> credited instantly inside your wallet when your referee completes their first successful withdrawal!
                </p>
              </div>
            </div>

            {/* Referral system ledger summaries */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 p-3 rounded-2xl">
              <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5 mb-2.5">
                <Users className="w-4 h-4 text-brand-600" /> Invite Statistics
              </h3>
              
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-xl">
                  <span className="text-[16px] font-semibold text-brand-600 font-display">
                    {CampaignStore.referrals.filter(r => r.referrerId === user.uid && r.status === 'completed').length}
                  </span>
                  <span className="block text-[8px] text-zinc-400 uppercase mt-0.5">Completed (Paid ₹5)</span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-xl">
                  <span className="text-[16px] font-semibold text-amber-600 font-display">
                    {CampaignStore.referrals.filter(r => r.referrerId === user.uid && r.status === 'pending').length}
                  </span>
                  <span className="block text-[8px] text-zinc-400 uppercase mt-0.5">Pending (Wait Withdraw)</span>
                </div>
              </div>
            </div>

            {/* Referrals ledger log */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Your Team Submissions</h3>
              {CampaignStore.referrals.filter(r => r.referrerId === user.uid).length === 0 ? (
                <p className="text-[11px] text-zinc-400 text-center py-4">No team signups registered via link yet.</p>
              ) : (
                CampaignStore.referrals.filter(r => r.referrerId === user.uid).map(ref => (
                  <div key={ref.id} className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 p-2.5 rounded-2xl flex items-center justify-between shadow-xs">
                    <div>
                      <h4 className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">{ref.refereeName}</h4>
                      <p className="text-[9px] text-zinc-400">{ref.refereeEmail}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[8px] px-1.5 py-0.5 font-extrabold rounded-full uppercase block ${
                        ref.status === 'completed'
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                      }`}>
                        {ref.status === 'completed' ? 'Paid' : 'Pending'}
                      </span>
                      <span className={`text-[10px] font-bold mt-1 block ${ref.status === 'completed' ? 'text-emerald-600' : 'text-zinc-450'}`}>
                        {ref.status === 'completed' ? '+₹5.00' : '₹5 Pending'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>


          </div>
        )}

        {/* 2E. TAB VIEW: PROFILE & KYC CONFIGS */}
        {activeTab === 'profile' && (
          <div className="space-y-4">

            {/* 🪪 PERSONAL USER ID CARD / PASSPORT */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-zinc-900/50 dark:to-zinc-950/50 border border-indigo-100/65 dark:border-zinc-800 p-4 rounded-3xl shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-indigo-600/20 font-display">
                    {user.displayName.substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider font-display flex items-center gap-1">
                      {user.displayName} {user.vipMember && <span className="text-[10px]">👑</span>}
                    </h3>
                    <p className="text-[9px] text-zinc-400">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded-full uppercase tracking-widest">{user.userRank}</span>
                </div>
              </div>

              <div className="border-t border-indigo-100/50 dark:border-zinc-800/80 pt-3 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-zinc-405 uppercase tracking-wider block">My User ID Code (Submit to admin to verify/inspect)</span>
                  <span className="font-mono text-[11px] font-extrabold text-slate-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-lg border border-indigo-50 dark:border-zinc-850 select-all">{user.uid}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(user.uid);
                    alert("ID Code copied successfully! Forward this to owner or support admin to verify transactions.");
                  }}
                  className="bg-white hover:bg-slate-50 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-extrabold text-[9px] px-2.5 py-1.5 rounded-xl border border-indigo-100 dark:border-zinc-800 transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" /> Copy ID Code
                </button>
              </div>
            </div>

            {/* 🔔 App notifications Inbox Panel */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-805 p-4 rounded-3xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black font-display flex items-center gap-1.5 text-zinc-850 dark:text-zinc-100 uppercase tracking-widest text-[9px]">
                  <Award className="w-4 h-4 text-brand-600" /> 🔔 Notification Box ({myNotifications.length})
                </h3>
                <span className="text-[9px] bg-brand-50 dark:bg-zinc-800 text-brand-600 dark:text-brand-300 font-mono font-bold px-1.5 py-0.5 rounded-full">Secure Inbox</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {myNotifications.length === 0 ? (
                  <div className="text-center py-6 text-zinc-400 dark:text-zinc-500 text-[11px] space-y-1">
                    <p className="font-bold">No active notifications</p>
                    <p className="text-[9px]">You're all caught up! When you receive custom notifications, they'll show up here.</p>
                  </div>
                ) : (
                  myNotifications.map((notif) => {
                    const isTargeted = notif.targetUserId || notif.targetEmail;
                    return (
                      <div 
                        key={notif.id}
                        onClick={() => setActiveNotification(notif)}
                        className={`p-2.5 rounded-2xl border transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex flex-col gap-1.5 bg-slate-50 dark:bg-zinc-850 dark:border-zinc-800 ${
                          isTargeted 
                            ? 'border-amber-250 bg-amber-50/20 dark:bg-amber-950/10 dark:border-amber-900/40' 
                            : 'border-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[8px] uppercase font-mono font-bold px-1.5 py-0.5 rounded-full ${
                            notif.type === 'alert' 
                              ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' 
                              : notif.type === 'update' 
                                ? 'bg-purple-150 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400' 
                                : 'bg-brand-100 text-brand-600 dark:bg-brand-950/20 dark:text-brand-400'
                          }`}>
                            {notif.type}
                          </span>
                          
                          <div className="flex items-center gap-1.5">
                            {isTargeted && (
                              <span className="text-[8px] font-black uppercase tracking-wider bg-amber-500 text-white px-1.5 py-0.5 rounded-full">
                                Personal Msg
                              </span>
                            )}
                            <span className="text-[8px] text-zinc-400 font-mono">
                              {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[11px] font-extrabold text-slate-800 dark:text-zinc-200 line-clamp-1">{notif.title}</h4>
                          <p className="text-[10px] text-zinc-500 line-clamp-2 mt-0.5 leading-relaxed">{notif.message}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 📸 User Screenshot Submissions Vault / Storage */}
            {userCompletions.filter(comp => comp.screenshotURL && comp.screenshotURL.trim() !== '').length > 0 && (
              <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 p-4 rounded-3xl shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black font-display flex items-center gap-1.5 text-zinc-850 dark:text-zinc-100 uppercase tracking-widest text-[9px]">
                    <Camera className="w-4 h-4 text-indigo-500" /> 📸 My Uploaded Screenshots & Proofs ({userCompletions.filter(comp => comp.screenshotURL && comp.screenshotURL.trim() !== '').length})
                  </h3>
                  <span className="text-[9px] bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-zinc-300 font-mono font-bold px-1.5 py-0.5 rounded-full">Secure Storage</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {userCompletions.filter(comp => comp.screenshotURL && comp.screenshotURL.trim() !== '').map((comp) => (
                    <div key={comp.id} className="border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/60 rounded-2xl overflow-hidden flex flex-col justify-between">
                      <div className="relative group animate-fade-in cursor-zoom-in" onClick={() => setZoomedImageUrl(getSafeImageUrl(comp.screenshotURL))}>
                        <img 
                          src={getSafeImageUrl(comp.screenshotURL)} 
                          alt={comp.taskTitle} 
                          className="w-full h-24 object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-1.5 right-1.5">
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase border ${
                            comp.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800' :
                            comp.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/85 dark:text-red-350 dark:border-red-800' :
                            'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800 animate-pulse'
                          }`}>
                            {comp.status}
                          </span>
                        </div>
                      </div>
                      <div className="p-2 space-y-1">
                        <span className="text-[8px] font-mono font-bold text-zinc-400 block pb-0.5 border-b border-dashed dark:border-zinc-800">File ID: {comp.id}</span>
                        <span className="text-[10px] font-bold text-slate-800 dark:text-zinc-100 block truncate" title={comp.taskTitle}>
                          {comp.taskTitle}
                        </span>
                        <div className="flex items-center justify-between text-[8px] pt-1 mt-1 border-t border-slate-150/50 dark:border-zinc-850">
                          <span className="text-emerald-600 font-extrabold">+₹{Number(comp.rewardAmount).toFixed(1)}</span>
                          <span className="text-zinc-400 font-mono">
                            {new Date(comp.completedAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Promo Code submitting */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
              <h3 className="text-xs font-bold font-display flex items-center gap-1.5 mb-1.5">
                <Gift className="w-4 h-4 text-indigo-600" /> Apply Coupon / Promo Code
              </h3>
              <p className="text-[9px] text-zinc-400 mb-3">Claim rewards instantly added to your main withdrawable balance by submitting a valid promo code key.</p>
              
              <form onSubmit={handlePromoSubmit} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="ENTER PROMO CODE" 
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-zinc-855 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs uppercase font-mono tracking-widest text-zinc-800 dark:text-zinc-100 focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-zinc-950 hover:bg-zinc-900 text-white px-4 py-1.5 rounded-xl text-xs font-extrabold transition-colors font-display"
                >
                  Verify
                </button>
              </form>

              {promoMsg && (
                <p className={`text-[9px] mt-2 font-medium ${promoMsg.success ? 'text-emerald-600' : 'text-red-500'}`}>
                  {promoMsg.text}
                </p>
              )}
            </div>

            {/* Anti Fraud VPN simulated dashboard controls (Anti cheating verification) */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 p-4 rounded-2xl shadow-sm space-y-3">
              <h3 className="text-xs font-bold font-display text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-500" /> Fraud Guard & Emulator
              </h3>
              <p className="text-[9px] text-zinc-400">EarnOS has automated anti-abuse systems including device hardware hashes and VPN shields. Toggle this to see them work.</p>
              
              <div className="pt-1.5 flex items-center justify-between text-xs border-t border-slate-100 dark:border-zinc-800">
                <div>
                  <span className="block font-bold">Local Device ID Secure</span>
                  <span className="text-[10px] text-zinc-400 font-mono font-medium truncate w-32 block">{user.deviceFingerprint}</span>
                </div>
                <span className="text-[8px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                  Secure
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-zinc-805">
                <div>
                  <span className="block font-bold">Fictional VPN Shield</span>
                  <span className="text-[9px] text-zinc-400">Current status: {user.vpnActive ? 'VPN ACTIVE' : 'VPN OFF'}</span>
                </div>
                <button
                  onClick={toggleVpnSim}
                  className={`px-3 py-1 text-[9px] font-bold rounded-lg transition-colors ${
                    user.vpnActive ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100'
                  }`}
                >
                  {user.vpnActive ? 'Deactivate VPN' : 'Simulate VPN Trigger'}
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* 3. FOOTER TAB NAVIGATION SYSTEM BAR */}
      <div className={`h-14 border-t px-2 flex items-center justify-around rounded-t-[20px] shadow-lg sticky bottom-0 z-40 select-none ${
        theme === 'dark' ? 'bg-slate-900 border-zinc-800 text-zinc-300' : 'bg-white border-slate-100 text-zinc-600'
      }`}>
        <button 
          onClick={() => { setActiveTab('home'); setSelectedTask(null); }}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors ${
            activeTab === 'home' ? 'text-brand-600 font-bold' : 'opacity-70 hover:opacity-100'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] mt-0.5">Tasks</span>
        </button>

        <button 
          onClick={() => { setActiveTab('wallet'); setSelectedTask(null); }}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors ${
            activeTab === 'wallet' ? 'text-brand-605 font-bold' : 'opacity-70 hover:opacity-100'
          }`}
        >
          <Coins className="w-5 h-5" />
          <span className="text-[9px] mt-0.5">Withdraw</span>
        </button>

        <button 
          onClick={() => { setActiveTab('referrals'); setSelectedTask(null); }}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors ${
            activeTab === 'referrals' ? 'text-brand-600 font-bold' : 'opacity-70 hover:opacity-100'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[9px] mt-0.5">Invites</span>
        </button>

        <button 
          onClick={() => { setActiveTab('profile'); setSelectedTask(null); }}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors ${
            activeTab === 'profile' ? 'text-brand-600 font-bold' : 'opacity-70 hover:opacity-100'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[9px] mt-0.5">Menu</span>
        </button>
      </div>

      {/* --- ALL MODALS OVERLAYS --- */}

      {/* 4A. POPUP ANNOUNCEMENT NOTIFICATION */}
      {activeNotification && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 w-full max-w-xs shadow-2xl relative select-none">
            <button 
              onClick={() => setActiveNotification(null)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold block mb-2">{activeNotification.title}</h3>
            <p className="text-xs text-zinc-550 leading-relaxed mb-4">{activeNotification.message}</p>
            <button 
              onClick={() => setActiveNotification(null)}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 rounded-xl text-xs transition-colors"
            >
              Understand!
            </button>
          </div>
        </div>
      )}

      {/* 4B. POPUP OFFERWALL SURGERY SIMULATOR */}
      {selectedOfferwall && (() => {
        const wallObj = CampaignStore.offerwalls.find(o => o.id === selectedOfferwall);
        return (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 w-full max-w-xs shadow-2xl relative">
              <button 
                onClick={() => { setSelectedOfferwall(null); setOfferCompletedNotice(''); }}
                className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-650"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-2 mb-3">
                {wallObj?.logoUrl ? (
                  <img 
                    src={wallObj.logoUrl} 
                    className="w-7 h-7 object-contain rounded" 
                    alt={wallObj.name}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <CircleDollarSign className="w-5 h-5 text-amber-500" />
                )}
                <h3 className="text-sm font-black font-display tracking-tight uppercase leading-none">
                  {wallObj?.name || selectedOfferwall.toUpperCase()}
                </h3>
              </div>
              
              <p className="text-[11px] text-zinc-400 leading-normal mb-3">
                Our offerwalls use high-speed secure API callback connections. Complete one mock offer here to see the points credited.
              </p>

              {wallObj?.redirectUrl && (
                <div className="mb-3 bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-slate-200/40 dark:border-zinc-800 space-y-1.5 text-[10px]">
                  <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Redirect Integration Destination</span>
                  <p className="text-[9px] text-zinc-500 truncate font-mono leading-none">{wallObj.redirectUrl}</p>
                  <button
                    type="button"
                    onClick={() => {
                      let targetUrl = wallObj.redirectUrl || '';
                      if (user) {
                        targetUrl = targetUrl
                          .replace('{user_id}', user.uid)
                          .replace('{user}', encodeURIComponent(user.displayName))
                          .replace('{email}', encodeURIComponent(user.email));
                      }
                      window.open(targetUrl, '_blank');
                    }}
                    className="w-full bg-brand-650 hover:bg-brand-600 dark:bg-indigo-600 dark:hover:bg-indigo-505 text-white font-bold py-1.5 rounded-lg text-[9px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>🔥 Visit Live Offer Wall</span>
                  </button>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-xl text-[10px] leading-relaxed border space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-500">Offer Name:</span>
                  <span className="font-semibold">Survey Reward #928</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-500">Credits Paid:</span>
                  <span className="font-display font-extrabold text-amber-500">+₹45 Cash</span>
                </div>
              </div>

              {offerCompletedNotice && (
                <div className="mb-3.5 text-[9px] leading-relaxed text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-100 font-medium font-mono">
                  {offerCompletedNotice}
                </div>
              )}

              <button 
                onClick={() => handleOfferwallSimulateComplete(selectedOfferwall, wallObj?.name || selectedOfferwall)}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 rounded-xl text-xs transition-colors shadow shadow-brand-500/20"
              >
                Complete Simulated Offer Completer
              </button>
            </div>
          </div>
        );
      })()}

      {/* 4C. POPUP ACTIVE TASK WORKSPACE SCREEN */}
      {selectedTask && (
        <div className="absolute inset-0 bg-white dark:bg-zinc-950 z-45 pt-12 pb-6 px-4 flex flex-col justify-between overflow-y-auto animate-slide-up">
          <div>
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">TASK IN WORKSPACE</span>
              <button 
                onClick={() => setSelectedTask(null)}
                className="text-zinc-400 hover:text-zinc-650"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 flex items-start gap-3">
              {selectedTask.logoUrl ? (
                <img 
                  src={selectedTask.logoUrl} 
                  className="w-12 h-12 object-contain rounded-2xl border border-slate-200/50 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 p-1 flex-shrink-0"
                  alt={selectedTask.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%233b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>';
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl border border-slate-200/50 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 p-1 flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-indigo-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-extrabold font-display leading-snug">{selectedTask.title}</h2>
                <span className="text-[9px] bg-slate-100 dark:bg-zinc-805 text-zinc-500 font-extrabold px-1.5 py-0.5 rounded uppercase mt-1 inline-block">
                  {selectedTask.category}
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed mt-3.5 p-3 bg-slate-50 dark:bg-zinc-900 rounded-2xl border">
              {selectedTask.description}
            </p>

            {/* Tutorial & Walkthrough Support */}
            {(selectedTask.tutorialVideoUrl || selectedTask.tutorialImageUrl) && (
              <div className="mt-4 p-4 bg-indigo-50/70 dark:bg-zinc-900 border border-indigo-100 dark:border-zinc-800 rounded-3xl space-y-3">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-2 text-[9px] bg-indigo-600 dark:bg-indigo-700 text-white font-extrabold uppercase rounded-full tracking-wider animate-pulse">
                    Tutorial Guide
                  </span>
                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                    Task kaise pura karein, guide niche dekhein:
                  </span>
                </div>

                {selectedTask.tutorialVideoUrl && (
                  <div className="space-y-2">
                    {(() => {
                      const videoUrl = selectedTask.tutorialVideoUrl.trim();
                      const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
                      
                      if (isYouTube) {
                        let embedUrl = "";
                        try {
                          if (videoUrl.includes('youtu.be/')) {
                            const idPart = videoUrl.split('youtu.be/')[1];
                            const videoId = idPart ? idPart.split('?')[0].split('/')[0] : "";
                            embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0` : videoUrl;
                          } else if (videoUrl.includes('/shorts/')) {
                            const idPart = videoUrl.split('/shorts/')[1];
                            const videoId = idPart ? idPart.split('?')[0].split('/')[0] : "";
                            embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0` : videoUrl;
                          } else if (videoUrl.includes('watch?v=')) {
                            const videoId = videoUrl.split('watch?v=')[1]?.split('&')[0];
                            embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0` : videoUrl;
                          } else if (videoUrl.includes('/embed/')) {
                            embedUrl = videoUrl;
                          } else {
                            const match = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
                            embedUrl = match && match[1] ? `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0` : videoUrl;
                          }
                        } catch (e) {
                          embedUrl = videoUrl;
                        }

                        return (
                          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-indigo-150/80 bg-zinc-950">
                            <iframe
                              src={embedUrl}
                              title="Task Walkthrough Video"
                              className="w-full h-full absolute inset-0 border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                        );
                      } else {
                        const isAbsolute = videoUrl.startsWith('http://') || videoUrl.startsWith('https://');
                        const isRelativeUpload = videoUrl.startsWith('/uploads/');
                        const finalVideoUrl = (isAbsolute && !videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) || isRelativeUpload
                          ? `/api/media-proxy?url=${encodeURIComponent(videoUrl)}`
                          : videoUrl;
                        const isMov = videoUrl.toLowerCase().endsWith('.mov');
                        
                        return (
                          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-indigo-150/80 bg-zinc-950">
                            <video 
                              src={finalVideoUrl} 
                              controls 
                              preload="metadata"
                              playsInline
                              className="w-full h-full object-contain bg-zinc-950"
                              style={{ minHeight: "100%", minWidth: "100%" }}
                            >
                              <source src={finalVideoUrl} type={isMov ? 'video/quicktime' : 'video/mp4'} />
                              <source src={finalVideoUrl} />
                              Your browser does not support HTML5 video streaming. Please open this task in chromium.
                            </video>
                          </div>
                        );
                      }
                    })()}

                    {!selectedTask.tutorialVideoUrl.includes('youtube.com') && !selectedTask.tutorialVideoUrl.includes('youtu.be') && (
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-dashed border-indigo-250 dark:border-zinc-800 space-y-2">
                        <p className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                          💡 <strong>Video Play Support:</strong> Agar preview black screen aa raha hai, to direct naye tab mein play karne ke liye neeche button click karein ya screen ke upar right side circular arrow <code>↻</code> click karke page refresh karein!
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <a 
                            href={selectedTask.tutorialVideoUrl.startsWith('http') ? selectedTask.tutorialVideoUrl : `${window.location.origin}${selectedTask.tutorialVideoUrl}`}
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Play Video In New Tab (Play Karein)
                          </a>
                          <a 
                            href={selectedTask.tutorialVideoUrl.startsWith('http') ? selectedTask.tutorialVideoUrl : `${window.location.origin}${selectedTask.tutorialVideoUrl}`}
                            download={`Walkthrough_${Date.now()}.mp4`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-zinc-850 hover:bg-zinc-800 text-zinc-100 dark:text-zinc-200 rounded-xl shadow-xs transition-colors cursor-pointer border border-zinc-750 dark:border-zinc-800"
                          >
                            <Download className="w-3.5 h-3.5" /> Download (Video Download)
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedTask.tutorialImageUrl && (
                  <div className="mt-2 space-y-1.5">
                    <p className="text-[10px] text-zinc-400 font-bold block">💡 Guidance Reference Image/Proof Screen:</p>
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 group">
                      <img 
                        src={getSafeImageUrl(selectedTask.tutorialImageUrl)} 
                        alt="Walkthrough guidelines screenshot" 
                        className="w-full max-h-56 object-cover cursor-zoom-in transition-all duration-300 hover:scale-[1.02]"
                        referrerPolicy="no-referrer"
                        onClick={() => setZoomedImageUrl(getSafeImageUrl(selectedTask.tutorialImageUrl))}
                      />
                      <div className="absolute bottom-2 right-2 bg-black/75 text-white text-[9px] font-bold px-2 py-1 rounded-lg backdrop-blur-xs">
                        Click to view full image
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Verification type view: TIMER based */}
            {isTimerRequired && (
              <div className="my-8 text-center space-y-4">
                <div className="inline-block relative">
                  <div className="w-20 h-20 rounded-full border-4 border-dashed border-indigo-500 pulse-glow flex items-center justify-center font-mono text-xl font-bold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700">
                    {timerCount}s
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400">Keep this mock workspace window active. Closing blocks points claims.</p>
                
                {selectedTask.url && (
                  <a 
                    href={getTaskUrl(selectedTask)} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-brand-650 underline font-bold"
                  >
                    <Globe className="w-3.5 h-3.5" /> Visit Target News Site
                  </a>
                )}
              </div>
            )}

            {/* Verification type view: SCREENSHOT rating task */}
            {(isScreenshotRequired || isTextProofRequired) && (
              <div className="my-6 space-y-4">
                {!screenshotTaskStarted ? (
                  <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-6 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-550">
                      <Play className="w-5 h-5 text-indigo-500 fill-indigo-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">Start Campaign Work</h4>
                      <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                        To claim points, click the button below to start tracking your session. You'll then be able to submit the required text or visual screenshots.
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const targetUrl = getTaskUrl(selectedTask);
                        if (targetUrl) {
                          window.open(targetUrl, '_blank');
                        }
                        setScreenshotTaskStarted(true);
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 transition-transform active:scale-95 duration-150 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white animate-pulse" /> Start Task Now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in">
                    {selectedTask.url && (
                      <div className="text-center">
                        <a 
                          href={getTaskUrl(selectedTask)} 
                          target="_blank" 
                          rel="noreferrer"
                          className="bg-brand-50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-300 text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-1.5 border border-brand-200 hover:opacity-90"
                        >
                          <Download className="w-4 h-4" /> Open PlayStore Campaign
                        </a>
                      </div>
                    )}

                    <form onSubmit={handleScreenshotSubmit} className="space-y-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl p-4 border border-slate-100 dark:border-zinc-800">
                      
                      {isTextProofRequired && (
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase flex items-center justify-between">
                            <span>📝 Written Evidence Proof</span>
                            <span className="text-[8px] bg-red-100 dark:bg-red-950/40 text-red-650 dark:text-red-400 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">Required</span>
                          </label>
                          <input 
                            type="text" 
                            placeholder={selectedTask.textProofPlaceholder || "Type the requested text proof details..."}
                            value={textProofInput}
                            onChange={(e) => setTextProofInput(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-zinc-100 focus:outline-none placeholder:text-zinc-400 font-semibold"
                          />
                        </div>
                      )}

                      {isScreenshotRequired && (
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase">
                            Upload Screenshot Proof
                          </label>
                          
                          {/* Visual File upload dropbox */}
                          <div 
                            className="border-2 border-dashed border-zinc-350 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl bg-white dark:bg-zinc-950 p-5 text-center cursor-pointer transition-colors relative"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const file = e.dataTransfer.files?.[0];
                              if (file && file.type.startsWith('image/')) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setScreenshotUpload(reader.result as string);
                                  setScreenshotUploadedName(file.name);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            onClick={() => {
                              if (!screenshotUpload) {
                                document.getElementById('screenshot_file_input')?.click();
                              }
                            }}
                          >
                            <input 
                              type="file" 
                              id="screenshot_file_input" 
                              accept="image/*" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setScreenshotUpload(reader.result as string);
                                    setScreenshotUploadedName(file.name);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden" 
                            />
                            
                            {!screenshotUpload ? (
                              <div className="space-y-2">
                                <div className="mx-auto w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-500">
                                  <Camera className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                                    Click or Drag & Drop screenshot
                                  </p>
                                  <p className="text-[10px] text-zinc-455 mt-0.5">
                                    PNG, JPG, or JPEG accepted
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setScreenshotUploadedName("mock_proof_system.png");
                                    setScreenshotUpload("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=505&q=80");
                                  }}
                                  className="text-[10px] text-indigo-500 font-bold hover:underline"
                                >
                                  Or use mock template screenshot
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> {screenshotUploadedName} Attached
                                </p>
                                <div className="relative mx-auto w-32 h-32 border rounded-lg overflow-hidden bg-slate-100 dark:bg-zinc-800">
                                  <img 
                                    src={screenshotUpload} 
                                    alt="Screenshot Preview" 
                                    className="w-full h-full object-contain" 
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setScreenshotUpload('');
                                    setScreenshotUploadedName('');
                                  }}
                                  className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold px-2 py-1 rounded-lg"
                                >
                                  Remove / Change File
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {aiVerifying && (
                        <div className="bg-indigo-50 dark:bg-indigo-950/25 border border-indigo-150 dark:border-indigo-900 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-indigo-750 dark:text-indigo-300 animate-pulse">
                          <RefreshCw className="w-4 h-4 animate-spin text-indigo-500 shrink-0" />
                          <div>
                            <span className="font-extrabold block uppercase tracking-wider text-[9px]">AI System Active Audit</span>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 block leading-tight">{aiFeedback}</span>
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={aiVerifying}
                        className={`w-full font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 ${
                          aiVerifying 
                            ? "bg-indigo-300 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 cursor-not-allowed" 
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/10 cursor-pointer"
                        }`}
                      >
                        {aiVerifying ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Gemini Vision Auditing...
                          </>
                        ) : (
                          "Submit Proof for Review"
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Verification type view: INTERACTIVE QUIZ TRIVIA */}
            {selectedTask.category === 'quiz' && (
              <div className="my-6 space-y-4">
                {!quizFinished ? (
                  <div className="space-y-3 bg-slate-50 dark:bg-zinc-855 border p-4 rounded-2xl">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>Question {activeQuizIndex + 1} of {selectedTask.quizQuestions?.length}</span>
                      <span className="font-bold text-indigo-600">Correct: {quizScore}</span>
                    </div>
                    
                    <h4 className="text-xs font-extrabold leading-normal mt-1">
                      {selectedTask.quizQuestions && selectedTask.quizQuestions[activeQuizIndex].question}
                    </h4>

                    <div className="space-y-2 mt-4">
                      {selectedTask.quizQuestions && selectedTask.quizQuestions[activeQuizIndex].options.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          onClick={() => registerQuizAnswer(oIdx)}
                          className="w-full px-4 py-2 border border-slate-200 hover:border-brand-500 rounded-xl text-left text-xs bg-white text-zinc-800 hover:bg-brand-50 transition-colors focus:ring-1 focus:ring-brand-500 focus:outline-none"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-center bg-indigo-50/50 dark:bg-indigo-950/10 p-5 border border-indigo-100 rounded-2xl">
                    <Award className="w-10 h-10 text-indigo-500 mx-auto" />
                    <h3 className="text-sm font-black font-display uppercase">Quiz Completed!</h3>
                    
                    <p className="text-xs text-zinc-500">
                      You scored : <strong className="text-indigo-600 font-display font-black">{quizScore}/{selectedTask.quizQuestions?.length}</strong>
                    </p>

                    {quizScore === selectedTask.quizQuestions?.length ? (
                      <p className="text-[11px] text-emerald-600 font-medium">✨ Prefect Score! Double coins credited directly to Main Wallet!</p>
                    ) : (
                      <p className="text-[11px] text-zinc-400 leading-normal">Requires 100% GK accuracy. Redo GK trivia to unlock payout cash.</p>
                    )}

                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => {
                          setActiveQuizIndex(0);
                          setQuizAnswersSelection([]);
                          setQuizFinished(false);
                          setQuizScore(0);
                        }}
                        className="border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={() => setSelectedTask(null)}
                        className="bg-zinc-950 text-white px-4 py-1.5 rounded-xl text-xs font-semibold"
                      >
                        Close Desk
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Verification type view: AUTO click-to-earn */}
            {isAutoPayout && (
              <div className="my-10 text-center space-y-4">
                <CircleCheck className="w-12 h-12 text-emerald-500 mx-auto pulse-glow" />
                <p className="text-xs text-zinc-500 leading-normal">
                  This instant task checks complete linkages. Press claim to trigger server rewards callbacks instantly.
                </p>
                {selectedTask.url && (
                  <a 
                    href={getTaskUrl(selectedTask)} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-xs text-indigo-650 dark:text-indigo-400 hover:text-indigo-700 underline"
                  >
                    Visit Community Link <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {/* Verification type view: 🔌 Custom Ad Network Webhook Postback Tracking */}
            {isPostbackRequired && (
              <div id="postback-track-wrapper" className="my-6 space-y-5">
                <div className="bg-gradient-to-br from-indigo-50/50 to-indigo-150/10 dark:from-zinc-900/40 dark:to-zinc-950 p-5 rounded-3xl border border-indigo-100 dark:border-zinc-800 space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 font-display">
                      🔌 WEBHOOK POSTBACK AUTOMATION
                    </span>
                    <span className="text-[7.5px] font-extrabold bg-indigo-100 text-indigo-750 dark:bg-zinc-800 dark:text-indigo-300 px-2.5 py-0.5 rounded-full uppercase tracking-widest leading-none font-sans flex items-center text-center">
                      POSTBACK REQUIRED
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-650 dark:text-zinc-350 leading-relaxed font-semibold">
                    To receive points, you must complete the steps on the sponsor network. Our system requires a secure callback signal from their server to credit <span className="text-zinc-900 dark:text-white font-extrabold">₹{selectedTask.rewardAmount.toFixed(2)}</span> to your wallet. Balance is credited automatically in real-time.
                  </p>

                  {/* Copy User ID section */}
                  <div className="p-3.5 bg-white dark:bg-zinc-900/65 rounded-2xl border border-zinc-200 dark:border-zinc-805 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-widest block">
                        📋 Your Click ID / SubID Parameter
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-450 leading-relaxed font-semibold">
                      Provide this Click ID if requested by the sponsor network to track your conversion:
                    </p>
                    <div className="bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-805 rounded-xl px-3 py-2 flex items-center justify-between">
                      <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-350 select-all font-bold">
                        {user?.uid || 'guest_user'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(user?.uid || 'guest_user');
                          alert("📋 User Click ID copied to clipboard!");
                        }}
                        className="text-[9.5px] bg-brand-50 hover:bg-brand-100 dark:bg-zinc-805 text-brand-650 dark:text-brand-300 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer"
                      >
                        Copy ID
                      </button>
                    </div>
                  </div>

                  {/* Configurable postback details (Admin visibility only to prevent endpoint/secret leaks to users) */}
                  {CampaignStore.isAdminAuthenticated && (() => {
                    const taskBaseUrl = (CampaignStore.settings.customPostbackDomain && CampaignStore.settings.customPostbackDomain.trim() !== '') 
                      ? CampaignStore.settings.customPostbackDomain.trim() 
                      : window.location.origin;
                    return (
                      <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest block flex items-center gap-1.5">
                            🔒 Webhook Callback URL (Admin View Only)
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-455 leading-relaxed font-semibold">
                          Whenever a user completes this task, your sponsor or Ad Network should trigger this URL. Our server will automatically authorize the callback, verify parameters, and instantly credit user balances in real-time.
                        </p>
                         <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-805 rounded-xl p-2.5 space-y-3.5">
                          <div>
                            <span className="text-[8.5px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Standard Callback URL</span>
                            <div className="text-[10px] select-all break-all font-mono text-zinc-650 dark:text-zinc-400 leading-normal p-1.5 bg-slate-50/50 dark:bg-zinc-900 rounded border border-zinc-150 dark:border-zinc-800">
                              {`${taskBaseUrl}/api/postback?user_id=${user?.uid || 'USER_ID'}&reward=${selectedTask.rewardAmount.toFixed(2)}&secret_key=postback_secure_key_2026&task_id=${selectedTask.id}`}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const urlStr = `${taskBaseUrl}/api/postback?user_id=${user?.uid || 'USER_ID'}&reward=${selectedTask.rewardAmount.toFixed(2)}&secret_key=postback_secure_key_2026&task_id=${selectedTask.id}`;
                                navigator.clipboard.writeText(urlStr);
                                alert("⚙️ Standard Callback URL copied to clipboard!");
                              }}
                              className="mt-1.5 text-[9.5px] font-bold text-zinc-650 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-150 px-3 py-1.5 rounded cursor-pointer transition"
                            >
                              Copy Standard URL
                            </button>
                          </div>

                          <div className="pt-1.5 border-t border-zinc-100 dark:border-zinc-800">
                            <span className="text-[8.5px] font-bold text-emerald-500 block mb-1">🟢 WhatsApp Safe Link (Fully Clickable in Chat)</span>
                            <div className="text-[10px] select-all break-all font-mono text-emerald-600 dark:text-emerald-400 leading-normal p-1.5 bg-emerald-50/20 dark:bg-zinc-900/40 rounded border border-emerald-150 dark:border-emerald-900/20">
                              {`${taskBaseUrl}/api/postback?user_id=${user?.uid || 'USER_ID'}&reward=${selectedTask.rewardAmount.toFixed(2)}&secret_key=postback_secure_key_2026&task_id=${selectedTask.id}`.replace(/\{/g, '%7B').replace(/\}/g, '%7D')}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const urlStr = `${taskBaseUrl}/api/postback?user_id=${user?.uid || 'USER_ID'}&reward=${selectedTask.rewardAmount.toFixed(2)}&secret_key=postback_secure_key_2026&task_id=${selectedTask.id}`.replace(/\{/g, '%7B').replace(/\}/g, '%7D');
                                navigator.clipboard.writeText(urlStr);
                                alert("🟢 WhatsApp Safe link copied to clipboard!");
                              }}
                              className="mt-1.5 text-[9.5px] font-bold text-emerald-700 dark:text-emerald-455 bg-emerald-100/50 dark:bg-emerald-900/20 hover:bg-emerald-100 px-3 py-1.5 rounded cursor-pointer transition border border-emerald-200/50 dark:border-emerald-950/30"
                            >
                              Copy WhatsApp Clickable Link
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Click/Open link section */}
                  <div className="space-y-3">
                    {sdkStage !== 'rewarded' ? (
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() => {
                            const targetUrl = getTaskUrl(selectedTask);
                            if (targetUrl) {
                              window.open(targetUrl, '_blank');
                            }
                            setSdkStage('link_opened');
                          }}
                          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-500/15 cursor-pointer transition-all duration-200"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Open Offer Link & Complete Task
                        </button>

                        <div className="p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-2 text-zinc-550 dark:text-zinc-400 text-[10px] font-semibold">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                            <span>Listening for server-to-server callback...</span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              CampaignStore.syncWithServer().then(() => {
                                const hasCompletedTx = CampaignStore.transactions.some(tx => 
                                  tx.userId === user?.uid && 
                                  tx.id.startsWith("tx_pb_") && 
                                  tx.id.includes(selectedTask.id)
                                );
                                if (hasCompletedTx) {
                                  setSdkStage('rewarded');
                                  setUser({ ...CampaignStore.currentUser! });
                                  alert("🎉 Awesome! Webhook postback successfully verified!");
                                } else {
                                  alert("⏳ Webhook callback not received on the server yet. Please complete the tasks on the sponsor page or trigger the test postback.");
                                }
                              });
                            }}
                            className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-350 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-xl transition-all"
                          >
                            🔄 Live Refresh
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 rounded-2xl flex items-center gap-3">
                        <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-[10.5px] font-black text-emerald-705 dark:text-emerald-450 uppercase tracking-wide">Callback Authorized & Approved!</p>
                          <p className="text-[9px] text-emerald-650 dark:text-emerald-400 font-bold">₹{selectedTask.rewardAmount.toFixed(2)} credited automatically to your Main Wallet!</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Bottom active action bars */}
          {selectedTask && selectedTask.category === 'campaign' ? (
            <a
              href={getTaskUrl(selectedTask)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition-colors font-display text-center block select-none"
            >
              Continue to Campaign &rarr;
            </a>
          ) : (
            selectedTask && isAutoPayout && (
              <button
                onClick={handleAutoTaskClaim}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors font-display"
              >
                Verify & Claim ₹{selectedTask.rewardAmount.toFixed(2)} rewards
              </button>
            )
          )}
        </div>
      )}

      {/* ZOOM LIGHTBOX OVERLAY */}
      {zoomedImageUrl && (
        <div 
          className="fixed inset-0 bg-black/90 z-[9999] flex flex-col items-center justify-center p-4 animate-fade-in cursor-zoom-out"
          onClick={() => setZoomedImageUrl(null)}
        >
          <div className="absolute top-4 right-4 text-white hover:text-zinc-300 bg-black/60 p-2.5 rounded-full cursor-pointer transition-colors">
            <X className="w-6 h-6" />
          </div>
          <img 
            src={zoomedImageUrl} 
            alt="Zoomed Reference Screenshot" 
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-zinc-800"
            onClick={(e) => e.stopPropagation()} // Prevent closing lightbox on clicking image
          />
          <p className="text-[11px] text-zinc-400 font-medium select-none mt-4 text-center bg-black/50 px-4 py-1.5 rounded-full border border-zinc-800">
            Aap is image ko full ratio me zoom view kar rahe hain block hone se bachne ke liye criteria follow karein
          </p>
        </div>
      )}

    </div>
  );
}
