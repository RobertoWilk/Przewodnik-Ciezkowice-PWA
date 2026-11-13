import { type ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useCategoryLabels, slugify } from '../lib/labels';
import type { Itinerary, ItineraryDay, ItineraryDayLang, ItinerariesGroup, ItineraryLang, Place, PlaceCategory, PlaceGroup, PlaceLang, PlacePhoto, PlacesGroup, RouteGroup, RoutePoint, RoutePointLang, RoutesLang, TouristRoute, TouristRouteLang, User, ItineraryGroup } from '../types';

import { localization } from '../localization';
import { useLangStore } from '../stores/LangStore';
import { LanguageCode } from '../types/Language';


interface AdminPageProps {
  token?: string;
  user?: User | null;
  onOpenAuth: () => void;
}

type AdminTab = 'places' | 'routes' | 'itineraries' | 'accounts';

interface AdminForm {
  id?: number;
  name: string;
  slug: string;
  category: PlaceCategory;
  shortDescription: string;
  description: string;
  latitude: string;
  longitude: string;
  address: string;
  openingHours: string;
  ticketInfo: string;
  website: string;
  phone: string;
  imageUrl: string;
  sourceLabel: string;
  sourceUrl: string;
  tags: string;
  photosText: string;
  funFact: string;
  isFeatured: boolean;

  name_en: string;
  shortDescription_en: string;
  description_en: string;
  openingHours_en: string;
  ticketInfo_en: string;
  tags_en: string;
  funFact_en: string;
}

interface RouteForm {
  id?: number;
  title: string;
  slug: string;
  type: 'walking' | 'cycling' | 'trail';
  distanceKm: string;
  duration: string;
  difficulty: 'łatwa' | 'średnia' | 'trudna';
  description: string;
  pointsText: string;
  sourceLabel: string;
  sourceUrl: string;

  title_en: string;
  duration_en: string;
  description_en: string;
  pointsText_en: string;
}

interface ItineraryForm {
  id?: number;
  title: string;
  slug: string;
  type: 'one_day' | 'two_day';
  description: string;
  daysText: string;

  title_en: string;
  description_en: string;
  daysText_en: string;
}

interface AccountForm {
  email: string;
  password: string;
  role: User['role'];
}

const emptyForm: AdminForm = {
  name: '',
  slug: '',
  category: 'attraction',
  shortDescription: '',
  description: '',
  latitude: '49.786389',
  longitude: '20.974167',
  address: '',
  openingHours: '',
  ticketInfo: '',
  website: '',
  phone: '',
  imageUrl: '',
  sourceLabel: '',
  sourceUrl: '',
  tags: '',
  photosText: JSON.stringify(
    [
      {
        url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
        caption: 'Zdjęcie miejsca',
        sourceLabel: 'Zdjęcie zastępcze',
        sourceUrl: 'https://unsplash.com/',
        isMain: true
      }
    ],
    null,
    2
  ),
  funFact: '',
  isFeatured: false,

  name_en: '',
  shortDescription_en: '',
  description_en: '',
  openingHours_en: '',
  ticketInfo_en: '',
  tags_en: '',
  funFact_en: ''
};

const emptyRouteForm: RouteForm = {
  title: '',
  slug: '',
  type: 'walking',
  distanceKm: '1.0',
  duration: '1 godzina',
  difficulty: 'łatwa',
  description: '',
  pointsText: JSON.stringify(
    [
      { name: 'Rynek w Ciężkowicach', latitude: 49.786389, longitude: 20.974167 },
      { name: 'Skamieniałe Miasto', latitude: 49.776389, longitude: 20.966667 }
    ],
    null,
    2
  ),
  sourceLabel: '',
  sourceUrl: '',

  title_en: '',
  duration_en: '1 hour',
  description_en: '',
  pointsText_en: JSON.stringify(
    [
      { name: 'Market Square', latitude: 49.786389, longitude: 20.974167 },
      { name: 'Petrified City', latitude: 49.776389, longitude: 20.966667 }
    ],
    null,
    2
  )
};

const emptyItineraryForm: ItineraryForm = {
  title: '',
  slug: '',
  type: 'one_day',
  description: '',
  daysText: JSON.stringify(
    [
      {
        day: 1,
        title: 'Dzień zwiedzania',
        summary: 'Krótki opis dnia wycieczki.',
        items: [
          {
            time: '09:00',
            title: 'Start wycieczki',
            description: 'Opis punktu programu.',
            placeSlug: 'rynek-ratusz'
          }
        ]
      }
    ],
    null,
    2
  ),

  title_en: '',
  description_en: '',
  daysText_en: JSON.stringify(
    [
      {
        day: 1,
        title: 'Trip day',
        summary: 'Short description of the day.',
        items: [
          {
            time: '09:00',
            title: 'Trip start',
            description: 'Program point description.',
            placeSlug: 'rynek-ratusz'
          }
        ]
      }
    ],
    null,
    2
  )
};

const emptyAccountForm: AccountForm = {
  email: '',
  password: '',
  role: 'user'
};

