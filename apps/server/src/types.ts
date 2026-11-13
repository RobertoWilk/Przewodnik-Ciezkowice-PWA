export type PlaceCategory =
  | 'attraction'
  | 'monument'
  | 'nature'
  | 'museum'
  | 'restaurant'
  | 'lodging'
  | 'viewpoint'
  | 'history';

export interface PlaceInput {
  id: number;
  slug: string;
  name: string;
  category: PlaceCategory;
  shortDescription: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  openingHours?: string;
  ticketInfo?: string;
  website?: string;
  phone?: string;
  imageUrl?: string;
  sourceLabel: string;
  sourceUrl: string;
  tags: string[];
  isFeatured?: boolean;
  funFact?: string;
  photos?: PlacePhotoInput[];
}

export interface PlaceLangInput {
  id: number;
  name: string;
  shortDescription: string;
  description: string;
  openingHours?: string;
  ticketInfo?: string;
  tags: string[];
  funFact?: string;
}

export interface PlaceGroupInput {
  pl: PlaceInput;
  en: PlaceLangInput;
}

export interface PlacePhotoInput {
  url: string;
  caption?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  isMain?: boolean;
}

export interface RoutePoint {
  name: string;
  latitude: number;
  longitude: number;
}

export interface RouteInput {
  id: number;
  slug: string;
  title: string;
  type: 'walking' | 'cycling' | 'trail';
  distanceKm: number;
  duration: string;
  difficulty: 'łatwa' | 'średnia' | 'trudna';
  description: string;
  points: RoutePoint[];
  sourceLabel: string;
  sourceUrl: string;
}

export interface RouteLangInput {
  id: number;
  title: string;
  duration: string;
  description: string;
  points: RoutePoint[];
}

export interface RouteGroupInput {
  pl: RouteInput;
  en: RouteLangInput;
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

export interface ItineraryInput {
  id: number;
  slug: string;
  title: string;
  type: 'one_day' | 'two_day';
  description: string;
  days: ItineraryDay[];
}

export interface ItineraryLangInput {
  id: number;
  title: string;
  description: string;
  days: ItineraryDay[];
}

export interface ItineraryGroupInput {
  pl: ItineraryInput;
  en: ItineraryLangInput;
}

export interface AuthPayload {
  sub: number;
  email: string;
  role: 'admin' | 'moderator' | 'user';
}

export interface AppSettingsInput {
  appTitle?: string;
  appSubtitle?: string;
  contactEmail?: string;
  contactPhone?: string;
  englishEnabled?: boolean;
}
