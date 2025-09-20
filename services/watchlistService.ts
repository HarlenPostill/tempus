import AsyncStorage from '@react-native-async-storage/async-storage';
import { Anime, Watchlist, WatchlistItem, WatchStatus } from '../types/anime';

const WATCHLISTS_KEY = 'tempus_watchlists';
const DEFAULT_LISTS_KEY = 'tempus_default_lists_created';

class WatchlistService {
  // Initialize default lists
  async initializeDefaultLists(): Promise<void> {
    try {
      const defaultListsCreated = await AsyncStorage.getItem(DEFAULT_LISTS_KEY);
      if (!defaultListsCreated) {
        const defaultLists: Watchlist[] = [
          {
            id: 'plan-to-watch',
            name: 'Plan to Watch',
            description: 'Anime you want to watch in the future',
            items: [],
            createdDate: new Date().toISOString(),
            updatedDate: new Date().toISOString()
          },
          {
            id: 'currently-watching',
            name: 'Currently Watching',
            description: 'Anime you are currently watching',
            items: [],
            createdDate: new Date().toISOString(),
            updatedDate: new Date().toISOString()
          },
          {
            id: 'completed',
            name: 'Completed',
            description: 'Anime you have finished watching',
            items: [],
            createdDate: new Date().toISOString(),
            updatedDate: new Date().toISOString()
          }
        ];

        await AsyncStorage.setItem(WATCHLISTS_KEY, JSON.stringify(defaultLists));
        await AsyncStorage.setItem(DEFAULT_LISTS_KEY, 'true');
      }
    } catch (error) {
      console.error('Failed to initialize default lists:', error);
    }
  }

  // Get all watchlists
  async getAllWatchlists(): Promise<Watchlist[]> {
    try {
      const lists = await AsyncStorage.getItem(WATCHLISTS_KEY);
      return lists ? JSON.parse(lists) : [];
    } catch (error) {
      console.error('Failed to get watchlists:', error);
      return [];
    }
  }

  // Get a specific watchlist by ID
  async getWatchlistById(id: string): Promise<Watchlist | null> {
    try {
      const lists = await this.getAllWatchlists();
      return lists.find(list => list.id === id) || null;
    } catch (error) {
      console.error('Failed to get watchlist by id:', error);
      return null;
    }
  }

  // Create a new watchlist
  async createWatchlist(name: string, description?: string): Promise<Watchlist> {
    try {
      const lists = await this.getAllWatchlists();
      const newList: Watchlist = {
        id: `custom-${Date.now()}`,
        name,
        description,
        items: [],
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString()
      };

      lists.push(newList);
      await AsyncStorage.setItem(WATCHLISTS_KEY, JSON.stringify(lists));
      return newList;
    } catch (error) {
      console.error('Failed to create watchlist:', error);
      throw error;
    }
  }

  // Add anime to watchlist
  async addAnimeToWatchlist(
    watchlistId: string, 
    anime: Anime, 
    watchStatus: WatchStatus = WatchStatus.PLAN_TO_WATCH,
    notes?: string
  ): Promise<void> {
    try {
      const lists = await this.getAllWatchlists();
      const listIndex = lists.findIndex(list => list.id === watchlistId);
      
      if (listIndex === -1) {
        throw new Error('Watchlist not found');
      }

      // Check if anime already exists in this list
      const existingIndex = lists[listIndex].items.findIndex(item => item.anime.id === anime.id);
      
      const watchlistItem: WatchlistItem = {
        anime,
        dateAdded: new Date().toISOString(),
        notes,
        watchStatus
      };

      if (existingIndex >= 0) {
        // Update existing item
        lists[listIndex].items[existingIndex] = watchlistItem;
      } else {
        // Add new item
        lists[listIndex].items.unshift(watchlistItem);
      }

      lists[listIndex].updatedDate = new Date().toISOString();
      await AsyncStorage.setItem(WATCHLISTS_KEY, JSON.stringify(lists));
    } catch (error) {
      console.error('Failed to add anime to watchlist:', error);
      throw error;
    }
  }

