# Boxing AI - Master Development Prompt

## Project Overview

Build a production-ready iOS mobile app called **"BoxCoach AI"** - an AI-powered boxing coach that analyzes user technique from uploaded videos/images, identifies the correct boxer in frame, provides personalized feedback, and offers drill recommendations to improve skills.

---

## Tech Stack (Required)

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React Native + Expo SDK 53 | Cross-platform mobile |
| **Language** | TypeScript (strict mode) | Type safety |
| **State** | Zustand + AsyncStorage | Global state + persistence |
| **Backend** | Supabase | Auth, Database, Storage, Edge Functions |
| **AI Analysis** | Anthropic Claude API | Vision analysis of boxing technique |
| **Payments** | RevenueCat | iOS subscriptions |
| **Biometrics** | expo-local-authentication | Face ID / Touch ID |
| **Build** | Expo EAS | Cloud builds + submissions |
| **CI/CD** | GitHub Actions | Automated testing + builds |

---

## Core Features

### 1. Boxer Identification & Selection (CRITICAL)
The app MUST accurately identify and track the correct boxer in multi-person frames:

```typescript
interface BoxerIdentification {
  // User can mark themselves in first frame
  userBoundingBox?: BoundingBox;

  // AI tracks the marked boxer throughout video
  trackingMethod: 'pose_estimation' | 'color_histogram' | 'body_position';

  // Confidence threshold for boxer tracking
  minConfidence: 0.85;

  // Handle scenarios:
  // - Single person (auto-select)
  // - Two boxers sparring (user selects which one they are)
  // - Coach/trainer in frame (exclude from analysis)
  // - Mirror reflections (detect and ignore)
}
```

**Implementation Approach:**
1. On first frame, use Claude Vision to detect all people
2. If multiple people detected, show frame with bounding boxes
3. User taps to select themselves
4. Track selected boxer using:
   - Clothing color consistency
   - Body position (left/right side)
   - Pose keypoints correlation
5. Re-confirm if tracking confidence drops below threshold

### 2. Technique Analysis Engine

Analyze these boxing fundamentals:

```typescript
type PunchType = 'jab' | 'cross' | 'hook' | 'uppercut' | 'body_shot';
type StanceType = 'orthodox' | 'southpaw';
type DefenseType = 'guard' | 'slip' | 'roll' | 'parry' | 'block';

interface TechniqueAnalysis {
  stance: {
    type: StanceType;
    balance: 'centered' | 'front_heavy' | 'back_heavy';
    footPosition: 'correct' | 'too_wide' | 'too_narrow' | 'squared';
    issues: string[];
  };

  punches: {
    type: PunchType;
    power: 'light' | 'medium' | 'heavy';
    speed: 'slow' | 'medium' | 'fast';
    technique: {
      hipRotation: boolean;
      shoulderTurn: boolean;
      handReturn: boolean;
      chinProtection: boolean;
    };
    issues: string[];
  }[];

  defense: {
    guardPosition: 'high' | 'low' | 'mixed';
    headMovement: boolean;
    issues: string[];
  };

  footwork: {
    movement: 'stationary' | 'forward' | 'backward' | 'lateral';
    balance: boolean;
    issues: string[];
  };

  overallScore: number; // 1-100
  rootCauses: RootCause[];
  drillRecommendations: string[];
}
```

### 3. Root Cause Categories

```typescript
const ROOT_CAUSES = {
  DROPPING_HANDS: {
    title: 'Dropping Hands After Punching',
    whyItMatters: 'Leaves face exposed to counter-punches',
    drills: ['mirror_guard', 'wall_drill', 'partner_check'],
  },
  TELEGRAPHING: {
    title: 'Telegraphing Punches',
    whyItMatters: 'Opponent can see and counter before punch lands',
    drills: ['snap_punch', 'relaxation_drill', 'shadow_boxing'],
  },
  POOR_FOOTWORK: {
    title: 'Crossing Feet / Poor Balance',
    whyItMatters: 'Reduces power and makes you vulnerable to being knocked off balance',
    drills: ['ladder_drill', 'pivot_practice', 'rope_skipping'],
  },
  NO_HIP_ROTATION: {
    title: 'Arm Punching (No Hip Rotation)',
    whyItMatters: 'Drastically reduces punch power - power comes from the ground up',
    drills: ['hip_rotation_drill', 'heavy_bag_power', 'pivot_punch'],
  },
  CHIN_UP: {
    title: 'Chin Exposed',
    whyItMatters: 'Primary knockout target - must keep chin tucked',
    drills: ['tennis_ball_chin', 'shadow_boxing_mirror', 'slip_drill'],
  },
  SQUARED_STANCE: {
    title: 'Squared Stance',
    whyItMatters: 'Exposes centerline and reduces reach advantage',
    drills: ['stance_check', 'angle_work', 'pivot_drill'],
  },
};
```

