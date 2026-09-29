import { createContext } from 'react';
import type { Language, TranslationKey } from '../constants/translations';

export type LanguageContextType = {
  language: Language;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
};

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