  // Remove anime from watchlist
  async removeAnimeFromWatchlist(watchlistId: string, animeId: number): Promise<void> {
    try {
      const lists = await this.getAllWatchlists();
      const listIndex = lists.findIndex(list => list.id === watchlistId);
      
      if (listIndex === -1) {
        throw new Error('Watchlist not found');
      }

      lists[listIndex].items = lists[listIndex].items.filter(item => item.anime.id !== animeId);
      lists[listIndex].updatedDate = new Date().toISOString();
      
      await AsyncStorage.setItem(WATCHLISTS_KEY, JSON.stringify(lists));
    } catch (error) {
      console.error('Failed to remove anime from watchlist:', error);
      throw error;
    }
  }

  // Check if anime exists in any watchlist
  async isAnimeInWatchlists(animeId: number): Promise<{ watchlistId: string; watchlistName: string }[]> {
    try {
      const lists = await this.getAllWatchlists();
      const result: { watchlistId: string; watchlistName: string }[] = [];
      
      lists.forEach(list => {
        const hasAnime = list.items.some(item => item.anime.id === animeId);
        if (hasAnime) {
          result.push({ watchlistId: list.id, watchlistName: list.name });
        }
      });
      
      return result;
    } catch (error) {
      console.error('Failed to check anime in watchlists:', error);
      return [];
    }
  }

  // Update watchlist item status
  async updateWatchlistItemStatus(
    watchlistId: string, 
    animeId: number, 
    newStatus: WatchStatus,
    notes?: string
  ): Promise<void> {
    try {
      const lists = await this.getAllWatchlists();
      const listIndex = lists.findIndex(list => list.id === watchlistId);
      
      if (listIndex === -1) {
        throw new Error('Watchlist not found');
      }

      const itemIndex = lists[listIndex].items.findIndex(item => item.anime.id === animeId);
      if (itemIndex >= 0) {
        lists[listIndex].items[itemIndex].watchStatus = newStatus;
        if (notes !== undefined) {
          lists[listIndex].items[itemIndex].notes = notes;
        }
        lists[listIndex].updatedDate = new Date().toISOString();
        
        await AsyncStorage.setItem(WATCHLISTS_KEY, JSON.stringify(lists));
      }
    } catch (error) {
      console.error('Failed to update watchlist item status:', error);
      throw error;
    }
  }

  // Delete a custom watchlist
  async deleteWatchlist(watchlistId: string): Promise<void> {
    try {
      // Don't allow deletion of default lists
      const defaultIds = ['plan-to-watch', 'currently-watching', 'completed'];
      if (defaultIds.includes(watchlistId)) {
        throw new Error('Cannot delete default watchlists');
      }

      const lists = await this.getAllWatchlists();
      const filteredLists = lists.filter(list => list.id !== watchlistId);
      await AsyncStorage.setItem(WATCHLISTS_KEY, JSON.stringify(filteredLists));
    } catch (error) {
      console.error('Failed to delete watchlist:', error);
      throw error;
    }
  }

  // Search within watchlists
  async searchInWatchlists(query: string): Promise<WatchlistItem[]> {
    try {
      const lists = await this.getAllWatchlists();
      const allItems: WatchlistItem[] = [];
      
      lists.forEach(list => {
        const matchingItems = list.items.filter(item => 
          item.anime.title.romaji.toLowerCase().includes(query.toLowerCase()) ||
          (item.anime.title.english && item.anime.title.english.toLowerCase().includes(query.toLowerCase())) ||
          item.anime.genres.some(genre => genre.toLowerCase().includes(query.toLowerCase()))
        );
        allItems.push(...matchingItems);
      });
      
      return allItems;
    } catch (error) {
      console.error('Failed to search in watchlists:', error);
      return [];
    }
  }

  // Clear all data (for testing/reset purposes)
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(WATCHLISTS_KEY);
      await AsyncStorage.removeItem(DEFAULT_LISTS_KEY);
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw error;
    }
  }
}

export default new WatchlistService();