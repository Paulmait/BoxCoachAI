import { APP_CONFIG } from './config';

export const PRIVACY_POLICY = `PRIVACY POLICY

Effective Date: ${APP_CONFIG.effectiveDate}

${APP_CONFIG.company} ("we," "our," or "us") operates the ${APP_CONFIG.name} mobile application ("App").

We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information.

1. Information We Collect

We may collect:
• Personal Information (such as email if you create an account)
• Device information (OS version, device type)
• Usage data (features used, session time)
• Optional camera or motion data if enabled for boxing analysis

We do not sell personal data.

2. How We Use Information

We use data to:
• Provide and improve training features
• Analyze performance
• Support AI feedback
• Maintain security
• Comply with legal obligations

3. AI-Powered Analysis Disclosure

${APP_CONFIG.name} uses Anthropic Claude AI to analyze your boxing technique. When you submit a video for analysis:
• Video frames are sent to Anthropic's AI service
• Frames are processed to provide technique feedback
• Anthropic does not store your video data for training purposes
• Analysis results are stored in your account

For more information about Anthropic's data practices, visit anthropic.com/privacy

4. Data Storage & Security

We use industry-standard security measures. No system is 100% secure, but we take reasonable steps to protect your data.

5. Sharing of Data

We may share data only with:
• Service providers (analytics, hosting, AI processing)
• Law enforcement when legally required
• Business transfers (if company ownership changes)

6. Children's Privacy

The App is not intended for children under 13. We do not knowingly collect data from children.

7. User Rights

You may:
• Request access to your data
• Request deletion
• Withdraw consent

Contact: ${APP_CONFIG.privacyEmail}

8. GDPR Rights (EU Users)

If you are located in the European Union, you have the right to:
• Access your personal data
• Correct your personal data
• Delete your personal data
• Restrict processing
• Withdraw consent
• Receive a copy of your data (portability)

We process your data based on:
• Your consent
• Performance of the app service
• Legal obligations

9. CCPA Rights (California Users)

If you are a California resident, you have the right to:
• Know what personal data we collect
• Request deletion of your personal data
• Opt out of data selling (we do NOT sell data)
• Non-discrimination for exercising rights

Categories of data collected:
• Email (if provided)
• Device info
• App usage data

We respond within 45 days as required by law.

10. Changes

We may update this policy. Continued use means acceptance of changes.

Contact: ${APP_CONFIG.privacyEmail}
${APP_CONFIG.company}
${APP_CONFIG.companyLocation}`;

export const TERMS_OF_SERVICE = `TERMS OF SERVICE

Effective Date: ${APP_CONFIG.effectiveDate}

These Terms govern your use of ${APP_CONFIG.name}.

1. Use of the App

You agree to use the App lawfully and not misuse its services.

2. No Medical Advice

${APP_CONFIG.name} provides fitness and training guidance only and is not medical advice. Consult a professional before physical activity.

WARNING: Boxing and combat sports training involves risk of injury. You should:
• Consult a physician before beginning any exercise program
• Stop immediately if you feel pain, dizziness, or discomfort
• Use proper protective equipment when training
• Train under qualified supervision when possible

3. Accounts

You are responsible for your account security.

4. Payments & Subscriptions

Payments are handled through Apple In-App Purchases. We do not control Apple billing policies.

Subscription Details:
• Free trial: ${7} days
• Subscriptions auto-renew unless cancelled
• Cancel at least 24 hours before the renewal date
• Manage subscriptions in your device Settings

5. Intellectual Property

All logos, AI models, and content belong to ${APP_CONFIG.company}.

6. Termination

We may suspend access for misuse or violation of terms.

7. Limitation of Liability

We are not liable for injuries, losses, or damages from app usage. Use of this app is at your own risk.

8. Governing Law

These Terms are governed by Florida law, USA.

Contact: ${APP_CONFIG.supportEmail}
${APP_CONFIG.company}
${APP_CONFIG.companyLocation}`;

export const EULA = `END USER LICENSE AGREEMENT (EULA)

Effective Date: ${APP_CONFIG.effectiveDate}

This EULA is between you and ${APP_CONFIG.company}.

1. License

We grant you a personal, non-transferable license to use ${APP_CONFIG.name}.

2. Restrictions

You may not:
• Reverse engineer
• Resell
• Modify
• Copy the App

3. Ownership

The App remains property of ${APP_CONFIG.company}.

4. Termination

This license ends if you violate terms.

5. Disclaimer

The App is provided "as is" without warranties.

6. Limitation of Liability

We are not responsible for injuries, misuse, or data loss.

7. Apple Terms

This EULA incorporates Apple's standard licensed application terms.

Contact: ${APP_CONFIG.supportEmail}
${APP_CONFIG.company}
${APP_CONFIG.companyLocation}`;

export const SHORT_EULA = `By using ${APP_CONFIG.name}, you agree to the following:

This app is licensed to you by ${APP_CONFIG.company}, not sold.

You may use the app on any Apple device you own or control, as permitted by Apple's App Store rules.

You may not:
• Copy, modify, or redistribute the app
• Reverse engineer the app
• Use the app for illegal purposes

The app is provided "as is" without warranties.

${APP_CONFIG.company} is not responsible for:
• Injuries or physical harm
• Loss of data
• Training results

Use of this app is for fitness and educational purposes only. It does not provide medical advice.

This EULA is governed by the laws of Florida, USA.`;

export const AI_DISCLOSURE = `${APP_CONFIG.name} uses Anthropic Claude AI to analyze your boxing technique.

How it works:
• Video frames from your recordings are sent to Anthropic's AI service for analysis
• The AI evaluates your stance, guard, punches, footwork, and defense
• You receive personalized feedback and drill recommendations

Your privacy:
• Video frames are encrypted during transmission
• Anthropic does not store or train on your video data
• Analysis results are stored only in your account
• You can delete your data at any time

By continuing, you consent to this AI-powered analysis.`;

export const DELETE_DATA_CONFIRMATION = {
  title: 'Delete My Data',
  message: `Are you sure you want to delete your data?

This will permanently remove your ${APP_CONFIG.name} account and stored training data.

This action cannot be undone.`,
  confirmButton: 'Delete',
  cancelButton: 'Cancel',
};
