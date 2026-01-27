# Boxing Coach AI - Production Readiness Checklist

## ✅ Completed

### Backend (Supabase)
- [x] Database schema deployed (6 tables with RLS)
- [x] Authentication enabled
- [x] Admin user created: `guampaul@gmail.com`
- [x] Edge functions deployed: `analyze-boxing`, `detect-boxers`
- [x] Claude API key configured as secret
- [x] Rate limiting implemented (3 free/day)
- [x] Row Level Security policies active

### Mobile App
- [x] React Native + Expo SDK 52 configured
- [x] Navigation structure (Auth + Main tabs)
- [x] All screens implemented (12 screens)
- [x] State management (Zustand + AsyncStorage)
- [x] Supabase client configured
- [x] TypeScript strict mode passing
- [x] Legal documents (Privacy, Terms, EULA)
- [x] AI consent dialog (Apple 5.1.2(i) compliance)

### CI/CD
- [x] GitHub repository: https://github.com/Paulmait/BoxCoachAI
- [x] GitHub Actions workflows (CI, EAS Build, EAS Submit)
- [x] Environment secrets NOT in repo

---

## ⚠️ Requires Manual Setup

### 1. Storage Bucket (Supabase Dashboard)
Go to: https://supabase.com/dashboard/project/bvyzvqzpmlqvnkujjaao/storage/buckets

1. Click "New bucket"
2. Name: `videos`
3. Public: OFF
4. File size limit: 100 MB
5. Allowed MIME types: `video/mp4, video/quicktime, image/jpeg, image/png`
6. Add RLS policies:
   - SELECT: `(storage.foldername(name))[1] = auth.uid()::text`
   - INSERT: `(storage.foldername(name))[1] = auth.uid()::text`
   - DELETE: `(storage.foldername(name))[1] = auth.uid()::text`

### 2. RevenueCat Configuration
1. Create RevenueCat account: https://app.revenuecat.com
2. Create iOS app
3. Add products:
   - `boxcoach.basic.monthly` - $14.99/month
   - `boxcoach.basic.annual` - $99/year
   - `boxcoach.pro.monthly` - $19.99/month
   - `boxcoach.pro.annual` - $129/year
4. Create entitlement: `premium`
5. Get API key and add to `.env`:
   ```
   EXPO_PUBLIC_REVENUECAT_API_KEY=your-key
   ```

### 3. App Store Connect
1. Create app in App Store Connect
2. Configure In-App Purchases (match RevenueCat products)
3. Set up TestFlight
4. Upload app icons and screenshots

### 4. EAS Configuration
1. Create Expo account: https://expo.dev
2. Run: `npx eas-cli login`
3. Run: `cd apps/mobile && npx eas build:configure`
4. Update `app.json` with your EAS project ID
5. Add Apple credentials to EAS

### 5. Legal URLs (Must be live before submission)
- Privacy Policy: https://boxingcoach.ai/privacy
- Terms of Service: https://boxingcoach.ai/terms
- EULA: https://boxingcoach.ai/eula

### 6. Branding Assets
Replace placeholder assets in `apps/mobile/assets/`:
- `icon.png` - 1024x1024 (no transparency)
- `splash.png` - 2732x2732
- `adaptive-icon.png` - 1024x1024

---

## 📱 Admin Account for App Store Screenshots

```
Email: guampaul@gmail.com
Password: BoxC0ach!AI#2026$Secure
```

Use this account for:
- App Store review demo account
- IAP testing screenshots
- TestFlight testing

---

## 🚀 Deployment Commands

### Build for TestFlight
```bash
cd apps/mobile
npx eas build --platform ios --profile preview
```

### Build for App Store
```bash
cd apps/mobile
npx eas build --platform ios --profile production
```

### Submit to App Store
```bash
cd apps/mobile
npx eas submit --platform ios
```

---

## 🔒 Security Notes

- Claude API key: Stored in Supabase secrets only
- Supabase anon key: In `.env` (gitignored)
- No secrets in repository
- RLS policies protect all user data
- Videos stored in private bucket with user-scoped access

---

## 📊 Production Readiness: ~85%

### Remaining Tasks:
1. Create storage bucket (5 min)
2. Configure RevenueCat (30 min)
3. Set up App Store Connect (1 hour)
4. Configure EAS (15 min)
5. Deploy legal pages (30 min)
6. Replace placeholder assets (5 min)
7. TestFlight testing (ongoing)

**Estimated time to App Store submission: 3-4 hours of configuration work**
