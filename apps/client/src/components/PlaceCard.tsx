import { categoryEmoji, useCategoryLabels } from '../lib/labels';
import type { PlaceGroup, Place, PlaceLang } from '../types';

import { localization } from '../localization';
import { useLangStore } from '../stores/LangStore';
import { LanguageCode } from '../types/Language';

interface PlaceCardProps {
  place: Place;
  placeEn?: PlaceLang;
  favorite?: boolean;
  onToggleFavorite?: (place: Place) => void;
  onShowOnMap?: (place: Place) => void;
  onOpenPlace?: (place: Place) => void;
}

export function PlaceCard({ place, placeEn, favorite, onToggleFavorite, onShowOnMap, onOpenPlace }: PlaceCardProps) {
  const categoryLabels = useCategoryLabels();
  const lang: LanguageCode = useLangStore((store) => store.language);

  const imageUrl = place.imageUrl ?? place.photos[0]?.url;
  const placeLang = ((lang === "pl" || placeEn == null) ? place : placeEn);
  return (
    <article className="place-card">
      <div className="place-image" style={{ backgroundImage: imageUrl ? `url(${imageUrl})` : undefined }}>
        <span className="category-badge">
          {categoryEmoji[place.category]} {categoryLabels[place.category]}
        </span>
        {place.photos.length > 1 && <span className="photo-count-badge">📷 {place.photos.length}</span>}
      </div>
      <div className="place-content">
        <h3>{placeLang.name}</h3>
        <p>{placeLang.shortDescription}</p>
        <div className="tag-list">
          {placeLang.tags.slice(0, 4).map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
        <details>
          <summary>{localization.pc_details[lang]}</summary>
          <p>{placeLang.description}</p>
          {placeLang.funFact && <p className="fun-fact">💡 {placeLang.funFact}</p>}
          <dl className="meta-list">
            {place.address && (
              <>
                <dt>{localization.pc_address[lang]}</dt>
                <dd>{place.address}</dd>
              </>
            )}
            {placeLang.openingHours && (
              <>
                <dt>{localization.pc_hours[lang]}</dt>
                <dd>{placeLang.openingHours}</dd>
              </>
            )}
            {placeLang.ticketInfo && (
              <>
                <dt>{localization.pc_ticket[lang]}</dt>
                <dd>{placeLang.ticketInfo}</dd>
              </>
            )}
          </dl>
          <a href={place.sourceUrl} target="_blank" rel="noreferrer">
            {localization.pc_source[lang]} {place.sourceLabel}
          </a>
        </details>
        <div className="card-actions">
          {onOpenPlace && (
            <button onClick={() => onOpenPlace(place)} className="primary">
              {localization.pc_loc_details[lang]}
            </button>
          )}
          {onShowOnMap && (
            <button onClick={() => onShowOnMap(place)} className="secondary">
              {localization.pc_show_map[lang]}
            </button>
          )}
          {onToggleFavorite && (
            <button onClick={() => onToggleFavorite(place)} className={favorite ? 'favorite active' : 'favorite'}>
              {favorite ? localization.pc_fav_btn[lang] : localization.pc_add_btn[lang]}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
