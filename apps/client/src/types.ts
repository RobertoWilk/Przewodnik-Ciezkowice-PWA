export type ViewName =
  | 'home'
  | 'map'
  | 'nearby'
  | 'places'
  | 'place'
  | 'gallery'
  | 'planner'
  | 'itineraries'
  | 'history'
  | 'sources'
  | 'profile'
  | 'settings'
  | 'tests'
  | 'admin';

export type PlaceCategory =
  | 'attraction'
  | 'monument'
  | 'nature'
  | 'museum'
  | 'restaurant'
  | 'lodging'
  | 'viewpoint'
  | 'history';

export interface Place {
  id: number;
  slug: string;
  name: string;
  category: PlaceCategory;
  shortDescription: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  openingHours?: string | null;
  ticketInfo?: string | null;
  website?: string | null;
  phone?: string | null;
  imageUrl?: string | null;
  sourceLabel: string;
  sourceUrl: string;
  tags: string[];
  isFeatured: boolean;
  funFact?: string | null;
  photos: PlacePhoto[];
}

export interface PlaceLang {
  id: number;
  name: string;
  shortDescription: string;
  description: string;
  openingHours?: string | null;
  ticketInfo?: string | null;
  tags: string[];
  funFact?: string | null;
}

export interface PlaceGroup {
  pl: Place;
  en: PlaceLang;
}

export interface PlacesGroup {
  pl: Place[];
  en: PlaceLang[];
}

export interface PlacePhoto {
  id?: number;
  placeId?: number;
  url: string;
  caption?: string | null;
  sourceLabel?: string | null;
  sourceUrl?: string | null;
  isMain?: boolean;
  createdAt?: string;
}

export interface CategoryStat {
  category: PlaceCategory;
  label: string;
  count: number;
}

export interface RoutePoint {
  name: string;
  latitude: number;
  longitude: number;
}

export interface RoutePointLang {
  name_pl: string;
  name_en: string;
  latitude: number;
  longitude: number;
}

export interface RoutesLang {
  pl: TouristRoute[];
  en: TouristRouteLang[];
}

export interface RouteGroup {
  pl: TouristRoute;
  en: TouristRouteLang;
}

export interface TouristRoute {
  id: number;
  slug: string;
  title: string;
  type: 'walking' | 'cycling' | 'trail';
  distanceKm: number;
  duration: string;
  difficulty: string;
  description: string;
  points: RoutePoint[];
  sourceLabel: string;
  sourceUrl: string;
}

export interface TouristRouteLang {
  route_id: number;
  title: string;
  duration: string;
  description: string;
  points: RoutePoint[];
}

export interface ItineraryDay {
  day: number;
  title: string;
  summary: string;
  items: Array<{
    time: string;
    title: string;
    description: string;
    placeSlug?: string;
  }>;
}

export interface ItineraryDayLang {
  day: number;
  title_pl: string;
  summary_pl: string;
  title_en: string;
  summary_en: string;
  items: Array<{
    time: string;
    title_pl: string;
    description_pl: string;
    title_en: string;
    description_en: string;
    placeSlug?: string;
  }>;
}

export interface Itinerary {
  id: number;
  slug: string;
  title: string;
  type: 'one_day' | 'two_day';
  description: string;
  days: ItineraryDay[];
}

export interface ItineraryLang {
  itin_id: number;
  title: string;
  description: string;
  days: ItineraryDay[];
}

export interface ItinerariesGroup {
  pl: Itinerary[];
  en: ItineraryLang[];
}

export interface ItineraryGroup {
  pl: Itinerary;
  en: ItineraryLang;
}

export interface User {
  id: number;
  email: string;
  role: 'admin' | 'moderator' | 'user';
  createdAt: string;
}

export interface AuthResult {
  token: string;
  user: User;
}

export interface Stats {
  totalPlaces: number;
  totalRoutes: number;
  totalUsers: number;
  byCategory: CategoryStat[];
  projectTitle: string;
}

export interface SourceItem {
  sourceLabel: string;
  sourceUrl: string;
}

export interface AppSettings {
  appTitle: string;
  appSubtitle: string;
  contactEmail: string;
  contactPhone: string;
  englishEnabled: boolean;
}
