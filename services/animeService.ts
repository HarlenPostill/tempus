import { AniListResponse, Anime, SearchAnimeResponse, SearchFilters, SortOption } from '../types/anime';

const ANILIST_API_URL = 'https://graphql.anilist.co';

// GraphQL query for searching anime
const SEARCH_ANIME_QUERY = `
  query ($page: Int, $perPage: Int, $search: String, $genre_in: [String], $year: Int, $season: MediaSeason, $format: MediaFormat, $status: MediaStatus, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
        perPage
      }
      media(type: ANIME, search: $search, genre_in: $genre_in, seasonYear: $year, season: $season, format: $format, status: $status, sort: $sort) {
        id
        title {
          romaji
          english
          native
        }
        description
        coverImage {
          large
          medium
          color
        }
        bannerImage
        genres
        averageScore
        episodes
        duration
        status
        season
        seasonYear
        format
        studios {
          nodes {
            id
            name
          }
        }
        startDate {
          year
          month
          day
        }
        endDate {
          year
          month
          day
        }
        trailer {
          id
          site
        }
        tags {
          id
          name
          description
          rank
          isMediaSpoiler
          isGeneralSpoiler
        }
      }
    }
  }
`;

// GraphQL query for getting trending anime
const TRENDING_ANIME_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
        perPage
      }
      media(type: ANIME, sort: TRENDING_DESC) {
        id
        title {
          romaji
          english
          native
        }
        description
        coverImage {
          large
          medium
          color
        }
        bannerImage
        genres
        averageScore
        episodes
        duration
        status
        season
        seasonYear
        format
        studios {
          nodes {
            id
            name
          }
        }
        startDate {
          year
          month
          day
        }
        endDate {
          year
          month
          day
        }
        trailer {
          id
          site
        }
        tags {
          id
          name
          description
          rank
          isMediaSpoiler
          isGeneralSpoiler
        }
      }
    }
  }
`;

// GraphQL query for getting anime by ID
const GET_ANIME_BY_ID_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      description
      coverImage {
        large
        medium
        color
      }
      bannerImage
      genres
      averageScore
      episodes
      duration
      status
      season
      seasonYear
      format
      studios {
        nodes {
          id
          name
        }
      }
      startDate {
        year
        month
        day
      }
      endDate {
        year
        month
        day
      }
      trailer {
        id
        site
      }
      tags {
        id
        name
        description
        rank
        isMediaSpoiler
        isGeneralSpoiler
      }
    }
  }
`;

class AnimeService {
  private lastRequestTime = 0;
  private readonly minRequestInterval = 1200; // 1.2 seconds between requests
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes
  
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getCacheKey(query: string, variables: any): string {
    return `${query}_${JSON.stringify(variables)}`;
  }

  private getCachedData(cacheKey: string): any | null {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(cacheKey); // Remove expired cache
    }
    return null;
  }

  private setCachedData(cacheKey: string, data: any): void {
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
  }

  private async makeRequest(query: string, variables: any, retryCount = 0): Promise<any> {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(query, variables);
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        console.log('Using cached data for request');
        return cachedData;
      }

      // Rate limiting: ensure at least 1.2 seconds between requests
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.minRequestInterval) {
        await this.delay(this.minRequestInterval - timeSinceLastRequest);
      }
      
      this.lastRequestTime = Date.now();

      const response = await fetch(ANILIST_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables
        })
      });

      if (response.status === 429) {
        // Rate limit hit - retry after delay
        if (retryCount < 2) { // Reduced retries to be more conservative
          const delayTime = (retryCount + 1) * 3000; // Longer delays
          console.warn(`Rate limit hit, waiting ${delayTime/1000} seconds before retry...`);
          await this.delay(delayTime);
          return this.makeRequest(query, variables, retryCount + 1);
        } else {
          throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(`GraphQL error: ${data.errors[0].message}`);
      }

      // Cache successful responses
      this.setCachedData(cacheKey, data);
      
      return data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Rate limit')) {
        throw error; // Re-throw rate limit errors as-is
      }
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Search for anime with filters
  async searchAnime(
    page: number = 1,
    perPage: number = 20,
    filters: SearchFilters = {}
  ): Promise<SearchAnimeResponse> {
    const variables: any = {
      page,
      perPage,
      search: filters.search,
      genre_in: filters.genre,
      year: filters.year,
      season: filters.season,
      format: filters.format,
      status: filters.status,
      sort: filters.sort || [SortOption.POPULARITY_DESC]
    };

    // Remove undefined values
    Object.keys(variables).forEach(key => {
      if (variables[key] === undefined) {
        delete variables[key];
      }
    });

    return await this.makeRequest(SEARCH_ANIME_QUERY, variables);
  }

  // Get trending anime
  async getTrendingAnime(page: number = 1, perPage: number = 20): Promise<AniListResponse> {
    const variables = {
      page,
      perPage
    };

    return await this.makeRequest(TRENDING_ANIME_QUERY, variables);
  }

  // Get anime by ID
  async getAnimeById(id: number): Promise<{ data: { Media: Anime } }> {
    const variables = { id };
    return await this.makeRequest(GET_ANIME_BY_ID_QUERY, variables);
  }

  // Get popular anime
  async getPopularAnime(page: number = 1, perPage: number = 20): Promise<AniListResponse> {
    return await this.searchAnime(page, perPage, {
      sort: [SortOption.POPULARITY_DESC]
    });
  }

  // Get anime by genre
  async getAnimeByGenre(
    genre: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<SearchAnimeResponse> {
    return await this.searchAnime(page, perPage, {
      genre: [genre],
      sort: [SortOption.POPULARITY_DESC]
    });
  }

  // Get seasonal anime
  async getSeasonalAnime(
    year: number,
    season: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<SearchAnimeResponse> {
    return await this.searchAnime(page, perPage, {
      year,
      season: season as any,
      sort: [SortOption.POPULARITY_DESC]
    });
  }

  // Get top rated anime
  async getTopRatedAnime(page: number = 1, perPage: number = 20): Promise<SearchAnimeResponse> {
    return await this.searchAnime(page, perPage, {
      sort: [SortOption.SCORE_DESC]
    });
  }

  // Get upcoming anime
  async getUpcomingAnime(page: number = 1, perPage: number = 20): Promise<SearchAnimeResponse> {
    return await this.searchAnime(page, perPage, {
      status: 'NOT_YET_RELEASED' as any,
      sort: [SortOption.POPULARITY_DESC]
    });
  }

  // Get all available genres (static list from AniList)
  getAvailableGenres(): string[] {
    return [
      'Action',
      'Adventure',
      'Comedy',
      'Drama',
      'Ecchi',
      'Fantasy',
      'Horror',
      'Mahou Shoujo',
      'Mecha',
      'Music',
      'Mystery',
      'Psychological',
      'Romance',
      'Sci-Fi',
      'Slice of Life',
      'Sports',
      'Supernatural',
      'Thriller'
    ];
  }

  // Helper function to format anime description
  formatDescription(description?: string): string {
    if (!description) return 'No description available.';
    
    // Remove HTML tags and format
    return description
      .replace(/<[^>]*>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  // Helper function to get formatted title
  getFormattedTitle(anime: Anime): string {
    return anime.title.english || anime.title.romaji || anime.title.native;
  }

  // Helper function to get anime year
  getAnimeYear(anime: Anime): number | null {
    return anime.startDate?.year || anime.seasonYear || null;
  }

  // Helper function to check if anime is airing
  isAnimeAiring(anime: Anime): boolean {
    return anime.status === 'RELEASING';
  }
}

export default new AnimeService();