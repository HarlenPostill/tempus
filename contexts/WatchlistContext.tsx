import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import watchlistService from "../services/watchlistService";
import { Anime, Watchlist } from "../types/anime";

interface WatchlistContextType {
  watchlists: Watchlist[];
  watchlistItems: Set<number>;
  loading: boolean;
  refreshWatchlists: () => Promise<void>;
  addAnimeToWatchlist: (watchlistId: string, anime: Anime) => Promise<void>;
  removeAnimeFromWatchlist: (
    watchlistId: string,
    animeId: number
  ) => Promise<void>;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(
  undefined
);

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error("useWatchlist must be used within a WatchlistProvider");
  }
  return context;
};

export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const refreshWatchlists = useCallback(async () => {
    try {
      setLoading(true);
      const lists = await watchlistService.getAllWatchlists();
      setWatchlists(lists);

      // Update the set of anime IDs that are in watchlists
      const allItems = new Set<number>();
      lists.forEach((list) => {
        list.items.forEach((item) => {
          allItems.add(item.anime.id);
        });
      });
      setWatchlistItems(allItems);
    } catch (error) {
      console.error("Failed to refresh watchlists:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addAnimeToWatchlist = useCallback(
    async (watchlistId: string, anime: Anime) => {
      try {
        await watchlistService.addAnimeToWatchlist(watchlistId, anime);
        await refreshWatchlists();
      } catch (error) {
        console.error("Failed to add anime to watchlist:", error);
        throw error;
      }
    },
    [refreshWatchlists]
  );

  const removeAnimeFromWatchlist = useCallback(
    async (watchlistId: string, animeId: number) => {
      try {
        await watchlistService.removeAnimeFromWatchlist(watchlistId, animeId);
        await refreshWatchlists();
      } catch (error) {
        console.error("Failed to remove anime from watchlist:", error);
        throw error;
      }
    },
    [refreshWatchlists]
  );

  useEffect(() => {
    const initializeWatchlists = async () => {
      try {
        await watchlistService.initializeDefaultLists();
        await refreshWatchlists();
      } catch (error) {
        console.error("Failed to initialize watchlists:", error);
      }
    };

    initializeWatchlists();
  }, [refreshWatchlists]);

  const value: WatchlistContextType = {
    watchlists,
    watchlistItems,
    loading,
    refreshWatchlists,
    addAnimeToWatchlist,
    removeAnimeFromWatchlist,
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
};
