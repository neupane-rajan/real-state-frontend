import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { translations, type Language, type TranslationKey } from '../constants/translations';
import { LanguageContext } from './languageContextValue';

const LANGUAGE_STORAGE_KEY = 'realStateLanguage';


export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      return localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'en' ? 'en' : 'np';
    } catch {
      return 'np';
    }
  });

  // Keep <html lang> in sync for screen readers and remember the visitor's choice.
  useEffect(() => {
    document.documentElement.lang = language === 'np' ? 'ne' : 'en';
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Storage unavailable; the choice just won't persist.
    }
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'np' ? 'en' : 'np'));
  };

  const t = (key: TranslationKey) => {
    return translations[language][key] || translations['np'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

