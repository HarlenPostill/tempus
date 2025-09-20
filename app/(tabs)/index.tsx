import { FlashList } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimeCard } from "../../components/ui/anime-card";
import { SearchHeader } from "../../components/ui/search-header";
import animeService from "../../services/animeService";
import watchlistService from "../../services/watchlistService";
import { Anime } from "../../types/anime";

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [watchlistItems, setWatchlistItems] = useState<Set<number>>(new Set());

  const insets = useSafeAreaInsets();

  // Initialize default watchlists on component mount
  useEffect(() => {
    initializeApp();
  }, []);

  // Search when query changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchAnime();
      } else {
        loadTrendingAnime();
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const initializeApp = async () => {
    try {
      await watchlistService.initializeDefaultLists();
      await loadWatchlistItems();
      await loadTrendingAnime();
    } catch (error) {
      console.error("Failed to initialize app:", error);
      Alert.alert("Error", "Failed to initialize the app. Please try again.");
    }
  };

  const loadWatchlistItems = async () => {
    try {
      const watchlists = await watchlistService.getAllWatchlists();
      const allItems = new Set<number>();
      watchlists.forEach((list) => {
        list.items.forEach((item) => {
          allItems.add(item.anime.id);
        });
      });
      setWatchlistItems(allItems);
    } catch (error) {
      console.error("Failed to load watchlist items:", error);
    }
  };

  const loadTrendingAnime = async (
    page: number = 1,
    append: boolean = false
  ) => {
    if (loading && !refreshing) return;

    try {
      setLoading(true);
      const response = await animeService.getTrendingAnime(page, 20);
      const newAnime = response.data.Page.media;

      if (append) {
        setAnimeList((prev) => [...prev, ...newAnime]);
      } else {
        setAnimeList(newAnime);
      }

      setHasNextPage(response.data.Page.pageInfo.hasNextPage);
      setCurrentPage(page);
    } catch (error) {
      console.error("Failed to load trending anime:", error);
      Alert.alert(
        "Error",
        "Failed to load anime. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const searchAnime = async (page: number = 1, append: boolean = false) => {
    if (loading && !refreshing) return;

    try {
      setLoading(true);
      const response = await animeService.searchAnime(page, 20, {
        search: searchQuery.trim(),
      });
      const newAnime = response.data.Page.media;

      if (append) {
        setAnimeList((prev) => [...prev, ...newAnime]);
      } else {
        setAnimeList(newAnime);
      }

      setHasNextPage(response.data.Page.pageInfo.hasNextPage);
      setCurrentPage(page);
    } catch (error) {
      console.error("Failed to search anime:", error);
      Alert.alert("Error", "Search failed. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (hasNextPage && !loading) {
      const nextPage = currentPage + 1;
      if (searchQuery.trim()) {
        searchAnime(nextPage, true);
      } else {
        loadTrendingAnime(nextPage, true);
      }
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    if (searchQuery.trim()) {
      searchAnime();
    } else {
      loadTrendingAnime();
    }
  };

  const handleAnimePress = (anime: Anime) => {
    // TODO: Navigate to anime detail screen
    Alert.alert(
      animeService.getFormattedTitle(anime),
      animeService.formatDescription(anime.description)?.slice(0, 200) + "...",
      [{ text: "OK" }]
    );
  };

  const handleAddToWatchlist = async (anime: Anime) => {
    try {
      const isInWatchlist = watchlistItems.has(anime.id);

      if (isInWatchlist) {
        // Show options to remove or change list
        Alert.alert(
          "Manage Watchlist",
          "This anime is already in your watchlist.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Remove",
              style: "destructive",
              onPress: () => removeFromWatchlist(anime.id),
            },
          ]
        );
      } else {
        // Add to default "Plan to Watch" list
        await watchlistService.addAnimeToWatchlist("plan-to-watch", anime);
        setWatchlistItems((prev) => new Set(prev).add(anime.id));
        Alert.alert("Success", "Added to your watchlist!");
      }
    } catch (error) {
      console.error("Failed to manage watchlist:", error);
      Alert.alert("Error", "Failed to update watchlist. Please try again.");
    }
  };

  const removeFromWatchlist = async (animeId: number) => {
    try {
      const watchlists = await watchlistService.getAllWatchlists();
      for (const list of watchlists) {
        const hasAnime = list.items.some((item) => item.anime.id === animeId);
        if (hasAnime) {
          await watchlistService.removeAnimeFromWatchlist(list.id, animeId);
        }
      }

      setWatchlistItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(animeId);
        return newSet;
      });
      Alert.alert("Success", "Removed from watchlist!");
    } catch (error) {
      console.error("Failed to remove from watchlist:", error);
      Alert.alert(
        "Error",
        "Failed to remove from watchlist. Please try again."
      );
    }
  };

  const renderAnimeItem = useCallback(
    ({ item, index }: { item: Anime; index: number }) => (
      <AnimeCard
        anime={item}
        onPress={() => handleAnimePress(item)}
        onAddToWatchlist={() => handleAddToWatchlist(item)}
        isInWatchlist={watchlistItems.has(item.id)}
        style={{
          marginLeft: index % 2 === 0 ? 16 : 8,
          marginRight: index % 2 === 0 ? 8 : 16,
        }}
      />
    ),
    [watchlistItems]
  );

  const renderFooter = () => {
    if (!loading || refreshing) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  };

  return (
    <ImageBackground
      source={require("../../assets/images/react-logo.png")}
      style={styles.backgroundImage}
      blurRadius={20}
    >
      <LinearGradient
        colors={["rgba(0,0,0,0.7)", "rgba(0,0,0,0.9)"]}
        style={styles.gradient}
      >
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <SearchHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            placeholder="Search anime..."
          />

          <FlashList
            data={animeList}
            renderItem={renderAnimeItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#fff"
              />
            }
            ListFooterComponent={renderFooter}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
