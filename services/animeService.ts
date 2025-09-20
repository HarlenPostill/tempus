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
  private async makeRequest(query: string, variables: any): Promise<any> {
    try {
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(`GraphQL error: ${data.errors[0].message}`);
      }

      return data;
    } catch (error) {
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