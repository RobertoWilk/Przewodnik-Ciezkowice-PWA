import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { SourceItem } from '../types';

import { localization } from '../localization';
import { useLangStore } from '../stores/LangStore';
import { LanguageCode } from '../types/Language';

export function SourcesPage() {
  const lang: LanguageCode = useLangStore((store) => store.language);
  const [sources, setSources] = useState<SourceItem[]>([]);

  useEffect(() => {
    api.sources().then(setSources).catch(console.error);
  }, []);

  return (
    <main className="page article-page">
      <span className="eyebrow">{localization.srcs_eb[lang]}</span>
      <h1>{localization.srcs_header[lang]}</h1>
      <p>
        {localization.srcs_desc[lang]}
      </p>
      <div className="source-list">
        {sources.map((source) => (
          <a key={source.sourceUrl} href={source.sourceUrl} target="_blank" rel="noreferrer">
            <strong>{source.sourceLabel}</strong>
            <span>{source.sourceUrl}</span>
          </a>
        ))}
      </div>
    </main>
  );
}
