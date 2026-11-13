import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { ItinerariesGroup } from '../types';

import { localization } from '../localization';
import { useLangStore } from '../stores/LangStore';
import { LanguageCode } from '../types/Language';

export function ItinerariesPage() {
  const lang: LanguageCode = useLangStore((store) => store.language);

  const [items, setItems] = useState<ItinerariesGroup | null>(null);
  const [active, setActive] = useState<'one_day' | 'two_day'>('one_day');

  useEffect(() => {
    api.itineraries().then(setItems).catch(console.error);
  }, []);

  const selected = items?.pl.find((item) => item.type === active);
  const selectedEn = items?.en.find((item) => item.itin_id === selected?.id);
  const selectedLang = (lang === "pl" ? selected : selectedEn);

  return (
    <main className="page">
      <section className="section-heading">
        <div>
          <span className="eyebrow">{localization.trps_eb[lang]}</span>
          <h1>{localization.trps_header[lang]}</h1>
          <p>{localization.trps_desc[lang]}</p>
        </div>
        <div className="segmented">
          <button className={active === 'one_day' ? 'active' : ''} onClick={() => setActive('one_day')}>
            {localization.trps_day1[lang]}
          </button>
          <button className={active === 'two_day' ? 'active' : ''} onClick={() => setActive('two_day')}>
            {localization.trps_day2[lang]}
          </button>
        </div>
      </section>

      {selected && selectedLang && (
        <article className="itinerary-card">
          <h2>{selectedLang.title}</h2>
          <p>{selectedLang.description}</p>
          <div className="day-grid">
            {selectedLang.days.map((day) => (
              <section key={day.day} className="day-card">
                <span className="day-label">{localization.plnr_day[lang]} {day.day}</span>
                <h3>{day.title}</h3>
                <p>{day.summary}</p>
                <ol className="schedule">
                  {day.items.map((entry) => (
                    <li key={`${day.day}-${entry.time}-${entry.title}`}>
                      <time>{entry.time}</time>
                      <div>
                        <strong>{entry.title}</strong>
                        <span>{entry.description}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </article>
      )}
    </main>
  );
}