### 4. Drill Library (20+ Drills)

```typescript
interface BoxingDrill {
  id: string;
  name: string;
  category: 'fundamentals' | 'offense' | 'defense' | 'footwork' | 'conditioning';
  targetIssue: keyof typeof ROOT_CAUSES;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  durationMinutes: number;
  equipment: ('none' | 'heavy_bag' | 'speed_bag' | 'mirror' | 'rope' | 'partner')[];
  steps: string[];
  reps: string;
  videoUrl?: string;
  tips: string[];
  commonMistakes: string[];
}
```

### 5. Progress Tracking

```typescript
interface UserProgress {
  totalSessions: number;
  totalMinutesTrained: number;
  analysesCompleted: number;
  drillsCompleted: DrillCompletion[];
  streakDays: number;
  skillScores: {
    jab: number;
    cross: number;
    hook: number;
    uppercut: number;
    defense: number;
    footwork: number;
  };
  improvements: Improvement[];
  weakAreas: string[];
}
```

---

## Database Schema (Supabase)

```sql
-- Users profile extension
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  stance TEXT DEFAULT 'orthodox', -- orthodox or southpaw
  experience_level TEXT DEFAULT 'beginner',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Video analyses
CREATE TABLE public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_path TEXT,
  thumbnail_path TEXT,
  duration_seconds INTEGER,

  -- Boxer identification
  boxer_selection JSONB, -- {boundingBox, frameIndex, confidence}

  -- Analysis results
  stance_analysis JSONB,
  punch_analysis JSONB,
  defense_analysis JSONB,
  footwork_analysis JSONB,
  root_causes JSONB,
  overall_score INTEGER,

  -- Challenge tracking
  challenge_items JSONB,
  completed_items BOOLEAN[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Drill completions
CREATE TABLE public.drill_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  drill_id TEXT NOT NULL,
  drill_name TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  notes TEXT,
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- Analytics events
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drill_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (use (SELECT auth.uid()) for performance)
CREATE POLICY profiles_own ON public.profiles
  FOR ALL USING (id = (SELECT auth.uid()));

CREATE POLICY analyses_own ON public.analyses
  FOR ALL USING (user_id = (SELECT auth.uid()));

CREATE POLICY drills_own ON public.drill_completions
  FOR ALL USING (user_id = (SELECT auth.uid()));
```

---

## AI Analysis Prompt (Claude Vision)

```typescript
const BOXING_ANALYSIS_PROMPT = `You are an expert boxing coach analyzing a video/image of a boxer.

FIRST: Identify all people in the frame.
- If multiple people, describe their positions (left/right, foreground/background)
- Note clothing colors for tracking
- Identify which person appears to be the primary boxer being filmed

THEN: Analyze the identified boxer's technique:

1. STANCE ANALYSIS
- Orthodox or Southpaw?
- Foot positioning (shoulder width, lead foot angle)
- Weight distribution
- Guard position (hands up protecting chin?)
- Chin tucked or exposed?

2. PUNCH TECHNIQUE (if throwing punches)
- Punch type (jab, cross, hook, uppercut)
- Hip rotation present?
- Shoulder turn on crosses/hooks?
- Hand returning to guard after punch?
- Elbow position
- Wrist alignment

3. DEFENSE
- Guard height and tightness
- Head movement (slipping, rolling)
- Shoulder protection

4. FOOTWORK
- Balance during movement
- Feet crossing? (bad)
- Staying on balls of feet?
- Pivot on power punches?

5. ROOT CAUSE IDENTIFICATION
Identify the PRIMARY issue affecting their boxing:
- Dropping hands after punching
- Telegraphing punches
- Poor footwork / crossed feet
- No hip rotation (arm punching)
- Chin exposed
- Squared stance

