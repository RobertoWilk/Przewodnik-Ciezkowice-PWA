export type LanguageCode = 'pl' | 'en';

export interface LocalizationKeys {
    hd_title: Record<LanguageCode, string>;
    hd_lower_title: Record<LanguageCode, string>;
}