export function AdminPage({ token, user, onOpenAuth }: AdminPageProps) {
  const lang: LanguageCode = useLangStore((store) => store.language);
  const categoryLabels = useCategoryLabels();

  const [activeTab, setActiveTab] = useState<AdminTab>('places');
  const [places, setPlaces] = useState<PlacesGroup | null>(null);
  const [routes, setRoutes] = useState<RoutesLang | null>(null);
  const [itineraries, setItineraries] = useState<ItinerariesGroup | null>(null);
  const [accounts, setAccounts] = useState<User[]>([]);
  const [form, setForm] = useState<AdminForm>(emptyForm);
  const [routeForm, setRouteForm] = useState<RouteForm>(emptyRouteForm);
  const [itineraryForm, setItineraryForm] = useState<ItineraryForm>(emptyItineraryForm);
  const [accountForm, setAccountForm] = useState<AccountForm>(emptyAccountForm);
  const [passwordDrafts, setPasswordDrafts] = useState<Record<number, string>>({});
  const [dashboard, setDashboard] = useState<{
    places: number;
    routes: number;
    itineraries: number;
    users: number;
    searches: number;
    favorites: number;
  } | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [routePlaceSlug, setRoutePlaceSlug] = useState('');
  const [adminLoading, setAdminLoading] = useState(true);
  const [previewPhoto, setPreviewPhoto] = useState<PlacePhoto | null>(null);

  const isAdmin = Boolean(token && user?.role === 'admin');
  const isManager = Boolean(token && (user?.role === 'admin' || user?.role === 'moderator'));


  useEffect(() => {
    if (!isManager || !token) {
      setAdminLoading(false);
      return;
    }
    refresh(token, true).catch((err) => {
      setError(err instanceof Error ? err.message : localization.admin_load_err[lang]);
    });
  }, [isManager, token, user?.role]);

  async function refresh(authToken = token, showLoader = false) {
    if (!authToken) return;
    if (showLoader) setAdminLoading(true);
    try {
      const [allPlaces, allRoutes, allItineraries, stats, allAccounts] = await Promise.all([
        api.places(),
        api.routes(),
        api.itineraries(),
        api.adminDashboard(authToken),
        isAdmin ? api.adminUsers(authToken) : Promise.resolve([])
      ]);
      setPlaces(allPlaces);
      setRoutes(allRoutes);
      setItineraries(allItineraries);
      setDashboard(stats);
      setAccounts(allAccounts);
    } finally {
      if (showLoader) setAdminLoading(false);
    }
  }

  async function submitPlace(event: FormEvent) {
    event.preventDefault();
    if (!token || !places) return;
    setError('');
    try {
      if (form.id) {
        const payload = formToPayload(form, form.id, lang);
        await api.adminUpdatePlace(form.id, payload, token);
        setMessage(localization.admin_plcs_msg_upd[lang]);
      } else {
        const placeId = getPlacesLastIndex()!+1;
        const payload = formToPayload(form, placeId!, lang);
        await api.adminCreatePlace(payload, token);
        setMessage(localization.admin_plcs_msg_add[lang]);
      }
      setForm(emptyForm);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : localization.admin_plcs_msg_err[lang]);
    }
  }

  async function removePlace(place: Place) {
    if (!token) return;
    const ok = window.confirm(`${localization.admin_plcs_msg_cnf[lang]}: ${place.name}?`);
    if (!ok) return;
    await api.adminDeletePlace(place.id, token);
    setMessage(localization.admin_plcs_msg_del[lang]);
    await refresh();
  }

  const photoDrafts = parsePhotosForEditor(form.photosText);

  function setPhotoDrafts(photos: PlacePhoto[]) {
    setForm((current) => ({ ...current, photosText: JSON.stringify(normalizePhotoDrafts(photos), null, 2) }));
  }

  function updatePhoto(index: number, patch: Partial<PlacePhoto>) {
    const next = photoDrafts.map((photo, itemIndex) => (itemIndex === index ? { ...photo, ...patch } : photo));
    setPhotoDrafts(next);
  }

  function addPhoto() {
    setPhotoDrafts([
      ...photoDrafts,
      {
        url: '',
        caption: form.name || localization.admin_img_plc[lang],
        sourceLabel: 'fot. Robert Wilk',
        sourceUrl: localization.admin_img_orig[lang],
        isMain: photoDrafts.length === 0
      }
    ]);
  }

  function removePhoto(index: number) {
    const next = photoDrafts.filter((_, itemIndex) => itemIndex !== index);
    if (next.length && !next.some((photo) => photo.isMain)) {
      next[0] = { ...next[0], isMain: true };
    }
    setPhotoDrafts(next);
  }

  function markMainPhoto(index: number) {
    setPhotoDrafts(photoDrafts.map((photo, itemIndex) => ({ ...photo, isMain: itemIndex === index })));
  }

  function handleLocalPhoto(index: number, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updatePhoto(index, {
        url: String(reader.result),
        caption: photoDrafts[index]?.caption || file.name,
        sourceLabel: photoDrafts[index]?.sourceLabel || 'fot. Robert Wilk',
        sourceUrl: photoDrafts[index]?.sourceUrl || localization.admin_img_orig[lang]
      });
    };
    reader.readAsDataURL(file);
  }

  const routePointDrafts = parseRoutePointsForEditor(routeForm.pointsText, routeForm.pointsText_en);

  function setRoutePointDrafts(points: RoutePointLang[]) {
    setRouteForm((current) => ({ ...current, pointsText: JSON.stringify(normalizeRoutePointDraftsPl(points), null, 2) }));
    setRouteForm((current) => ({ ...current, pointsText_en: JSON.stringify(normalizeRoutePointDraftsEn(points), null, 2) }));
  }

  function updateRoutePoint(index: number, patch: Partial<RoutePointLang>) {
    const next = routePointDrafts.map((point, itemIndex) => (itemIndex === index ? { ...point, ...patch } : point));
    setRoutePointDrafts(next);
  }

  function addRoutePoint() {
    setRoutePointDrafts([...routePointDrafts, { name_pl: 'Nowy punkt', name_en: 'New point', latitude: 49.786389, longitude: 20.974167 }]);
  }

  function addRoutePointFromPlace() {
    if (!places) return;
    const slug = routePlaceSlug || places.pl[0]?.slug;
    const placePl = places.pl.find((item) => item.slug === slug);
    const placeEn = places.en.find((item) => item.id === placePl?.id);
    if (!placePl || !placeEn) return;
    setRoutePointDrafts([...routePointDrafts, { name_pl: placePl.name, name_en: placeEn.name, latitude: placePl.latitude, longitude: placePl.longitude }]);
  }

  function removeRoutePoint(index: number) {
    setRoutePointDrafts(routePointDrafts.filter((_, itemIndex) => itemIndex !== index));
  }

  async function submitRoute(event: FormEvent) {
    event.preventDefault();
    if (!token || !routes) return;
    setError('');
    try {
      if (routeForm.id) {
        const payload = routeFormToPayload(routeForm, routeForm.id, lang);
        await api.adminUpdateRoute(routeForm.id, payload, token);
        setMessage(localization.admin_pnt_msg_upd[lang]);
      } else {
        const routeId = getRoutesLastIndex()!+1;
        const payload = routeFormToPayload(routeForm, routeId!, lang);
        await api.adminCreateRoute(payload, token);
        setMessage(localization.admin_pnt_msg_add[lang]);
      }
      setRouteForm(emptyRouteForm);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : localization.admin_pnt_msg_err[lang]);
    }
  }

  async function removeRoute(route: TouristRoute) {
    if (!token) return;
    const ok = window.confirm(`${localization.admin_pnt_msg_cnf[lang]}: ${route.title}?`);
    if (!ok) return;
    await api.adminDeleteRoute(route.id, token);
    setMessage(localization.admin_pnt_msg_del[lang]);
    await refresh();
  }

  async function submitItinerary(event: FormEvent) {
    event.preventDefault();
    if (!token || !itineraries) return;
    setError('');
    try {
      if (itineraryForm.id) {
        const payload = itineraryFormToPayload(itineraryForm, itineraryForm.id, lang);
        await api.adminUpdateItinerary(itineraryForm.id, payload, token);
        setMessage(localization.admin_trip_msg_upd[lang]);
      } else {
        const itinId = getItinerariesLastIndex()!+1;
        const payload = itineraryFormToPayload(itineraryForm, itinId!, lang);
        await api.adminCreateItinerary(payload, token);
        setMessage(localization.admin_trip_msg_add[lang]);
      }
      setItineraryForm(emptyItineraryForm);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : localization.admin_trip_msg_err[lang]);
    }
  }

  async function removeItinerary(itinerary: Itinerary) {
    if (!token) return;
    const ok = window.confirm(`${localization.admin_trip_msg_cnf[lang]}: ${itinerary.title}?`);
    if (!ok) return;
    await api.adminDeleteItinerary(itinerary.id, token);
    setMessage(localization.admin_trip_msg_del[lang]);
    await refresh();
  }

  async function submitAccount(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setError('');
    try {
      await api.adminCreateUser(accountForm, token);
      setAccountForm(emptyAccountForm);
      setMessage(localization.admin_acc_msg_add[lang]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : localization.admin_acc_msg_adderr[lang]);
    }
  }

  async function updateAccountRole(account: User, role: User['role']) {
    if (!token) return;
    setError('');
    try {
      await api.adminUpdateUserRole(account.id, role, token);
      setMessage(localization.admin_role_msg_chng[lang]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : localization.admin_role_msg_err[lang]);
    }
  }

  async function resetAccountPassword(account: User) {
    if (!token) return;
    const password = passwordDrafts[account.id] ?? '';
    if (password.length < 6) {
      setError(localization.admin_pass_msg_vld[lang]);
      return;
    }
    await api.adminResetUserPassword(account.id, password, token);
    setPasswordDrafts((current) => ({ ...current, [account.id]: '' }));
    setMessage(`${localization.admin_pass_msg_rst[lang]} ${account.email}.`);
  }

  async function removeAccount(account: User) {
    if (!token) return;
    const ok = window.confirm(`${localization.admin_acc_msg_cnf[lang]} ${account.email}?`);
    if (!ok) return;
    try {
      await api.adminDeleteUser(account.id, token);
      setMessage(localization.admin_acc_msg_del[lang]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : localization.admin_acc_msg_delerr[lang]);
    }
  }

  const itineraryDayDrafts = parseItineraryDaysForEditor(itineraryForm.daysText, itineraryForm.daysText_en);

  function setItineraryDayDrafts(days: ItineraryDayLang[]) {
    setItineraryForm((current) => ({ ...current, 
      daysText: JSON.stringify(normalizeItineraryDayDraftsPl(days), null, 2), 
      daysText_en: JSON.stringify(normalizeItineraryDayDraftsEn(days), null, 2) 
    }));
  }

  function updateItineraryDay(dayIndex: number, patch: Partial<ItineraryDayLang>) {
    const next = itineraryDayDrafts.map((dayItem, index) => (index === dayIndex ? { ...dayItem, ...patch } : dayItem));
    setItineraryDayDrafts(next);
  }

  function addItineraryDay() {
    const nextDay = Math.max(0, ...itineraryDayDrafts.map((dayItem) => Number(dayItem.day) || 0)) + 1;
    setItineraryDayDrafts([
      ...itineraryDayDrafts,
      {
        day: nextDay,
        title_pl: `Dzień ${nextDay}`,
        title_en: `Day ${nextDay}`,
        summary_pl: 'Opis dnia wycieczki.',
        summary_en: 'Description of this day.',
        items: []
      }
    ]);
  }

  function removeItineraryDay(dayIndex: number) {
    setItineraryDayDrafts(itineraryDayDrafts.filter((_, index) => index !== dayIndex));
  }

  function updateItineraryItem(dayIndex: number, itemIndex: number, patch: Partial<ItineraryDayLang['items'][number]>) {
    const next = itineraryDayDrafts.map((dayItem, index) => {
      if (index !== dayIndex) return dayItem;
      return {
        ...dayItem,
        items: dayItem.items.map((entry, entryIndex) => (entryIndex === itemIndex ? { ...entry, ...patch } : entry))
      };
    });
    setItineraryDayDrafts(next);
  }

  function addItineraryItem(dayIndex: number) {
    if (!places) return [];
    const firstPlace = places.pl[0];
    const firstPlaceLang = (lang === "pl" ? places.pl[0] : places.en[0]);
    const next = itineraryDayDrafts.map((dayItem, index) => {
      if (index !== dayIndex) return dayItem;
      return {
        ...dayItem,
        items: [
          ...dayItem.items,
          {
            time: '09:00',
            title_pl: firstPlaceLang.name ?? 'Nowy punkt programu',
            description_pl: 'Opis punktu programu.',
            title_en: firstPlaceLang.name ?? 'New program point',
            description_en: 'Program point\'s description.',
            placeSlug: firstPlace.slug
          }
        ]
      };
    });
    setItineraryDayDrafts(next);
  }

  function removeItineraryItem(dayIndex: number, itemIndex: number) {
    const next = itineraryDayDrafts.map((dayItem, index) => {
      if (index !== dayIndex) return dayItem;
      return { ...dayItem, items: dayItem.items.filter((_, entryIndex) => entryIndex !== itemIndex) };
    });
    setItineraryDayDrafts(next);
  }

  function getPlacesLastIndex(): number | null {
    if (!places) return null;
    let maxIdx = 0;
    places.pl.forEach((place) => {
      if (place.id > maxIdx)
        maxIdx = place.id;
    });
    return maxIdx;
  }

  function getRoutesLastIndex(): number | null {
    if (!routes) return null;
    let maxIdx = 0;
    routes.pl.forEach((route) => {
      if (route.id > maxIdx)
        maxIdx = route.id;
    });
    return maxIdx;
  }

  function getItinerariesLastIndex(): number | null {
    if (!itineraries) return null;
    let maxIdx = 0;
    itineraries.pl.forEach((itinerary) => {
      if (itinerary.id > maxIdx)
        maxIdx = itinerary.id;
    });
    return maxIdx;
  }

  if (!isManager) {
    return (
      <main className="page article-page">
        <span className="eyebrow">{localization.admin_eb[lang]}</span>
        <h1>{localization.admin_guest_header[lang]}</h1>
        <p>
          {localization.admin_guest_desc[lang]}
        </p>
        <div className="article-card">
          <p>
            {localization.admin_guest_def[lang]}: <strong>admin@ciezkowice.local</strong> / <strong>admin123</strong>.
          </p>
          <button className="primary" onClick={onOpenAuth}>
            {localization.admin_guest_login[lang]}
          </button>
        </div>
      </main>
    );
  }

  const adminHeader = (
      <section className="section-heading">
        <div>
          <span className="eyebrow">{localization.admin_eb[lang]}</span>
          <h1>{localization.admin_header[lang]}</h1>
          <p>{localization.admin_desc[lang]}</p>
        </div>
      </section>
  );

  if (adminLoading) {
    return (
      <main className="page admin-page">
        {adminHeader}
        {adminLoadingSkeleton(lang)}
      </main>
    );
  }

  return (
    <main className="page admin-page">
      {adminHeader}

      {dashboard && (
        <div className="stats-grid admin-stats">
          <article><strong>{dashboard.places}</strong><span>{localization.admin_stat_plc_sm[lang]}</span></article>
          <article><strong>{dashboard.routes}</strong><span>{localization.admin_stat_rou_sm[lang]}</span></article>
          <article><strong>{dashboard.itineraries}</strong><span>{localization.admin_stat_trp_sm[lang]}</span></article>
          <article><strong>{dashboard.favorites}</strong><span>{localization.admin_stat_fav_sm[lang]}</span></article>
        </div>
      )}

      <div className="segmented admin-tabs" role="tablist" aria-label={localization.admin_modules[lang]}>
        <button className={activeTab === 'places' ? 'active' : ''} onClick={() => setActiveTab('places')}>{localization.admin_stat_plc_lg[lang]}</button>
        <button className={activeTab === 'routes' ? 'active' : ''} onClick={() => setActiveTab('routes')}>{localization.admin_stat_rou_lg[lang]}</button>
        <button className={activeTab === 'itineraries' ? 'active' : ''} onClick={() => setActiveTab('itineraries')}>{localization.admin_stat_trp_lg[lang]}</button>
        {isAdmin && <button className={activeTab === 'accounts' ? 'active' : ''} onClick={() => setActiveTab('accounts')}>{localization.admin_stat_acc_lg[lang]}</button>}
      </div>

      {message && <p className="success-box">{message}</p>}
      {error && <p className="error-box">{error}</p>}

      {activeTab === 'places' && (
        <section className="admin-layout">
          <form className="admin-form" onSubmit={submitPlace}>
            <h2>{form.id ? localization.admin_plcs_edit[lang] : localization.admin_plcs_new[lang]}</h2>
            <h3>{localization.admin_lang_pl[lang]}</h3>
            <div className="form-grid two">
              <label>
                {localization.admin_form_name[lang]}
                <input
                  value={form.name}
                  onChange={(e) => setForm((current) => ({ ...current, name: e.target.value, slug: current.id ? current.slug : slugify(e.target.value) }))}
                  required
                />
              </label>
              <label>Slug URL<input value={form.slug} onChange={(e) => setForm((current) => ({ ...current, slug: e.target.value }))} required /></label>
              <label>
                {localization.admin_form_cat[lang]}
                <select value={form.category} onChange={(e) => setForm((current) => ({ ...current, category: e.target.value as PlaceCategory }))}>
                  {Object.entries(categoryLabels).filter(([key]) => key !== 'all').map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </label>
              <label>
                {localization.admin_form_feat[lang]}
                <select value={String(form.isFeatured)} onChange={(e) => setForm((current) => ({ ...current, isFeatured: e.target.value === 'true' }))}>
                  <option value="false">{localization.admin_form_no[lang]}</option>
                  <option value="true">{localization.admin_form_yes[lang]}</option>
                </select>
              </label>
              <label>{localization.admin_form_geola[lang]}<input value={form.latitude} onChange={(e) => setForm((current) => ({ ...current, latitude: e.target.value }))} required /></label>
              <label>{localization.admin_form_geolo[lang]}<input value={form.longitude} onChange={(e) => setForm((current) => ({ ...current, longitude: e.target.value }))} required /></label>
            </div>
            <label>{localization.admin_form_desc_sm[lang]}<textarea value={form.shortDescription} onChange={(e) => setForm((current) => ({ ...current, shortDescription: e.target.value }))} required /></label>
            <label>{localization.admin_form_desc_lg[lang]}<textarea value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} required rows={5} /></label>
            <div className="form-grid two">
              <label>{localization.admin_form_addr[lang]}<input value={form.address} onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))} /></label>
              <label>{localization.admin_form_hour[lang]}<input value={form.openingHours} onChange={(e) => setForm((current) => ({ ...current, openingHours: e.target.value }))} /></label>
              <label>{localization.admin_form_tckt[lang]}<input value={form.ticketInfo} onChange={(e) => setForm((current) => ({ ...current, ticketInfo: e.target.value }))} /></label>
              <label>{localization.admin_form_phn[lang]}<input value={form.phone} onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))} /></label>
              <label>WWW<input value={form.website} onChange={(e) => setForm((current) => ({ ...current, website: e.target.value }))} /></label>
              <label>{localization.admin_form_imgurl[lang]}<input value={form.imageUrl} onChange={(e) => setForm((current) => ({ ...current, imageUrl: e.target.value }))} /></label>
              <label>{localization.admin_form_srcname[lang]}<input value={form.sourceLabel} onChange={(e) => setForm((current) => ({ ...current, sourceLabel: e.target.value }))} required /></label>
              <label>{localization.admin_form_srcurl[lang]}<input value={form.sourceUrl} onChange={(e) => setForm((current) => ({ ...current, sourceUrl: e.target.value }))} required /></label>
            </div>
            <label>{localization.admin_form_tags[lang]}<input value={form.tags} onChange={(e) => setForm((current) => ({ ...current, tags: e.target.value }))} /></label>
            
            <h3>{localization.admin_lang_en[lang]}</h3>
            <label>
              {localization.admin_form_name[lang]} ({localization.admin_lang_en_sm[lang]})
              <input
                value={form.name_en}
                onChange={(e) => setForm((current) => ({ ...current, name_en: e.target.value }))}
                required
              />
            </label>
            <label>{localization.admin_form_desc_sm[lang]} ({localization.admin_lang_en_sm[lang]})<textarea value={form.shortDescription_en} onChange={(e) => setForm((current) => ({ ...current, shortDescription_en: e.target.value }))} required /></label>
            <label>{localization.admin_form_desc_lg[lang]} ({localization.admin_lang_en_sm[lang]})<textarea value={form.description_en} onChange={(e) => setForm((current) => ({ ...current, description_en: e.target.value }))} required rows={5} /></label>
            <div className="form-grid two">
              <label>{localization.admin_form_hour[lang]} ({localization.admin_lang_en_sm[lang]})<input value={form.openingHours_en} onChange={(e) => setForm((current) => ({ ...current, openingHours_en: e.target.value }))} /></label>
              <label>{localization.admin_form_tckt[lang]} ({localization.admin_lang_en_sm[lang]})<input value={form.ticketInfo_en} onChange={(e) => setForm((current) => ({ ...current, ticketInfo_en: e.target.value }))} /></label>
            </div>
            <label>{localization.admin_form_tags[lang]} ({localization.admin_lang_en_sm[lang]})<input value={form.tags_en} onChange={(e) => setForm((current) => ({ ...current, tags_en: e.target.value }))} /></label>

            
            <section className="photo-friendly-editor">
              <div className="photo-editor-header">
                <div>
                  <h3>{localization.admin_img[lang]}</h3>
                  <p className="muted">{localization.admin_img_desc[lang]}</p>
                </div>
                <button type="button" className="secondary" onClick={addPhoto}>+ {localization.admin_img_add[lang]}</button>
              </div>

              {!photoDrafts.length && (
                <div className="photo-empty-state">
                  <strong>{localization.admin_img_empty[lang]}</strong>
                  <span>{localization.admin_img_add_desc[lang]}</span>
                </div>
              )}

              <div className="photo-editor-list">
                {photoDrafts.map((photo, index) => {
                  const isLocalPhoto = photo.url.startsWith('data:image');
                  return (
                    <article className={photo.isMain ? 'photo-editor-item main-photo' : 'photo-editor-item'} key={`${index}-${photo.url.slice(0, 24)}`}>
                      <div className="photo-editor-layout">
                        <div
                          className={photo.url ? 'photo-editor-preview has-image' : 'photo-editor-preview'}
                          role={photo.url ? 'button' : undefined}
                          tabIndex={photo.url ? 0 : undefined}
                          title={photo.url ? localization.admin_img_zoom_desc[lang] : undefined}
                          onClick={() => photo.url && setPreviewPhoto(photo)}
                          onKeyDown={(event) => {
                            if (photo.url && (event.key === 'Enter' || event.key === ' ')) {
                              event.preventDefault();
                              setPreviewPhoto(photo);
                            }
                          }}
                        >
                          {photo.url ? <img src={previewImageUrl(photo.url)} alt={photo.caption || localization.admin_img_prev[lang]} /> : <span>{localization.admin_img_prev[lang]}</span>}
                          {photo.isMain && <em className="main-photo-ribbon">{localization.admin_img_main[lang]}</em>}
                          {photo.url && <strong className="photo-zoom-hint">🔍 {localization.admin_img_zoom[lang]}</strong>}
                        </div>
                        <div className="photo-editor-fields">
                          <label>
                            {localization.admin_img_url[lang]}
                            <input
                              value={isLocalPhoto ? '' : photo.url}
                              onChange={(event) => updatePhoto(index, { url: event.target.value })}
                              placeholder={isLocalPhoto ? localization.admin_img_local_desc1[lang] : 'https://photo-adress.jpg'}
                            />
                          </label>
                          {isLocalPhoto && <p className="local-photo-note">📷 {localization.admin_img_local_desc2[lang]}</p>}
                          <label className="file-picker">
                            <span>{localization.admin_img_local[lang]}</span>
                            <input type="file" accept="image/*" onChange={(event) => handleLocalPhoto(index, event)} />
                            <strong className="file-picker-control">📁 {localization.admin_img_comp[lang]}</strong>
                          </label>
                          <label>
                            {localization.admin_img_sign[lang]}
                            <input value={photo.caption ?? ''} onChange={(event) => updatePhoto(index, { caption: event.target.value })} placeholder="np. Widok na rynek" />
                          </label>
                          <div className="photo-source-grid">
                            <label>
                              {localization.admin_form_src[lang]}
                              <input value={photo.sourceLabel ?? ''} onChange={(event) => updatePhoto(index, { sourceLabel: event.target.value })} placeholder={localization.admin_form_srcdesc_pch[lang]} />
                            </label>
                            <label>
                              {localization.admin_form_srcdesc[lang]}
                              <input value={photo.sourceUrl ?? ''} onChange={(event) => updatePhoto(index, { sourceUrl: event.target.value })} placeholder={localization.admin_form_srcdesc_pch[lang]} />
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="photo-editor-actions">
                        <button type="button" className={photo.isMain ? 'favorite active' : 'favorite'} onClick={() => markMainPhoto(index)}>
                          {photo.isMain ? localization.admin_img_cta1[lang] : localization.admin_img_cta2[lang]}
                        </button>
                        <button type="button" className="danger" onClick={() => removePhoto(index)}>{localization.admin_delete[lang]}</button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <details className="advanced-json-editor">
                <summary>{localization.admin_json[lang]}</summary>
                <label>
                  {localization.admin_img_json[lang]}
                  <textarea className="code-area" value={form.photosText} onChange={(e) => setForm((current) => ({ ...current, photosText: e.target.value }))} rows={8} />
                </label>
                <p className="muted">{localization.admin_img_json_desc[lang]}</p>
              </details>
            </section>
            <label>{localization.admin_form_ff[lang]} ({localization.admin_lang_pl_sm[lang]})
              <textarea value={form.funFact} onChange={(e) => setForm((current) => ({ ...current, funFact: e.target.value }))} />
            </label>
            <label>{localization.admin_form_ff[lang]} ({localization.admin_lang_en_sm[lang]})
              <textarea value={form.funFact_en} onChange={(e) => setForm((current) => ({ ...current, funFact_en: e.target.value }))} />
            </label>
            <div className="card-actions">
              <button className="primary">{form.id ? localization.admin_form_save[lang] : localization.admin_plcs_add[lang]}</button>
              <button type="button" className="secondary" onClick={() => setForm(emptyForm)}>{localization.admin_clear[lang]}</button>
            </div>
          </form>

          {places && (
            <section className="admin-list">
              <h2>{localization.admin_db_objects[lang]}</h2>
              {places.pl.map((place, index) => {
                const placeLang = places.en[index]
                return (
                  <article key={place.id}>
                    <div><strong>{place.name}</strong><span>{categoryLabels[place.category]} • {place.slug}</span></div>
                    <div className="card-actions">
                      <button className="secondary" onClick={() => setForm(placeToForm(place, placeLang))}>{localization.admin_edit[lang]}</button>
                      <button className="danger" onClick={() => removePlace(place)}>{localization.admin_delete[lang]}</button>
                    </div>
                  </article>
                )
              })}
            </section>
          )}
        </section>
      )}

      {activeTab === 'routes' && (
        <section className="admin-layout itineraries-layout">
          <form className="admin-form" onSubmit={submitRoute}>
            <h2>{routeForm.id ? localization.admin_rout_edit[lang] : localization.admin_rout_new[lang]}</h2>

            <h3>{localization.admin_lang_pl[lang]}</h3>
            <div className="form-grid two">
              <label>
                {localization.admin_form_title[lang]}
                <input value={routeForm.title} onChange={(e) => setRouteForm((current) => ({ ...current, title: e.target.value, slug: current.id ? current.slug : slugify(e.target.value) }))} required />
              </label>
              <label>Slug URL<input value={routeForm.slug} onChange={(e) => setRouteForm((current) => ({ ...current, slug: e.target.value }))} required /></label>
              <label>
                {localization.admin_form_type[lang]}
                <select value={routeForm.type} onChange={(e) => setRouteForm((current) => ({ ...current, type: e.target.value as RouteForm['type'] }))}>
                  <option value="walking">{localization.admin_rout_type_walk[lang]}</option>
                  <option value="cycling">{localization.admin_rout_type_cycl[lang]}</option>
                  <option value="trail">{localization.admin_rout_type_hike[lang]}</option>
                </select>
              </label>
              <label>
                {localization.admin_rout_diff[lang]}
                <select value={routeForm.difficulty} onChange={(e) => setRouteForm((current) => ({ ...current, difficulty: e.target.value as RouteForm['difficulty'] }))}>
                  <option value="łatwa">{localization.admin_diff_easy[lang]}</option>
                  <option value="średnia">{localization.admin_diff_med[lang]}</option>
                  <option value="trudna">{localization.admin_diff_hard[lang]}</option>
                </select>
              </label>
              <label>{localization.admin_rout_dist[lang]}<input value={routeForm.distanceKm} onChange={(e) => setRouteForm((current) => ({ ...current, distanceKm: e.target.value }))} required /></label>
              <label>{localization.admin_rout_time[lang]}<input value={routeForm.duration} onChange={(e) => setRouteForm((current) => ({ ...current, duration: e.target.value }))} required /></label>
              <label>{localization.admin_form_srcname[lang]}<input value={routeForm.sourceLabel} onChange={(e) => setRouteForm((current) => ({ ...current, sourceLabel: e.target.value }))} required /></label>
              <label>{localization.admin_form_srcurl[lang]}<input value={routeForm.sourceUrl} onChange={(e) => setRouteForm((current) => ({ ...current, sourceUrl: e.target.value }))} required /></label>
            </div>
            <label>{localization.admin_rout_desc[lang]}<textarea value={routeForm.description} onChange={(e) => setRouteForm((current) => ({ ...current, description: e.target.value }))} required rows={4} /></label>
            
            <h3>{localization.admin_lang_en[lang]}</h3>
            <div className="form-grid two">
              <label>
                {localization.admin_form_title[lang]} ({localization.admin_lang_en_sm[lang]})
                <input value={routeForm.title_en} onChange={(e) => setRouteForm((current) => ({ ...current, title_en: e.target.value, slug: current.id ? current.slug : slugify(e.target.value) }))} required />
              </label>
              <label>{localization.admin_rout_time[lang]} ({localization.admin_lang_en_sm[lang]})
                <input value={routeForm.duration_en} onChange={(e) => setRouteForm((current) => ({ ...current, duration_en: e.target.value }))} required />
              </label>
            </div>
            <label>{localization.admin_rout_desc[lang]} ({localization.admin_lang_en_sm[lang]})
              <textarea value={routeForm.description_en} onChange={(e) => setRouteForm((current) => ({ ...current, description_en: e.target.value }))} required rows={4} />
            </label>
            
            <section className="friendly-structured-editor">
              <div className="photo-editor-header">
                <div>
                  <h3>{localization.admin_rout_pnts[lang]}</h3>
                  <p className="muted">{localization.admin_rout_pnts_desc[lang]}</p>
                </div>
                <button type="button" className="secondary" onClick={addRoutePoint}>+ {localization.admin_pnts_add_emp[lang]}</button>
              </div>
              <div className="quick-add-row">
                <label>
                  {localization.admin_pnts_add_ex[lang]}
                  <select value={routePlaceSlug || places?.pl[0]?.slug || ''} onChange={(event) => setRoutePlaceSlug(event.target.value)}>
                    {places?.pl.map((place) => <option key={place.slug} value={place.slug}>{place.name}</option>)}
                  </select>
                </label>
                <button type="button" className="primary" onClick={addRoutePointFromPlace}>{localization.admin_pnts_add[lang]}</button>
              </div>
              <div className="structured-list">
                {routePointDrafts.map((point, index) => (
                  <article className="structured-item" key={`${index}`}>
                    <span className="item-index">{index + 1}</span>
                    <div className="structured-fields">
                      <label>{localization.admin_pnts_name[lang]} ({localization.admin_lang_pl_sm[lang]})
                        <input value={point.name_pl} onChange={(event) => updateRoutePoint(index, { name_pl: event.target.value })} />
                      </label>
                      <label>{localization.admin_pnts_name[lang]} ({localization.admin_lang_en_sm[lang]})
                        <input value={point.name_en} onChange={(event) => updateRoutePoint(index, { name_en: event.target.value })} />
                      </label>
                      <div className="form-grid two">
                        <label>{localization.admin_form_geola[lang]}<input value={point.latitude} onChange={(event) => updateRoutePoint(index, { latitude: Number(event.target.value) })} /></label>
                        <label>{localization.admin_form_geolo[lang]}<input value={point.longitude} onChange={(event) => updateRoutePoint(index, { longitude: Number(event.target.value) })} /></label>
                      </div>
                    </div>
                    <button type="button" className="danger" onClick={() => removeRoutePoint(index)}>{localization.admin_delete[lang]}</button>
                  </article>
                ))}
              </div>
              <details className="advanced-json-editor">
                <summary>{localization.admin_json[lang]}</summary>
                <label>
                  {localization.admin_pnts_json[lang]}
                  <textarea className="code-area" value={routeForm.pointsText} onChange={(e) => setRouteForm((current) => ({ ...current, pointsText: e.target.value }))} required rows={10} />
                </label>
              </details>
            </section>
            <div className="card-actions">
              <button className="primary">{routeForm.id ? localization.admin_rout_save[lang] : localization.admin_rout_add[lang]}</button>
              <button type="button" className="secondary" onClick={() => setRouteForm(emptyRouteForm)}>{localization.admin_clear[lang]}</button>
            </div>
          </form>

          {routes && (
            <section className="admin-list">
              <h2>{localization.admin_rout_db[lang]}</h2>
              {routes.pl.map((route, index) => {
                const routeLang = routes.en[index]
                return (
                  <article key={route.id}>
                    <div><strong>{route.title}</strong><span>{route.distanceKm} km • {route.duration} • {route.slug}</span></div>
                    <div className="card-actions">
                      <button className="secondary" onClick={() => setRouteForm(routeToForm(route, routeLang))}>{localization.admin_edit[lang]}</button>
                      <button className="danger" onClick={() => removeRoute(route)}>{localization.admin_delete[lang]}</button>
                    </div>
                  </article>
                )
              })}
            </section>
          )}
        </section>
      )}

      {activeTab === 'itineraries' && (
        <section className="admin-layout">
          <form className="admin-form" onSubmit={submitItinerary}>
            <h2>{itineraryForm.id ? localization.admin_trip_edit[lang] : localization.admin_trip_new[lang]}</h2>

            <h3>{localization.admin_lang_pl[lang]}</h3>
            <div className="form-grid two">
              <label>
                {localization.admin_form_title[lang]}
                <input value={itineraryForm.title} onChange={(e) => setItineraryForm((current) => ({ ...current, title: e.target.value, slug: current.id ? current.slug : slugify(e.target.value) }))} required />
              </label>
              <label>Slug URL<input value={itineraryForm.slug} onChange={(e) => setItineraryForm((current) => ({ ...current, slug: e.target.value }))} required /></label>
              <label>
                {localization.admin_trip_type[lang]}
                <select value={itineraryForm.type} onChange={(e) => setItineraryForm((current) => ({ ...current, type: e.target.value as ItineraryForm['type'] }))}>
                  <option value="one_day">{localization.admin_trip_day1[lang]}</option>
                  <option value="two_day">{localization.admin_trip_day2[lang]}</option>
                </select>
              </label>
            </div>
            <label>{localization.admin_trip_desc[lang]}<textarea value={itineraryForm.description} onChange={(e) => setItineraryForm((current) => ({ ...current, description: e.target.value }))} required rows={4} /></label>
            
            <h3>{localization.admin_lang_en[lang]}</h3>
            <label> {localization.admin_form_title[lang]} ({localization.admin_lang_en_sm[lang]})
              <input value={itineraryForm.title_en} onChange={(e) => setItineraryForm((current) => ({ ...current, title_en: e.target.value, slug: current.id ? current.slug : slugify(e.target.value) }))} required />
            </label>
            <label>{localization.admin_trip_desc[lang]} ({localization.admin_lang_en_sm[lang]})
              <textarea value={itineraryForm.description_en} onChange={(e) => setItineraryForm((current) => ({ ...current, description_en: e.target.value }))} required rows={4} />
            </label>
            
            <section className="friendly-structured-editor">
              <div className="photo-editor-header">
                <div>
                  <h3>{localization.admin_trip_prog[lang]}</h3>
                  <p className="muted">{localization.admin_trip_edit_desc[lang]}</p>
                </div>
                <button type="button" className="secondary" onClick={addItineraryDay}>+ {localization.admin_day_add[lang]}</button>
              </div>
              <div className="itinerary-day-editor-list">
                {itineraryDayDrafts.map((dayItem, dayIndex) => (
                  <article className="itinerary-day-editor" key={`${dayIndex}`}>
                    <div className="day-editor-heading">
                      <span className="day-label">{localization.admin_day[lang]} {dayItem.day}</span>
                      <button type="button" className="danger" onClick={() => removeItineraryDay(dayIndex)}>{localization.admin_day_del[lang]}</button>
                    </div>
                    <div className="form-grid two">
                      <label>{localization.admin_day_nr[lang]}<input value={dayItem.day} onChange={(event) => updateItineraryDay(dayIndex, { day: Number(event.target.value) })} /></label>
                      <label>{localization.admin_day_ttl[lang]}<input value={dayItem.title_pl} onChange={(event) => updateItineraryDay(dayIndex, { title_pl: event.target.value })} /></label>
                      <label>{localization.admin_day_ttl[lang]} ({localization.admin_lang_en_sm[lang]})<input value={dayItem.title_en} onChange={(event) => updateItineraryDay(dayIndex, { title_en: event.target.value })} /></label>
                    </div>
                    <label>{localization.admin_day_sum[lang]}<textarea value={dayItem.summary_pl} onChange={(event) => updateItineraryDay(dayIndex, { summary_pl: event.target.value })} rows={2} /></label>
                    <label>{localization.admin_day_sum[lang]} ({localization.admin_lang_en_sm[lang]})<textarea value={dayItem.summary_en} onChange={(event) => updateItineraryDay(dayIndex, { summary_en: event.target.value })} rows={2} /></label>
                    <div className="day-items-list">
                      {dayItem.items.map((entry, itemIndex) => (
                        <article className="day-item-editor" key={`${dayIndex}-${itemIndex}`}>
                          <div className="form-grid two">
                            <label>{localization.admin_form_hour[lang]}<input value={entry.time} onChange={(event) => updateItineraryItem(dayIndex, itemIndex, { time: event.target.value })} /></label>
                            <label>{localization.admin_pnt_ttl[lang]}<input value={entry.title_pl} onChange={(event) => updateItineraryItem(dayIndex, itemIndex, { title_pl: event.target.value })} /></label>
                            <label>{localization.admin_pnt_ttl[lang]} ({localization.admin_lang_en_sm[lang]})<input value={entry.title_en} onChange={(event) => updateItineraryItem(dayIndex, itemIndex, { title_en: event.target.value })} /></label>
                          </div>
                          <label>{localization.admin_pnt_desc[lang]}<textarea value={entry.description_pl} onChange={(event) => updateItineraryItem(dayIndex, itemIndex, { description_pl: event.target.value })} rows={2} /></label>
                          <label>{localization.admin_pnt_desc[lang]} ({localization.admin_lang_en_sm[lang]})<textarea value={entry.description_en} onChange={(event) => updateItineraryItem(dayIndex, itemIndex, { description_en: event.target.value })} rows={2} /></label>
                          <div className="form-grid two">
                            <label>
                              {localization.admin_pnt_rel[lang]}
                              <select value={entry.placeSlug ?? ''} onChange={(event) => updateItineraryItem(dayIndex, itemIndex, { placeSlug: event.target.value || undefined })}>
                                <option value="">{localization.admin_pnt_norel[lang]}</option>
                                {places?.pl.map((place) => <option key={place.slug} value={place.slug}>{place.name}</option>)}
                              </select>
                            </label>
                            <label>
                              {localization.admin_form_act[lang]}
                              <button type="button" className="danger" onClick={() => removeItineraryItem(dayIndex, itemIndex)}>{localization.admin_pnt_del[lang]}</button>
                            </label>
                          </div>
                        </article>
                      ))}
                    </div>
                    <button type="button" className="secondary" onClick={() => addItineraryItem(dayIndex)}>+ {localization.admin_prog_add[lang]}</button>
                  </article>
                ))}
              </div>
              <details className="advanced-json-editor">
                <summary>{localization.admin_json[lang]}</summary>
                <label>
                  {localization.admin_prog_json[lang]}
                  <textarea className="code-area" value={itineraryForm.daysText} onChange={(e) => setItineraryForm((current) => ({ ...current, daysText: e.target.value }))} required rows={14} />
                </label>
              </details>
            </section>
            <div className="card-actions">
              <button className="primary">{itineraryForm.id ? localization.admin_trip_save[lang] : localization.admin_trip_add[lang]}</button>
              <button type="button" className="secondary" onClick={() => setItineraryForm(emptyItineraryForm)}>{localization.admin_clear[lang]}</button>
            </div>
          </form>

          {itineraries && (
            <section className="admin-list">
              <h2>{localization.admin_trip_plans[lang]}</h2>
              {itineraries.pl.map((itinerary, index) => {
                const itineraryLang = itineraries.en[index];
                return (
                  <article key={itinerary.id}>
                    <div><strong>{itinerary.title}</strong><span>{itinerary.type === 'one_day' ? localization.admin_trip_day1[lang] : localization.admin_trip_day2[lang]} • {itinerary.slug}</span></div>
                    <div className="card-actions">
                      <button className="secondary" onClick={() => setItineraryForm(itineraryToForm(itinerary, itineraryLang))}>{localization.admin_edit[lang]}</button>
                      <button className="danger" onClick={() => removeItinerary(itinerary)}>{localization.admin_delete[lang]}</button>
                    </div>
                  </article>
                )
              })}
            </section>
          )}
        </section>
      )}

      {activeTab === 'accounts' && isAdmin && (
        <section className="admin-layout accounts-layout">
          <form className="admin-form" onSubmit={submitAccount}>
            <h2>{localization.admin_acc_new[lang]}</h2>
            <p className="muted">{localization.admin_acc_desc[lang]}</p>
            <label>
              E-mail
              <input type="email" value={accountForm.email} onChange={(event) => setAccountForm((current) => ({ ...current, email: event.target.value }))} required />
            </label>
            <label>
              {localization.admin_acc_pass_strt[lang]}
              <input type="password" value={accountForm.password} onChange={(event) => setAccountForm((current) => ({ ...current, password: event.target.value }))} minLength={6} required />
            </label>
            <label>
              {localization.admin_acc_role[lang]}
              <select value={accountForm.role} onChange={(event) => setAccountForm((current) => ({ ...current, role: event.target.value as User['role'] }))}>
                <option value="user">{localization.prof_role_user[lang]}</option>
                <option value="moderator">{localization.prof_role_mod[lang]}</option>
                <option value="admin">{localization.prof_role_admin[lang]}</option>
              </select>
            </label>
            <button className="primary">{localization.admin_acc_add[lang]}</button>
          </form>

          <section className="admin-list accounts-list">
            <h2>{localization.admin_acc_sys[lang]}</h2>
            {accounts.map((account) => (
              <article className="account-card" key={account.id}>
                <div className="account-info">
                  <strong>{account.email}</strong>
                  <span>{roleLabel(account.role, lang)} • {localization.admin_acc_crt[lang]} {new Date(account.createdAt).toLocaleString('pl-PL')}</span>
                </div>
                <div className="account-controls">
                  <label>
                    {localization.admin_acc_role[lang]}
                    <select value={account.role} onChange={(event) => updateAccountRole(account, event.target.value as User['role'])} disabled={account.id === user?.id}>
                      <option value="user">{localization.prof_role_user[lang]}</option>
                      <option value="moderator">{localization.prof_role_mod[lang]}</option>
                      <option value="admin">{localization.prof_role_admin[lang]}</option>
                    </select>
                  </label>
                  <label>
                    {localization.admin_acc_pass_new[lang]}
                    <input
                      type="password"
                      value={passwordDrafts[account.id] ?? ''}
                      onChange={(event) => setPasswordDrafts((current) => ({ ...current, [account.id]: event.target.value }))}
                      placeholder={localization.admin_acc_pass_vld[lang]}
                    />
                  </label>
                  <div className="account-actions">
                    <button type="button" className="secondary" onClick={() => resetAccountPassword(account)}>{localization.admin_acc_pass_rst[lang]}</button>
                    <button type="button" className="danger" onClick={() => removeAccount(account)} disabled={account.id === user?.id}>{localization.admin_delete[lang]}</button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </section>
      )}

      {previewPhoto && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={() => setPreviewPhoto(null)}>
          <section className="dialog image-preview-dialog" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <button className="dialog-close" onClick={() => setPreviewPhoto(null)} aria-label={localization.admin_prev_close[lang]}>
              ×
            </button>
            <img src={previewImageUrl(previewPhoto.url)} alt={previewPhoto.caption || localization.admin_img_zoom_lg[lang]} />
            <div className="image-preview-caption">
              <strong>{previewPhoto.caption || localization.admin_img_plc[lang]}</strong>
              {(previewPhoto.sourceLabel || previewPhoto.sourceUrl) && (
                <span>
                  {localization.admin_form_src[lang]}: {previewPhoto.sourceLabel || 'brak opisu'} {previewPhoto.sourceUrl ? `— ${previewPhoto.sourceUrl}` : ''}
                </span>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function placeToForm(place: Place, placeLang: PlaceLang): AdminForm {
  return {
    id: place.id,
    name: place.name,
    slug: place.slug,
    category: place.category,
    shortDescription: place.shortDescription,
    description: place.description,
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    address: place.address ?? '',
    openingHours: place.openingHours ?? '',
    ticketInfo: place.ticketInfo ?? '',
    website: place.website ?? '',
    phone: place.phone ?? '',
    imageUrl: place.imageUrl ?? '',
    sourceLabel: place.sourceLabel,
    sourceUrl: place.sourceUrl,
    tags: place.tags.join(', '),
    photosText: JSON.stringify(
      place.photos.length
        ? place.photos.map((photo) => ({
            url: photo.url,
            caption: photo.caption ?? '',
            sourceLabel: photo.sourceLabel ?? place.sourceLabel,
            sourceUrl: photo.sourceUrl ?? place.sourceUrl,
            isMain: Boolean(photo.isMain)
          }))
        : [
            {
              url: place.imageUrl ?? '',
              caption: place.name,
              sourceLabel: place.sourceLabel,
              sourceUrl: place.sourceUrl,
              isMain: true
            }
          ],
      null,
      2
    ),
    funFact: place.funFact ?? '',
    isFeatured: place.isFeatured,

    // Place_en do zrobienia
    name_en: placeLang.name,
    shortDescription_en: placeLang.shortDescription,
    description_en: placeLang.description,
    openingHours_en: placeLang.openingHours ?? '',
    ticketInfo_en: placeLang.openingHours ?? '',
    tags_en: placeLang.tags.join(', '),
    funFact_en: placeLang.funFact ?? ''
  };
}

function formToPayload(form: AdminForm, placeId: number, lang: LanguageCode): PlaceGroup {
  const photos = parseJson<Place['photos']>(form.photosText, localization.admin_img_json_warn[lang]);
  return {
    pl: {
      id: placeId,
      name: form.name,
      slug: form.slug,
      category: form.category,
      shortDescription: form.shortDescription,
      description: form.description,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      address: form.address,
      openingHours: form.openingHours,
      ticketInfo: form.ticketInfo,
      website: form.website,
      phone: form.phone,
      imageUrl: form.imageUrl,
      sourceLabel: form.sourceLabel,
      sourceUrl: form.sourceUrl,
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      photos: Array.isArray(photos) ? photos : [],
      funFact: form.funFact,
      isFeatured: form.isFeatured
    },
    en: {
      id: placeId,
      name: form.name_en,
      shortDescription: form.shortDescription_en,
      description: form.description_en,
      openingHours: form.openingHours_en,
      ticketInfo: form.ticketInfo_en,
      tags: form.tags_en.split(',').map((tag) => tag.trim()).filter(Boolean),
      funFact: form.funFact_en
    }
  };
}

function parsePhotosForEditor(value: string): PlacePhoto[] {
  try {
    const parsed = JSON.parse(value) as PlacePhoto[];
    return Array.isArray(parsed) ? normalizePhotoDrafts(parsed) : [];
  } catch {
    return [];
  }
}

function normalizePhotoDrafts(photos: PlacePhoto[]): PlacePhoto[] {
  const cleaned = photos.map((photo, index) => ({
    url: photo.url ?? '',
    caption: photo.caption ?? '',
    sourceLabel: photo.sourceLabel ?? '',
    sourceUrl: photo.sourceUrl ?? '',
    isMain: Boolean(photo.isMain) || index === 0 && !photos.some((item) => item.isMain)
  }));

  if (cleaned.length && !cleaned.some((photo) => photo.isMain)) {
    cleaned[0].isMain = true;
  }

  return cleaned;
}

function parseRoutePointsForEditor(valuePl: string, valueEn: string): RoutePointLang[] {
  try {
    if (!valuePl || valuePl === "" || !valueEn || valueEn === "") return [];
    const parsedPl = JSON.parse(valuePl) as RoutePoint[];
    const parsedEn = JSON.parse(valueEn) as RoutePoint[];

    return Array.isArray(parsedPl || parsedEn) ? groupRoutePointDrafts(parsedPl, parsedEn) : [];
  } catch (err) {
    console.error("Błąd z punktami trasy: ", err);
    return [];
  }
}

function normalizeRoutePointDrafts(points: RoutePointLang[]): RoutePointLang[] {
  return points.map((point) => ({
    name_pl: String(point.name_pl ?? ''),
    name_en: String(point.name_en ?? ''),
    latitude: Number.isFinite(Number(point.latitude)) ? Number(point.latitude) : 0,
    longitude: Number.isFinite(Number(point.longitude)) ? Number(point.longitude) : 0
  }));
}

function groupRoutePointDrafts(pointsPl: RoutePoint[], pointsEn: RoutePoint[]): RoutePointLang[] {
  return pointsPl.map((point, index) => {
    const pointEn = pointsEn[index];
    return ({
      name_pl: String(point.name ?? ''),
      name_en: String(pointEn.name ?? ''),
      latitude: Number.isFinite(Number(point.latitude)) ? Number(point.latitude) : 0,
      longitude: Number.isFinite(Number(point.longitude)) ? Number(point.longitude) : 0
    })
  });
}

function normalizeRoutePointDraftsPl(points: RoutePointLang[]): RoutePoint[] {
  return points.map((point) => ({
    name: String(point.name_pl ?? ''),
    latitude: Number.isFinite(Number(point.latitude)) ? Number(point.latitude) : 0,
    longitude: Number.isFinite(Number(point.longitude)) ? Number(point.longitude) : 0
  }));
}

function normalizeRoutePointDraftsEn(points: RoutePointLang[]): RoutePoint[] {
  return points.map((point) => ({
    name: String(point.name_en ?? ''),
    latitude: Number.isFinite(Number(point.latitude)) ? Number(point.latitude) : 0,
    longitude: Number.isFinite(Number(point.longitude)) ? Number(point.longitude) : 0
  }));
}

function routeToForm(route: TouristRoute, routeLang: TouristRouteLang): RouteForm {
  return {
    id: route.id,
    title: route.title,
    slug: route.slug,
    type: route.type,
    distanceKm: String(route.distanceKm),
    duration: route.duration,
    difficulty: route.difficulty as RouteForm['difficulty'],
    description: route.description,
    pointsText: JSON.stringify(route.points, null, 2),
    sourceLabel: route.sourceLabel,
    sourceUrl: route.sourceUrl,

    title_en: routeLang.title,
    duration_en: routeLang.duration,
    description_en: routeLang.description,
    pointsText_en: JSON.stringify(routeLang.points, null, 2)
  };
}

function routeFormToPayload(form: RouteForm, routeId: number, lang: LanguageCode): RouteGroup {
  const pointsPl = parseJson<RoutePoint[]>(form.pointsText, localization.admin_pnts_json_warn[lang]);
  const pointsEn = parseJson<RoutePoint[]>(form.pointsText_en, localization.admin_pnts_json_warn[lang]);
  if ((!Array.isArray(pointsPl) || pointsPl.length < 2) 
    || (!Array.isArray(pointsEn) || pointsEn.length < 2) ) {
    throw new Error(localization.admin_pnts_min_warn[lang]);
  }

  return {
    pl: {
      id: routeId,
      title: form.title,
      slug: form.slug,
      type: form.type,
      distanceKm: Number(form.distanceKm),
      duration: form.duration,
      difficulty: form.difficulty,
      description: form.description,
      points: pointsPl,
      sourceLabel: form.sourceLabel,
      sourceUrl: form.sourceUrl
    },
    en: {
      route_id: routeId,
      title: form.title_en,
      duration: form.duration_en,
      description: form.description_en,
      points: pointsEn,
    }

  };
}

function itineraryToForm(itinerary: Itinerary, itineraryLang: ItineraryLang): ItineraryForm {
  return {
    id: itinerary.id,
    title: itinerary.title,
    slug: itinerary.slug,
    type: itinerary.type,
    description: itinerary.description,
    daysText: JSON.stringify(itinerary.days, null, 2),

    title_en: itineraryLang.title,
    description_en: itineraryLang.description,
    daysText_en: JSON.stringify(itineraryLang.days, null, 2),
  };
}

function parseItineraryDaysForEditor(valuePl: string, valueEn: string): ItineraryDayLang[] {
  try {
    const parsedPl = JSON.parse(valuePl) as ItineraryDay[];
    const parsedEn = JSON.parse(valueEn) as ItineraryDay[];
    return (Array.isArray(parsedPl) || Array.isArray(parsedEn)) ? normalizeItineraryDayDrafts(parsedPl, parsedEn) : [];
  } catch {
    return [];
  }
}

function normalizeItineraryDayDrafts(daysPl: ItineraryDay[], daysEn: ItineraryDay[]): ItineraryDayLang[] {
  return daysPl.map((dayItem, index) => {
    const dayItemEn = daysEn[index];
    return ({
      day: Number.isFinite(Number(dayItem.day)) ? Number(dayItem.day) : index + 1,
      title_pl: String(dayItem.title ?? 'Dzień ${index + 1}'),
      summary_pl: String(dayItem.summary ?? ''),
      title_en: String(dayItemEn.title ?? 'Day ${index + 1}'),
      summary_en: String(dayItemEn.summary ?? ''),
      items: Array.isArray(dayItem.items)
        ? dayItem.items.map((entry, index) => {
          const entryEn = dayItemEn.items[index];
          return ({
            time: String(entry.time ?? ''),
            title_pl: String(entry.title ?? ''),
            description_pl: String(entry.description ?? ''),
            title_en: String(entryEn.title ?? ''),
            description_en: String(entryEn.description ?? ''),
            placeSlug: entry.placeSlug ? String(entry.placeSlug) : undefined
          })
        })
        : []
    })
  });
}

function normalizeItineraryDayDraftsPl(days: ItineraryDayLang[]): ItineraryDay[] {
  return days.map((dayItem, index) => ({
    day: Number.isFinite(Number(dayItem.day)) ? Number(dayItem.day) : index + 1,
    title: String(dayItem.title_pl ?? 'Dzień ${index + 1}'),
    summary: String(dayItem.summary_pl ?? ''),
    items: Array.isArray(dayItem.items)
      ? dayItem.items.map((entry, index) => ({
          time: String(entry.time ?? ''),
          title: String(entry.title_pl ?? ''),
          description: String(entry.description_pl ?? ''),
          placeSlug: entry.placeSlug ? String(entry.placeSlug) : undefined
        })
      )
      : []
  }));
}

function normalizeItineraryDayDraftsEn(days: ItineraryDayLang[]): ItineraryDay[] {
  return days.map((dayItem, index) => ({
    day: Number.isFinite(Number(dayItem.day)) ? Number(dayItem.day) : index + 1,
    title: String(dayItem.title_en ?? 'Day ${index + 1}'),
    summary: String(dayItem.summary_en ?? ''),
    items: Array.isArray(dayItem.items)
      ? dayItem.items.map((entry, index) => ({
          time: String(entry.time ?? ''),
          title: String(entry.title_en ?? ''),
          description: String(entry.description_en ?? ''),
          placeSlug: entry.placeSlug ? String(entry.placeSlug) : undefined
        })
      )
      : []
  }));
}

function roleLabel(role: User['role'], lang: LanguageCode) {
  const labels: Record<User['role'], string> = {
    admin: localization.prof_role_admin[lang],
    moderator: localization.prof_role_mod[lang],
    user: localization.prof_role_user[lang]
  };
  return labels[role];
}

function previewImageUrl(url: string) {
  if (!url.startsWith('http')) return url;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('images.unsplash.com')) {
      if (parsed.searchParams.get('fit') === 'crop') {
        parsed.searchParams.set('fit', 'max');
      }
      parsed.searchParams.delete('crop');
      parsed.searchParams.delete('h');
      return parsed.toString();
    }
  } catch {
    return url;
  }
  return url;
}

function adminLoadingSkeleton(lang: LanguageCode) {
  return (
    <section className="admin-loading-panel" aria-label={localization.admin_load_lg[lang]}>
      <div className="admin-loading-header">
        <span className="loader-dot" />
        <div>
          <h2>{localization.admin_load_sm[lang]}</h2>
          <p>{localization.admin_load_desc[lang]}</p>
        </div>
      </div>
      <div className="admin-loading-grid">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
      <div className="admin-loading-content">
        <div className="skeleton-block large" />
        <div className="skeleton-block" />
      </div>
    </section>
  );
}

function itineraryFormToPayload(form: ItineraryForm, itinId: number, lang: LanguageCode): ItineraryGroup {
  const daysPl = parseJson<ItineraryDay[]>(form.daysText, localization.admin_trip_json_warn[lang]);
  const daysEn = parseJson<ItineraryDay[]>(form.daysText_en, localization.admin_trip_json_warn[lang]);
  if ((!Array.isArray(daysPl) || daysPl.length === 0)
    || (!Array.isArray(daysEn) || daysEn.length === 0)) {
    throw new Error(localization.admin_trip_min_warn[lang]);
  }

  return {
    pl: {
      id: itinId,
      title: form.title,
      slug: form.slug,
      type: form.type,
      description: form.description,
      days: daysPl
    },
    en: {
      itin_id: itinId,
      title: form.title_en,
      description: form.description_en,
      days: daysEn
    }
  };
}

function parseJson<T>(value: string, message: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(message);
  }
}