Provide response as JSON:
{
  "boxersDetected": [
    {"position": "left", "clothing": "red gloves, black shorts", "isPrimary": true}
  ],
  "stance": {...},
  "punches": [...],
  "defense": {...},
  "footwork": {...},
  "rootCause": {
    "title": "...",
    "confidence": "high|medium|low",
    "evidence": ["..."],
    "whyItMatters": "..."
  },
  "recommendedDrills": ["drill_id_1", "drill_id_2"],
  "overallScore": 72,
  "positiveFeedback": "...",
  "priorityFix": "..."
}`;
```

---

## Project Structure

```
boxcoach-ai/
├── apps/
│   ├── mobile/                    # Expo React Native app
│   │   ├── App.tsx               # Navigation setup
│   │   ├── app.json              # Expo config
│   │   ├── eas.json              # EAS Build config
│   │   ├── index.js              # Entry point
│   │   └── src/
│   │       ├── components/       # Reusable UI components
│   │       │   ├── Button.tsx
│   │       │   ├── GlassCard.tsx
│   │       │   ├── BoxerSelector.tsx    # SELECT BOXER UI
│   │       │   ├── PunchBadge.tsx
│   │       │   └── ProgressRing.tsx
│   │       ├── screens/
│   │       │   ├── AuthScreen.tsx
│   │       │   ├── HomeScreen.tsx
│   │       │   ├── RecordScreen.tsx
│   │       │   ├── BoxerSelectionScreen.tsx  # CRITICAL
│   │       │   ├── AnalyzingScreen.tsx
│   │       │   ├── ResultsScreen.tsx
│   │       │   ├── DrillLibraryScreen.tsx
│   │       │   ├── DrillDetailScreen.tsx
│   │       │   ├── ProgressScreen.tsx
│   │       │   ├── SettingsScreen.tsx
│   │       │   └── PaywallScreen.tsx
│   │       ├── services/
│   │       │   ├── supabase.ts           # Supabase client
│   │       │   ├── analysis.ts           # AI analysis logic
│   │       │   ├── boxerTracking.ts      # BOXER IDENTIFICATION
│   │       │   ├── subscriptions.ts      # RevenueCat
│   │       │   └── biometrics.ts         # Face ID
│   │       ├── store/
│   │       │   └── useAppStore.ts        # Zustand store
│   │       ├── data/
│   │       │   └── drillLibrary.ts       # 20+ boxing drills
│   │       ├── hooks/
│   │       │   ├── useAnalysis.ts
│   │       │   └── useProgressTracking.ts
│   │       ├── constants/
│   │       │   └── theme.ts              # Dark theme colors
│   │       └── config/
│   │           └── security.ts           # Demo account config
│   │
│   └── api/
│       └── supabase/
│           ├── migrations/               # SQL migrations
│           └── functions/
│               └── analyze-boxing/       # Edge function
│
├── .github/
│   └── workflows/
│       ├── ci.yml                # TypeScript + ESLint
│       ├── eas-build.yml         # Auto builds
│       └── eas-submit.yml        # App Store submission
│
├── package.json                  # Monorepo root
└── docs/
    ├── APP_STORE_SUBMISSION.md
    └── REVENUECAT_SETUP.md
```

---

## Boxer Selection Flow (CRITICAL FEATURE)

```typescript
// src/services/boxerTracking.ts

interface DetectedPerson {
  id: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  clothing: string;
  position: 'left' | 'right' | 'center';
}

interface BoxerSelection {
  personId: string;
  frameIndex: number;
  boundingBox: BoundingBox;
  trackingColor: string; // Dominant clothing color for tracking
}

// Step 1: Detect people in first frame
async function detectPeopleInFrame(
  imageBase64: string
): Promise<DetectedPerson[]> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 }
        },
        {
          type: 'text',
          text: `Detect all people in this boxing/training image.

For each person, provide:
1. Bounding box (x, y, width, height as percentages 0-100)
2. Position (left, right, center)
3. Clothing description (for tracking)
4. Whether they appear to be the main subject

Return JSON: { "people": [...] }`
        }
      ]
    }]
  });

  return parsePeopleResponse(response);
}

// Step 2: User selects themselves
// BoxerSelectionScreen.tsx shows frame with tappable bounding boxes

// Step 3: Track selected boxer through video
async function trackBoxerInFrame(
  frameBase64: string,
  selection: BoxerSelection
): Promise<{found: boolean; newBoundingBox?: BoundingBox; confidence: number}> {
  // Use clothing color + position to track
  // Re-prompt user if confidence < 0.85
}
```

