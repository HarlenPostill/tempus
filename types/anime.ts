// Anime data models and types for AniList API

export interface Anime {
  id: number;
  title: {
    romaji: string;
    english?: string;
    native: string;
  };
  description?: string;
  coverImage: {
    large: string;
    medium: string;
    color?: string;
  };
  bannerImage?: string;
  genres: string[];
  averageScore?: number;
  episodes?: number;
  duration?: number;
  status: MediaStatus;
  season?: MediaSeason;
  seasonYear?: number;
  format: MediaFormat;
  studios: {
    nodes: Studio[];
  };
  startDate: {
    year?: number;
    month?: number;
    day?: number;
  };
  endDate: {
    year?: number;
    month?: number;
    day?: number;
  };
  trailer?: {
    id: string;
    site: string;
  };
  tags: MediaTag[];
}

export interface Studio {
  id: number;
  name: string;
}

export interface MediaTag {
  id: number;
  name: string;
  description?: string;
  rank?: number;
  isMediaSpoiler: boolean;
  isGeneralSpoiler: boolean;
}

export enum MediaStatus {
  FINISHED = 'FINISHED',
  RELEASING = 'RELEASING',
  NOT_YET_RELEASED = 'NOT_YET_RELEASED',
  CANCELLED = 'CANCELLED',
  HIATUS = 'HIATUS'
}

export enum MediaSeason {
  WINTER = 'WINTER',
  SPRING = 'SPRING',
  SUMMER = 'SUMMER',
  FALL = 'FALL'
}

export enum MediaFormat {
  TV = 'TV',
  TV_SHORT = 'TV_SHORT',
  MOVIE = 'MOVIE',
  SPECIAL = 'SPECIAL',
  OVA = 'OVA',
  ONA = 'ONA',
  MUSIC = 'MUSIC'
}

// Local storage models
export interface WatchlistItem {
  anime: Anime;
  dateAdded: string;
  notes?: string;
  watchStatus: WatchStatus;
}

export enum WatchStatus {
  PLAN_TO_WATCH = 'PLAN_TO_WATCH',
  WATCHING = 'WATCHING',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
  DROPPED = 'DROPPED'
}

export interface Watchlist {
  id: string;
  name: string;
  description?: string;
  items: WatchlistItem[];
  createdDate: string;
  updatedDate: string;
}

// API response types
export interface AniListResponse {
  data: {
    Page: {
      media: Anime[];
      pageInfo: {
        total: number;
        currentPage: number;
        lastPage: number;
        hasNextPage: boolean;
        perPage: number;
      };
    };
  };
}

export interface SearchAnimeResponse {
  data: {
    Page: {
      media: Anime[];
      pageInfo: {
        total: number;
        currentPage: number;
        lastPage: number;
        hasNextPage: boolean;
        perPage: number;
      };
    };
  };
}

// Search and filter types
export interface SearchFilters {
  search?: string;
  genre?: string[];
  year?: number;
  season?: MediaSeason;
  format?: MediaFormat;
  status?: MediaStatus;
  sort?: SortOption[];
}

export enum SortOption {
  TITLE_ROMAJI = 'TITLE_ROMAJI',
  TITLE_ENGLISH = 'TITLE_ENGLISH',
  SCORE_DESC = 'SCORE_DESC',
  POPULARITY_DESC = 'POPULARITY_DESC',
  TRENDING_DESC = 'TRENDING_DESC',
  START_DATE_DESC = 'START_DATE_DESC',
  EPISODES_DESC = 'EPISODES_DESC'
}