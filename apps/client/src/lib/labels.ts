import type { PlaceCategory } from '../types';

import { localLabels } from '../localization';
import { useLangStore } from '../stores/LangStore';
import { LanguageCode } from '../types/Language';

import { useMemo } from 'react';

export const useCategoryLabels = () => {
    const lang: LanguageCode = useLangStore((store) => store.language);
    const labels = useMemo(() => {
        return {
            all: localLabels.lbl_all[lang],
            attraction: localLabels.lbl_attraction[lang],
            monument: localLabels.lbl_monument[lang],
            nature: localLabels.lbl_nature[lang],
            museum: localLabels.lbl_museum[lang],
            restaurant: localLabels.lbl_restaurant[lang],
            lodging: localLabels.lbl_lodging[lang],
            viewpoint: localLabels.lbl_viewpoint[lang],
            history: localLabels.lbl_history[lang]
        };
    }, [lang, localLabels]);

    return labels;
};

export const categoryEmoji: Record<PlaceCategory, string> = {
  attraction: '⭐',
  monument: '🏛️',
  nature: '🌿',
  museum: '🦉',
  restaurant: '☕',
  lodging: '🛏️',
  viewpoint: '🔭',
  history: '📜'
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