**BoxerSelectionScreen.tsx UI:**
```typescript
export function BoxerSelectionScreen({ route, navigation }) {
  const { videoUri, firstFrame } = route.params;
  const [detectedPeople, setDetectedPeople] = useState<DetectedPerson[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Which boxer are you?</Text>
      <Text style={styles.subtitle}>Tap yourself in the frame</Text>

      <View style={styles.frameContainer}>
        <Image source={{ uri: firstFrame }} style={styles.frame} />

        {detectedPeople.map((person) => (
          <TouchableOpacity
            key={person.id}
            style={[
              styles.boundingBox,
              {
                left: `${person.boundingBox.x}%`,
                top: `${person.boundingBox.y}%`,
                width: `${person.boundingBox.width}%`,
                height: `${person.boundingBox.height}%`,
              },
              selectedPerson === person.id && styles.selectedBox,
            ]}
            onPress={() => setSelectedPerson(person.id)}
          >
            <Text style={styles.personLabel}>{person.position}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title="Analyze My Technique"
        onPress={() => handleConfirmSelection()}
        disabled={!selectedPerson}
      />
    </View>
  );
}
```

---

## EAS Configuration

### eas.json
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "env": {
        "APP_VARIANT": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      },
      "env": {
        "APP_VARIANT": "preview",
        "EXPO_PUBLIC_SUPABASE_URL": "https://your-project.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-anon-key"
      }
    },
    "production": {
      "distribution": "store",
      "ios": {
        "resourceClass": "m-medium"
      },
      "env": {
        "APP_VARIANT": "production",
        "EXPO_PUBLIC_SUPABASE_URL": "https://your-project.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-anon-key",
        "EXPO_PUBLIC_REVENUECAT_IOS_KEY": "your-revenuecat-key"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

### app.json
```json
{
  "expo": {
    "name": "BoxCoach AI",
    "slug": "boxcoach-ai",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "boxcoach",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0A0A0F"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.yourcompany.boxcoachai",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "BoxCoach AI needs camera access to record your boxing technique for analysis.",
        "NSPhotoLibraryUsageDescription": "BoxCoach AI needs photo library access to analyze your saved boxing videos.",
        "NSMicrophoneUsageDescription": "BoxCoach AI needs microphone access when recording videos.",
        "NSFaceIDUsageDescription": "Use Face ID for quick sign-in to BoxCoach AI."
      },
      "config": {
        "usesNonExemptEncryption": false
      }
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-camera",
        {
          "cameraPermission": "Allow BoxCoach AI to access your camera to record boxing videos."
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow BoxCoach AI to access your photos to analyze boxing videos."
        }
      ],
      [
        "expo-local-authentication",
        {
          "faceIDPermission": "Allow BoxCoach AI to use Face ID for quick sign-in."
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"
      }
    },
    "owner": "your-expo-username"
  }
}
```

---

## Environment Variables & Secrets

### Required Secrets (GitHub Actions)
```
EXPO_TOKEN=expo_xxxx           # From expo.dev/settings/access-tokens
```

### Required Secrets (Supabase Edge Functions)
```
ANTHROPIC_API_KEY=sk-ant-xxxx  # For Claude API
```

### Required Keys (App)
```
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxx
```

---

## Security Requirements

1. **API Key Protection**
   - NEVER expose Anthropic API key in client code
   - All AI calls go through Supabase Edge Functions
   - Edge functions validate auth before processing

2. **Row Level Security (RLS)**
   - All tables have RLS enabled
   - Users can only access their own data
   - Use `(SELECT auth.uid())` for performance

3. **Video Storage**
   - Videos stored in Supabase Storage with user-scoped paths
   - Auto-delete after 7 days to save storage costs
   - Max file size: 100MB

4. **Rate Limiting**
   - Free users: 3 analyses per day
   - Premium users: Unlimited
   - Implement in Edge Function

5. **Input Validation**
   - Validate video format (mp4, mov)
   - Validate video duration (max 60 seconds for analysis)
   - Sanitize all user inputs

---

## Subscription Tiers (RevenueCat)

```typescript
const SUBSCRIPTION_CONFIG = {
  FREE: {
    analysesPerDay: 3,
    drillAccess: 'basic', // 8 beginner drills
    historyDays: 7,
    features: ['basic_analysis', 'drill_library_basic'],
  },
  PREMIUM_MONTHLY: {
    productId: 'boxcoach.monthly',
    price: '$9.99/month',
    analysesPerDay: 'unlimited',
    drillAccess: 'all', // All 20+ drills
    historyDays: 'unlimited',
    features: [
      'unlimited_analysis',
      'drill_library_full',
      'progress_tracking',
      'detailed_breakdown',
      'export_reports',
    ],
  },
  PREMIUM_ANNUAL: {
    productId: 'boxcoach.annual',
    price: '$59.99/year', // Save 50%
    // Same as monthly
  },
};
```

---

## App Store Submission Checklist

### Required Screenshots (6.7" and 6.5")
1. Home screen with analysis history
2. Video recording/upload screen
3. Boxer selection screen (UNIQUE FEATURE)
4. Analysis results with technique breakdown
5. Drill library
6. Progress tracking

### App Store Description
```
BoxCoach AI - Your Personal Boxing Coach

Improve your boxing technique with AI-powered analysis. Upload a video of yourself training, and BoxCoach AI will:

- Identify your stance and form
- Analyze punch technique (jab, cross, hook, uppercut)
- Evaluate defense and guard position
- Check footwork and balance
- Identify your #1 area for improvement
- Recommend personalized drills

SMART BOXER DETECTION
Training with a partner? BoxCoach AI detects multiple people and lets you select yourself for accurate analysis.

20+ BOXING DRILLS
From beginner fundamentals to advanced combinations, with step-by-step instructions.

TRACK YOUR PROGRESS
See your improvement over time with detailed statistics and skill scores.

Premium unlocks unlimited analyses, full drill library, and detailed progress tracking.

Train smarter. Fight better.
```

### Review Notes for Apple
```
Demo Account:
Email: appstore-review@yourcompany.com
Password: [secure password]

This account has premium access for testing all features.

To test the app:
1. Sign in with demo credentials
2. Tap "Upload Video" and select a boxing video from photos
3. If multiple people detected, tap yourself to select
4. View analysis results and recommended drills
5. Browse drill library and mark drills as practiced
6. View progress in Progress tab
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Start Expo dev server
cd apps/mobile && npm start

# Run TypeScript check
npm run typecheck --workspace=boxcoach-mobile

# Run linter
npm run lint --workspace=boxcoach-mobile

# Build preview (internal testing)
cd apps/mobile && eas build --platform ios --profile preview

# Build production
cd apps/mobile && eas build --platform ios --profile production

# Submit to App Store
cd apps/mobile && eas submit --platform ios --latest
```

---

## Critical Implementation Notes

1. **Boxer Selection is MANDATORY** when multiple people detected - never auto-select

2. **Video Processing Flow:**
   - Extract first frame for boxer selection
   - Extract 3-5 key frames for analysis (not entire video)
   - Compress frames before sending to API
   - Total API payload should be < 5MB

3. **Offline Support:**
   - Cache drill library locally
   - Queue analyses when offline, process when online
   - Store progress data in AsyncStorage + sync to Supabase

4. **Performance:**
   - Lazy load drill videos
   - Use React.memo for list items
   - Paginate analysis history (20 per page)
   - Image compression before upload (80% quality)

5. **Error Handling:**
   - Graceful degradation if AI fails
   - Retry logic with exponential backoff
   - User-friendly error messages
   - Crash reporting (Sentry recommended)

---

## UI/UX Guidelines

- **Theme:** Dark mode only (boxing gym aesthetic)
- **Primary Color:** #EF4444 (red - boxing gloves)
- **Accent Color:** #F59E0B (gold - championship)
- **Font:** System default (San Francisco on iOS)
- **Animations:** Subtle, performant (60fps)
- **Haptics:** On button presses and achievements

---

## Launch Checklist

- [ ] Supabase project created with all tables
- [ ] RLS policies tested
- [ ] Edge function deployed with Anthropic key
- [ ] RevenueCat configured with products
- [ ] EAS project linked
- [ ] Apple Developer account ready
- [ ] App Store Connect app created
- [ ] Screenshots generated
- [ ] Privacy policy URL live
- [ ] Terms of service URL live
- [ ] Demo account created
- [ ] CI/CD workflows tested
- [ ] Production build successful
- [ ] TestFlight testing complete

---

*This prompt provides complete specifications for Claude to build a production-ready boxing coaching app. Follow the architecture exactly for best results.*
