// App Configuration
export const APP_CONFIG = {
  name: 'Boxing Coach AI',
  company: 'Cien Rios LLC',
  companyLocation: 'Miramar, Florida, USA',
  supportEmail: 'support@cienrios.com',
  privacyEmail: 'privacy@cienrios.com',
  effectiveDate: 'January 26, 2026',
  urls: {
    privacy: 'https://boxingcoach.ai/privacy',
    terms: 'https://boxingcoach.ai/terms',
    eula: 'https://boxingcoach.ai/eula',
    support: 'mailto:support@cienrios.com',
  },
} as const;

// Subscription Configuration
export const SUBSCRIPTION_CONFIG = {
  products: {
    basicMonthly: {
      identifier: 'boxcoach.basic.monthly',
      title: 'Basic Monthly',
      price: 14.99,
      priceString: '$14.99',
      period: 'month',
    },
    basicAnnual: {
      identifier: 'boxcoach.basic.annual',
      title: 'Basic Annual',
      price: 99.0,
      priceString: '$99',
      period: 'year',
      savings: '30%',
    },
    proMonthly: {
      identifier: 'boxcoach.pro.monthly',
      title: 'Pro Monthly',
      price: 19.99,
      priceString: '$19.99',
      period: 'month',
    },
    proAnnual: {
      identifier: 'boxcoach.pro.annual',
      title: 'Pro Annual',
      price: 129.0,
      priceString: '$129',
      period: 'year',
      savings: '35%',
    },
  },
  trialDays: 7,
  entitlement: 'premium',
} as const;

// Free tier limits
export const FREE_TIER = {
  dailyAnalyses: 3,
  maxVideoLength: 30, // seconds
} as const;
