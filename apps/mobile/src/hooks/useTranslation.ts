// Translation Hook
import { useState, useEffect, useCallback } from 'react';
import {
  i18n,
  t,
  setLanguage,
  getCurrentLanguage,
  initializeI18n,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from '@/i18n';

interface UseTranslationReturn {
  t: (key: string, options?: Record<string, unknown>) => string;
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  isInitialized: boolean;
  languages: typeof SUPPORTED_LANGUAGES;
}

/**
 * Hook for using translations in components
 *
 * @example
 * const { t, locale, setLocale } = useTranslation();
 *
 * // Use translations
 * <Text>{t('common.loading')}</Text>
 * <Text>{t('home.greeting', { name: 'John' })}</Text>
 *
 * // Change language
 * await setLocale('es');
 */
export function useTranslation(): UseTranslationReturn {
  const [locale, setLocaleState] = useState(getCurrentLanguage());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeI18n().then((initialLocale) => {
      setLocaleState(initialLocale);
      setIsInitialized(true);
    });
  }, []);

  const setLocale = useCallback(async (newLocale: string) => {
    await setLanguage(newLocale);
    setLocaleState(newLocale);
  }, []);

  // Create a translate function that triggers re-render on locale change
  const translate = useCallback(
    (key: string, options?: Record<string, unknown>) => {
      // Force dependency on locale for re-renders
      return i18n.t(key, options);
    },
    [locale]
  ); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    t: translate,
    locale,
    setLocale,
    isInitialized,
    languages: SUPPORTED_LANGUAGES,
  };
}

// Re-export for convenience
export { t, SUPPORTED_LANGUAGES, type LanguageCode };
