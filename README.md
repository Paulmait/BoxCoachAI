# BoxCoach AI

AI-powered boxing technique analysis app built with React Native + Expo, Supabase, and Claude Vision API.

## Current Status (January 2026)

### Completed Features
- **AI Video Analysis**: Upload or record videos for instant AI-powered feedback
- **Boxer Identification**: Automatically detects people in frame and lets you select yourself
- **Technique Scoring**: Detailed breakdown of stance, guard, footwork, punches, and defense
- **Root Cause Analysis**: Identifies fundamental issues affecting your technique
- **Drill Library**: 20+ drills tailored to your improvement areas
- **Progress Tracking**: Track your scores over time and see improvement trends
- **Premium Subscriptions**: RevenueCat integration for iOS subscriptions
- **Admin Dashboard**: Full user management system (see below)
- **User Suspension System**: Pause, suspend, and ban users with proper messaging
- **Analytics & Investor Reporting**: Comprehensive metrics for acquisition readiness
- **Gamification**: Achievements, streaks, training plans, combo randomizer
- **Weight Tracking**: Log and track weight for boxing weight classes
- **Training Journal**: Record training notes and reflections
- **Round Timer**: Customizable boxing round timer with audio cues

### Admin Dashboard (`apps/admin/`)
Web-based admin panel at `localhost:3003` for user management:

**Features:**
- **Dashboard**: Stats overview (users, analyses, drills, violations)
- **User Management**: Search, filter by role, view all users
  - Pause accounts (1-72 hours temporary suspension)
  - Suspend accounts (permanent until restored)
  - Delete accounts (with full data deletion)
  - Reset passwords
  - Role-based protection (admins can't modify other admins)
- **Violations**: Review and act on reported violations
- **Investor Reports**: Export analytics, view metrics, download CSVs
- **Settings**: Password management (6-month rotation), login history, audit logs

**Security Features:**
- Password rotation every 6 months
- All admin actions logged to audit trail
- Role-based access control (user, admin, super_admin)
- Failed login attempt tracking

### Mobile App Suspension Handling
When users are paused/suspended:
- See dedicated SuspendedScreen with reason and duration
- Cannot access any app features
- Can only sign out or contact support
- For pauses: see countdown until access restored
- Auto-unsuspend when pause period expires

### Database Schema Highlights
- `profiles`: User data with suspension fields (is_suspended, suspension_reason, suspended_at)
- `analyses`: Video analysis results and scores
- `drill_completions`: Completed drills tracking
- `admin_audit_log`: All admin actions logged
- `admin_login_log`: Admin login attempts
- `user_violations`: Reported violations queue
- `app_metrics`: Daily analytics for investor reports
- `revenue_events`: RevenueCat webhook data

## Tech Stack

- **Mobile**: React Native + Expo SDK 53
- **Admin**: React + Vite
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
│   ├── mobile/               # Expo React Native app
│   │   ├── src/
│   │   │   ├── components/   # Reusable UI components
│   │   │   ├── screens/      # Screen components
│   │   │   │   └── auth/     # Auth screens including SuspendedScreen
│   │   │   ├── navigation/   # Navigation configuration
│   │   │   ├── services/     # API and service layers
│   │   │   ├── store/        # Zustand state management
│   │   │   ├── types/        # TypeScript definitions
│   │   │   ├── constants/    # Theme, config
│   │   │   └── data/         # Static data (drills)
│   │   └── assets/           # Images, fonts
│   │
│   └── admin/                # React + Vite admin dashboard
│       └── src/
│           ├── pages/        # Dashboard, Users, Violations, Settings
│           ├── services/     # Supabase client
│           └── hooks/        # Auth hook
│
├── supabase/
│   ├── migrations/           # Database schema (8 migrations)
│   │   ├── 20260127000004_admin_system.sql
│   │   ├── 20260127000005_analytics_cron.sql
│   │   ├── 20260127000006_acquisition_analytics.sql
│   │   ├── 20260127000007_admin_security.sql
│   │   └── 20260127000008_suspended_user_rls.sql
│   └── functions/            # Edge functions
│       ├── analyze-boxing/   # AI analysis
│       ├── detect-boxers/    # Person detection
│       ├── delete-user-data/ # GDPR deletion
│       └── revenue-webhook/  # RevenueCat webhook
│
├── scripts/
│   ├── test-full-system.js   # Comprehensive system tests
│   └── test-suspension.js    # Suspension functionality tests
│
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
git clone https://github.com/Paulmait/BoxCoachAI.git
cd boxcoach-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp apps/mobile/.env.example apps/mobile/.env
# Edit .env with your Supabase credentials
```

4. Start the development server:
```bash
npm run mobile
```

### Running Admin Dashboard

```bash
cd apps/admin
npm run dev
# Opens at http://localhost:3003
```

### Supabase Setup

1. Create a new Supabase project at https://supabase.com

2. Push database migrations:
```bash
npx supabase db push --linked
```

3. Deploy edge functions:
```bash
supabase functions deploy analyze-boxing
supabase functions deploy detect-boxers
supabase functions deploy delete-user-data
supabase functions deploy revenue-webhook
```

4. Set up environment secrets:
```bash
supabase secrets set ANTHROPIC_API_KEY=your-api-key
```

## Admin Accounts

- **Super Admin**: guampaul@gmail.com (can modify all users including admins)
- **Admin**: Regular admins can manage users but not other admins

## Testing

### Full System Test
```bash
# Set SUPABASE_SERVICE_KEY environment variable first
node scripts/test-full-system.js
```

### Suspension Test
```bash
# Set SUPABASE_SERVICE_KEY environment variable first
node scripts/test-suspension.js
```

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

## Security

- Row Level Security (RLS) on all database tables
- Suspended users blocked from data access via RLS policies
- User-scoped storage paths
- JWT authentication on edge functions
- Rate limiting for free users (3 analyses/day)
- Admin password rotation (6 months)
- Full audit logging of admin actions

## Recent Updates

1. **Admin Security** (Jan 2026)
   - Password rotation enforcement
   - Login attempt tracking
   - Audit logging for all admin actions

2. **User Suspension System** (Jan 2026)
   - Pause (temporary, 1-72 hours)
   - Suspend (permanent until restored)
   - Ban (delete user and all data)
   - SuspendedScreen shows reason and duration
   - RLS policies block data access for suspended users

3. **Analytics & Investor Reporting** (Jan 2026)
   - Daily metrics calculation via pg_cron
   - Cohort analysis
   - Revenue tracking via RevenueCat webhook
   - Export to CSV for investor reports

## License

Proprietary - All rights reserved.
