import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { categoryEmoji, useCategoryLabels } from '../lib/labels';
import type { Place, PlaceGroup, PlacePhoto } from '../types';

import { localization } from '../localization';
import { useLangStore } from '../stores/LangStore';
import { LanguageCode } from '../types/Language';

import Speech from "react-text-to-speech";

interface PlaceDetailsPageProps {
  slug?: string;
  token?: string;
  onBack: () => void;
  onShowMap: () => void;
  onOpenAuth: () => void;
}

export function PlaceDetailsPage({ slug, token, onBack, onShowMap, onOpenAuth }: PlaceDetailsPageProps) {
  const lang: LanguageCode = useLangStore((store) => store.language);
  const categoryLabels = useCategoryLabels();

  const [place, setPlace] = useState<PlaceGroup | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    //api.place(slug).then(setPlace).catch(console.error);

    const fetchPlace = async () => {
      try {
        const data = await api.place(slug);
        setPlace(data);
      } catch (error) {
        console.error("Error with loading palce data:", error);
        setPlace(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlace();
  }, [slug]);

  const placeLang = (lang === "pl" ? place?.pl : place?.en);

  const photos: PlacePhoto[] = useMemo(() => {
    if (!place) return [];
    if (place.pl.photos.length) return place.pl.photos;
    return place.pl.imageUrl ? [{ url: place.pl.imageUrl, caption: placeLang?.name, sourceLabel: place.pl.sourceLabel, sourceUrl: place.pl.sourceUrl, isMain: true }] : [];
  }, [place]);

  if (!slug) {
    return <EmptyDetails onBack={onBack} />;
  }

  if (!place) {
    return (
      <main className="page article-page">
        <button className="secondary" onClick={onBack}>← {localization.dtls_back_sm[lang]}</button>
        <h1>{localization.dtls_load[lang]}</h1>
      </main>
    );
  }

  const selectedPhoto = photos[activePhoto] ?? photos[0];
  const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.pl.latitude},${place.pl.longitude}`;

  async function addFavorite() {
    if (!token) {
      onOpenAuth();
      return;
    }
    await api.addFavorite(place!.pl.id, token);
    setMessage(localization.dtls_fav[lang]);
  }

  return (
    <main className="page place-details-page">
      <button className="secondary" onClick={onBack}>← {localization.dtls_back[lang]}</button>

      {!isLoading && place && placeLang && (
        <>
          <section className="place-hero-detail">
            <div className="detail-gallery-panel">
              {selectedPhoto ? <img src={selectedPhoto.url} alt={selectedPhoto.caption ?? placeLang?.name} /> : <div className="empty-photo">{localization.dtls_noimg[lang]}</div>}
              {photos.length > 1 && (
                <div className="photo-strip">
                  {photos.map((photo, index) => (
                    <button key={`${photo.url}-${index}`} className={activePhoto === index ? 'active' : ''} onClick={() => setActivePhoto(index)}>
                      <img src={photo.url} alt={photo.caption ?? placeLang.name} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <article className="detail-info-panel">
              <span className="eyebrow">{categoryEmoji[place.pl.category]} {categoryLabels[place.pl.category]}</span>
              <h1>{placeLang.name}</h1>
              <p className="lead-text" style={{ whiteSpace: 'pre-wrap'}}>{placeLang?.shortDescription}</p>
              <Speech text={placeLang.description} lang={lang} />
              <p style={{whiteSpace: 'pre-wrap'}}>{placeLang.description}</p>
              {placeLang.funFact && <p className="fun-fact">💡 {placeLang.funFact}</p>}
              <div className="tag-list">
                {placeLang.tags.map((tag) => <span key={tag}>#{tag}</span>)}
              </div>
              <div className="detail-actions">
                <a className="primary as-link" href={navigationUrl} target="_blank" rel="noreferrer">{localization.dtls_guide[lang]}</a>
                <button className="secondary" onClick={onShowMap}>{localization.dtls_map[lang]}</button>
                <button className="favorite" onClick={addFavorite}>☆ {localization.dtls_favadd[lang]}</button>
              </div>
              {message && <p className="success-box">{message}</p>}
            </article>
          </section>

          <section className="detail-grid">
            <article className="article-card">
              <h2>{localization.dtls_info[lang]}</h2>
              <dl className="meta-list wide-meta">
                {place.pl.address && <><dt>{localization.dtls_addr[lang]}</dt><dd>{place.pl.address}</dd></>}
                <dt>{localization.dtls_coor[lang]}</dt><dd>{place.pl.latitude.toFixed(6)}, {place.pl.longitude.toFixed(6)}</dd>
                {placeLang.openingHours && <><dt>{localization.dtls_hrs[lang]}</dt><dd>{placeLang.openingHours}</dd></>}
                {placeLang.ticketInfo && <><dt>{localization.dtls_tck[lang]}</dt><dd>{placeLang.ticketInfo}</dd></>}
                {place.pl.phone && <><dt>{localization.dtls_phn[lang]}</dt><dd>{place.pl.phone}</dd></>}
                {place.pl.website && <><dt>{localization.dtls_web[lang]}</dt><dd><a href={place.pl.website} target="_blank" rel="noreferrer">{place.pl.website}</a></dd></>}
              </dl>
            </article>
            <article className="article-card">
              <h2>{localization.dtls_srcs[lang]}</h2>
              <p><a href={place.pl.sourceUrl} target="_blank" rel="noreferrer">{place.pl.sourceLabel}</a></p>
              <p className="muted">{localization.dtls_imgcnt[lang]}: {photos.length}. {localization.dtls_addimg[lang]}</p>
            </article>
          </section>
        </>
      )}


    </main>
  );
}

function EmptyDetails({ onBack }: { onBack: () => void }) {
  const lang: LanguageCode = useLangStore((store) => store.language);
  return (
    <main className="page article-page">
      <h1>{localization.dtls_noplc[lang]}</h1>
      <button className="secondary" onClick={onBack}>{localization.dtls_back[lang]}</button>
    </main>
  );
}
