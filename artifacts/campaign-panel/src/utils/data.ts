import { Task, AppSettings, AdConfig, OfferwallConfig, AppNotification } from '../types';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  appName: "EarnOS",
  currencySymbol: "₹",
  pointsRate: 100,
  minWithdrawal: 25,
  referralBonusFirstLevel: 10,
  referralBonusSecondLevel: 5,
  referralBonusThirdLevel: 2,
  maintenanceMode: false,
  themeColor: "#3b82f6",
  customPostbackDomain: ""
};

export const DEFAULT_AD_CONFIG: AdConfig = {
  id: "default_admob_config",
  bannerEnabled: true,
  interstitialEnabled: true,
  rewardedEnabled: true,
  rewardFrequency: 3,
  admobBannerId: "ca-app-pub-3940256099942544/6300978111",
  admobInterstitialId: "ca-app-pub-3940256099942544/1033173712",
  admobRewardedId: "ca-app-pub-3940256099942544/5224354917"
};

export const INITIAL_OFFERW_CONFIG: OfferwallConfig[] = [
  { id: "cpx", name: "CPX Research", multiplier: 1.2, isActive: true, apiKey: "cpx_pub_938201a084df", callbackUrl: "https://api.campaignpanel.com/v1/callback/cpx" },
  { id: "adgate", name: "AdGate Media", multiplier: 1.0, isActive: true, apiKey: "adg_key_cb9323ef", callbackUrl: "https://api.campaignpanel.com/v1/callback/adgate" },
  { id: "offertoro", name: "OfferToro", multiplier: 1.5, isActive: true, apiKey: "toro_api_fe8439ac", callbackUrl: "https://api.campaignpanel.com/v1/callback/toro" },
  { id: "lootably", name: "Lootably Studio", multiplier: 1.1, isActive: true, apiKey: "loot_pub_3482710", callbackUrl: "https://api.campaignpanel.com/v1/callback/lootably" },
  { id: "adgem", name: "AdGem Networks", multiplier: 1.3, isActive: false, apiKey: "adg_pub_ef908122", callbackUrl: "https://api.campaignpanel.com/v1/callback/adgem" },
  { id: "ayet", name: "Ayet Studios", multiplier: 1.4, isActive: false, apiKey: "ayet_pub_cd7382ef", callbackUrl: "https://api.campaignpanel.com/v1/callback/ayet" }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "not_1",
    title: "🚀 Welcome to EarnOS!",
    message: "Start completing tasks, invite friends, and easily withdraw money via UPI and Paytm. Set up your referral code in signup to get a Rs 10 bonus!",
    type: "announcement",
    createdAt: new Date().toISOString()
  },
  {
    id: "not_2",
    title: "⚡ Double Referral Bonanza",
    message: "Today only: Get an extra Rs 5 on Level 2 referrals when they perform their first task!",
    type: "update",
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "not_3",
    title: "⚠️ Fast Review Approvals",
    message: "Our review team is actively reviewing rating screenshots in under 15 minutes! Complete tasks now.",
    type: "alert",
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: "t_campaign_1",
    title: "Claim EarnOS Sponsor Reward",
    description: "Click to redirect to our official premium promo campaign. Engage on the sponsor page for 20 seconds to trigger instant ₹30.00 wallet payout.",
    rewardAmount: 30,
    category: "campaign",
    icon: "Sparkles",
    logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&q=80",
    url: "https://github.com/google",
    verificationMethod: "timer",
    timerSeconds: 20,
    dailyLimit: 2,
    completionsToday: 0,
    isActive: true
  },
  {
    id: "t_1",
    title: "Download CoinsSlayer Mobile",
    description: "Download this amazing and verify mobile details. Play the casual tutorial Arena match for 3 minutes to unlock Rs 45.00 cash securely.",
    rewardAmount: 45,
    category: "app_install",
    icon: "SquarePlay",
    url: "https://play.google.com/store",
    verificationMethod: "screenshot",
    dailyLimit: 1,
    completionsToday: 0,
    isActive: true
  },
  {
    id: "t_2",
    title: "Solve Daily Tech & Crypto News",
    description: "Read the tech innovation and crypto prediction news for 30 seconds. Do not trigger fast scrolls or close early to auto-claim cash.",
    rewardAmount: 12,
    category: "web_visit",
    icon: "Globe",
    url: "https://crypto-news-daily.org/predictions-2026",
    verificationMethod: "timer",
    timerSeconds: 30,
    dailyLimit: 3,
    completionsToday: 0,
    isActive: true
  },
  {
    id: "t_3",
    title: "Subscribe TechBytes official channel",
    description: "Subscribe to our partner's news channel, tap notifications bell, and take a screenshot showing subscribed state for prompt manual audit.",
    rewardAmount: 15,
    category: "youtube",
    icon: "Youtube",
    url: "https://youtube.com/channel/live_finance",
    verificationMethod: "screenshot",
    dailyLimit: 1,
    completionsToday: 0,
    isActive: true
  },
  {
    id: "t_4",
    title: "Join Telegram Loot & Promos Group",
    description: "Join the official community room to claim premium VIP code tickets, secret promo codes, giveaways, and withdrawal priority alerts.",
    rewardAmount: 20,
    category: "telegram",
    icon: "Send",
    url: "https://telegram.org/news_payouts",
    verificationMethod: "auto",
    dailyLimit: 1,
    completionsToday: 0,
    isActive: true
  },
  {
    id: "t_5",
    title: "Financial Knowledge Trivia Quiz",
    description: "Test your financial knowledge! Answer 4 simple visual quiz trivia questions correctly. Complete both gates to claim full credit rewards.",
    rewardAmount: 25,
    category: "quiz",
    icon: "HelpCircle",
    verificationMethod: "manual",
    dailyLimit: 5,
    completionsToday: 0,
    isActive: true,
    quizQuestions: [
      {
        question: "What is the primary name for a standard system that validates decentralized transactions on web3?",
        options: ["Database", "Blockchain", "CPU Driver", "Mainframe Server"],
        correctIndex: 1
      },
      {
        question: "Which Indian digital payment network uses UPI for fast mobile money transfers?",
        options: ["SWIFT", "FedWire", "NPCI", "SEPA Core"],
        correctIndex: 2
      },
      {
        question: "What is a major strategy to avoid investment risk in financial assets?",
        options: ["All-in single stock", "Diversification", "Relying on random chats", "Shorting active banks"],
        correctIndex: 1
      },
      {
        question: "Which of these is generally known as a stablecoin globally backed by greenbacks?",
        options: ["Ethereum", "USDT", "Ripple", "Solana"],
        correctIndex: 1
      }
    ]
  },
  {
    id: "t_6",
    title: "Rate EarnOS 5-Stars on PlayStore",
    description: "Submit a positive rating on PlayStore, leave feedback: 'Excellent tasks and instant UPI payout!', and upload screenshot proof.",
    rewardAmount: 50,
    category: "rating",
    icon: "Star",
    url: "https://play.google.com/store/apps/details?id=com.earnos.rewards",
    verificationMethod: "screenshot",
    dailyLimit: 1,
    completionsToday: 0,
    isActive: true
  },
  {
    id: "t_7",
    title: "Follow @CampaignPanel Instagram",
    description: "Official Instagram account follow. Help us reach 100K followers and earn fast, instant Rs 10 bonus credits.",
    rewardAmount: 10,
    category: "social",
    icon: "Instagram",
    url: "https://instagram.com/campaign_panel_earnings",
    verificationMethod: "auto",
    dailyLimit: 1,
    completionsToday: 0,
    isActive: true
  }
];

export const MOCK_LEADERBOARD = [
  { name: "Rahul Sharma", amount: 15430, rank: "Diamond", location: "Mumbai", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&q=80" },
  { name: "Amit Verma", amount: 12100, rank: "Diamond", location: "Delhi", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" },
  { name: "Sneha Patel", amount: 9840, rank: "Gold", location: "Ahmedabad", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80" },
  { name: "Vikram Rathore", amount: 8250, rank: "Gold", location: "Jaipur", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80" },
  { name: "Deepika Singh", amount: 7300, rank: "Silver", location: "Bengaluru", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80" },
  { name: "Anish Gupta", amount: 5900, rank: "Silver", location: "Kolkata", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&q=80" }
];
