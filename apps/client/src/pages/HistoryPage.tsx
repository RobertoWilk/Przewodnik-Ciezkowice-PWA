import { localization } from '../localization';
import { useLangStore } from '../stores/LangStore';
import { LanguageCode } from '../types/Language';

export function HistoryPage() {
  const lang: LanguageCode = useLangStore((store) => store.language);
  return (
    <main className="page article-page">
      <span className="eyebrow">{localization.hist_eb[lang]}</span>
      <h1>{localization.hist_header[lang]}</h1>
      <p>
        {localization.hist_desc[lang]}
      </p>
      <section className="article-card">
        <h2>{localization.hist_dates_head[lang]}</h2>
        <ul className="timeline-list">
          <li>
            <strong>1125</strong>
            <span>{localization.hist_date_1125[lang]}</span>
          </li>
          <li>
            <strong>1348</strong>
            <span>{localization.hist_date_1348[lang]}</span>
          </li>
          <li>
            <strong>1934</strong>
            <span>{localization.hist_date_1934[lang]}</span>
          </li>
          <li>
            <strong>1998</strong>
            <span>{localization.hist_date_1998[lang]}</span>
          </li>
          <li>
            <strong>2023</strong>
            <span>{localization.hist_date_2023[lang]}</span>
          </li>
        </ul>
      </section>
      <section className="article-card two-column-text">
        <div>
          <h2>{localization.hist_ff_1[lang]}</h2>
          <p>
            {localization.hist_ff_1_desc[lang]}
          </p>
        </div>
        <div>
          <h2>{localization.hist_ff_2[lang]}</h2>
          <p>
            {localization.hist_ff_2_desc[lang]}
          </p>
        </div>
      </section>
      <p className="source-note">
        {localization.hist_footer[lang]}
      </p>
    </main>
  );
}
