// Internationalization (i18n) Configuration
import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en';
import es from './locales/es';
import fr from './locales/fr';
import pt from './locales/pt';
import ja from './locales/ja';
import zh from './locales/zh';
import ko from './locales/ko';
import de from './locales/de';

// Create i18n instance
const i18n = new I18n({
  en,
  es,
  fr,
  pt,
  ja,
  zh,
  ko,
  de,
});

// Set default locale and fallback
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

// Storage key for user language preference
const LANGUAGE_KEY = '@boxing_coach_language';

// Supported languages with display names
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

/**
 * Initialize i18n with saved preference or device locale
 */
export async function initializeI18n(): Promise<string> {
  try {
    // Check for saved language preference
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);

    if (savedLanguage && isValidLanguage(savedLanguage)) {
      i18n.locale = savedLanguage;
      return savedLanguage;
    }

    // Use device locale
    const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';
    const locale = isValidLanguage(deviceLocale) ? deviceLocale : 'en';
    i18n.locale = locale;
    return locale;
  } catch (error) {
    console.error('Failed to initialize i18n:', error);
    i18n.locale = 'en';
    return 'en';
  }
}

/**
 * Change the current language
 */
export async function setLanguage(languageCode: string): Promise<void> {
  if (!isValidLanguage(languageCode)) {
    console.warn(`Invalid language code: ${languageCode}`);
    return;
  }

  i18n.locale = languageCode;
  await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
}

/**
 * Get the current language code
 */
export function getCurrentLanguage(): string {
  return i18n.locale;
}

/**
 * Check if a language code is supported
 */
export function isValidLanguage(code: string): boolean {
  return SUPPORTED_LANGUAGES.some((lang) => lang.code === code);
}

/**
 * Get language info by code
 */
export function getLanguageInfo(code: string) {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
}

/**
 * Translate function with type safety
 */
export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}

export { i18n };
export default i18n;
