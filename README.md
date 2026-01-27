# BoxCoach AI

AI-powered boxing technique analysis app built with React Native + Expo, Supabase, and Claude Vision API.

## Features

- **AI Video Analysis**: Upload or record videos of your boxing technique for instant AI-powered feedback
- **Boxer Identification**: Automatically detects people in frame and lets you select yourself for accurate analysis
- **Technique Scoring**: Detailed breakdown of stance, guard, footwork, punches, and defense
- **Root Cause Analysis**: Identifies fundamental issues affecting your technique
- **Drill Library**: 20+ drills tailored to your improvement areas
- **Progress Tracking**: Track your scores over time and see improvement trends
- **Premium Subscriptions**: Unlimited analyses for premium members

## Tech Stack

- **Mobile**: React Native + Expo SDK 53
- **Navigation**: React Navigation 7
- **State Management**: Zustand 5 with AsyncStorage persistence
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **AI**: Claude Vision API (claude-sonnet-4-20250514)
- **Subscriptions**: RevenueCat
- **CI/CD**: GitHub Actions + EAS Build

## Project Structure

```
boxcoach-ai/
├── apps/
│   └── mobile/               # Expo React Native app
│       ├── src/
│       │   ├── components/   # Reusable UI components
│       │   ├── screens/      # Screen components
│       │   ├── navigation/   # Navigation configuration
│       │   ├── services/     # API and service layers
│       │   ├── store/        # Zustand state management
│       │   ├── types/        # TypeScript definitions
│       │   ├── constants/    # Theme, config
│       │   └── data/         # Static data (drills)
│       └── assets/           # Images, fonts
├── supabase/
│   ├── migrations/           # Database schema
│   ├── functions/            # Edge functions
│   └── storage/              # Storage bucket policies
└── .github/workflows/        # CI/CD pipelines
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Expo CLI
- Supabase CLI
- EAS CLI

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/boxcoach-ai.git
cd boxcoach-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp apps/mobile/.env.example apps/mobile/.env
# Edit .env with your Supabase and RevenueCat credentials
```

4. Start the development server:
```bash
npm run mobile
```

### Supabase Setup

1. Create a new Supabase project at https://supabase.com

2. Run the database migration:
```bash
cd supabase
supabase db push
```

3. Deploy edge functions:
```bash
supabase functions deploy analyze-boxing
supabase functions deploy detect-boxers
```

4. Set up environment secrets:
```bash
supabase secrets set ANTHROPIC_API_KEY=your-api-key
```

5. Create the videos storage bucket and run the storage policies SQL.

### RevenueCat Setup

1. Create a RevenueCat account at https://www.revenuecat.com

2. Configure your products:
   - `boxcoach.monthly` - $9.99/month
   - `boxcoach.annual` - $59.99/year

3. Create an entitlement: `premium`

4. Add API keys to your environment variables

## Building for Production

### iOS

```bash
cd apps/mobile
eas build --platform ios --profile production
```

### Android

```bash
cd apps/mobile
eas build --platform android --profile production
```

## App Store Submission

### Apple Requirements

This app complies with Apple's guidelines including:

- **Guideline 5.1.2(i)**: AI consent dialog shown before first analysis
- Privacy policy with AI vendor disclosure
- Medical disclaimer for physical activity guidance
- Demo account for App Store review

### Required Assets

- App icon: 1024x1024 PNG
- Screenshots: 6.7" and 6.5" sizes
- App Preview video (optional)

## Architecture

### State Management

The app uses Zustand for state management with AsyncStorage persistence:

- User authentication state
- Premium subscription status
- Daily analysis limits
- Analysis history (local cache)
- Pending offline analyses
- User preferences

### Video Processing Pipeline

1. Record or select video
2. Extract first frame for boxer detection
3. User selects themselves if multiple people detected
4. Extract 3-5 key frames for analysis
5. Compress and convert to base64
6. Submit to Claude API via Supabase Edge Function
7. Store results in database

### Security

- Row Level Security (RLS) on all database tables
- User-scoped storage paths
- JWT authentication on edge functions
- Rate limiting for free users

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

Proprietary - All rights reserved.
