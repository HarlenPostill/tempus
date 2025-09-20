import { FlashList } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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

import { ActiveFiltersBar } from "../../components/ui/active-filters-bar";
import { AnimeCard } from "../../components/ui/anime-card";
import FilterModal from "../../components/ui/filter-modal";
import { SearchHeader } from "../../components/ui/search-header";
import { SwipeSelectionOverlay } from "../../components/ui/swipe-selection-overlay";
import animeService from "../../services/animeService";
import watchlistService from "../../services/watchlistService";
import { Anime, SearchFilters } from "../../types/anime";

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [watchlistItems, setWatchlistItems] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState<SearchFilters>({});
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [swipeModalVisible, setSwipeModalVisible] = useState(false);
  const [selectedAnimeForSwipe, setSelectedAnimeForSwipe] =
    useState<Anime | null>(null);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const loadWatchlistItems = useCallback(async () => {
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
  }, []);

  const loadTrendingAnime = useCallback(
    async (page: number = 1, append: boolean = false) => {
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
        const errorMessage =
          error instanceof Error && error.message.includes("Rate limit")
            ? "Too many requests. Please wait a moment and try again."
            : "Failed to load anime. Please check your connection and try again.";
        Alert.alert("Error", errorMessage);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loading, refreshing]
  );

  const initializeApp = useCallback(async () => {
    try {
      await watchlistService.initializeDefaultLists();
      await loadWatchlistItems();
      await loadTrendingAnime();
    } catch (error) {
      console.error("Failed to initialize app:", error);
      Alert.alert("Error", "Failed to initialize the app. Please try again.");
    }
  }, [loadWatchlistItems, loadTrendingAnime]);

  // Initialize default watchlists on component mount
  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  const searchAnime = useCallback(
    async (page: number = 1, append: boolean = false) => {
      if (loading && !refreshing) return;

      try {
        setLoading(true);
        const searchFilters: SearchFilters = {
          search: searchQuery.trim() || undefined,
          ...filters,
        };

        const response = await animeService.searchAnime(
          page,
          20,
          searchFilters
        );
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
        const errorMessage =
          error instanceof Error && error.message.includes("Rate limit")
            ? "Too many requests. Please wait a moment and try again."
            : "Search failed. Please try again.";
        Alert.alert("Error", errorMessage);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchQuery, filters, loading, refreshing]
  );

  // Search when query or filters change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim() || Object.keys(filters).length > 0) {
        searchAnime();
      } else {
        loadTrendingAnime();
      }
    }, 800); // Increased debounce time to reduce API calls

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, filters, searchAnime, loadTrendingAnime]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !loading) {
      const nextPage = currentPage + 1;
      if (searchQuery.trim() || Object.keys(filters).length > 0) {
        searchAnime(nextPage, true);
      } else {
        loadTrendingAnime(nextPage, true);
      }
    }
  }, [
    hasNextPage,
    loading,
    currentPage,
    searchQuery,
    filters,
    searchAnime,
    loadTrendingAnime,
  ]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPage(1);
    if (searchQuery.trim() || Object.keys(filters).length > 0) {
      searchAnime();
    } else {
      loadTrendingAnime();
    }
  }, [searchQuery, filters, searchAnime, loadTrendingAnime]);

  const handleApplyFilters = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  const handleRemoveFilter = useCallback(
    (filterType: string, value?: string) => {
      setFilters((prev) => {
        const newFilters = { ...prev };

        if (filterType === "genre" && value) {
          const genres = prev.genre || [];
          newFilters.genre = genres.filter((g) => g !== value);
          if (newFilters.genre.length === 0) {
            delete newFilters.genre;
          }
        } else {
          delete (newFilters as any)[filterType];
        }

        return newFilters;
      });
      setCurrentPage(1);
    },
    []
  );

  const handleAnimePress = useCallback(
    (anime: Anime) => {
      // Navigate to anime detail screen
      router.push(`/anime/${anime.id}`);
    },
    [router]
  );

  const handleAddToWatchlist = useCallback(async (anime: Anime) => {
    setSelectedAnimeForSwipe(anime);
    setSwipeModalVisible(true);
  }, []);

  const handleSwipeSuccess = useCallback(async () => {
    await loadWatchlistItems();
    setSwipeModalVisible(false);
    setSelectedAnimeForSwipe(null);
  }, [loadWatchlistItems]);

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
    [watchlistItems, handleAnimePress, handleAddToWatchlist]
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
        <View style={[styles.container, { paddingTop: 0 }]}>
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1,
            }}
          >
            <SearchHeader
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onFilterPress={() => setFilterModalVisible(true)}
              placeholder="Search anime..."
              loading={loading}
            />

            <ActiveFiltersBar
              filters={filters}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={handleResetFilters}
            />
          </View>

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

          <FilterModal
            visible={filterModalVisible}
            onClose={() => setFilterModalVisible(false)}
            filters={filters}
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
          />

          <SwipeSelectionOverlay
            visible={swipeModalVisible}
            anime={selectedAnimeForSwipe}
            onClose={() => {
              setSwipeModalVisible(false);
              setSelectedAnimeForSwipe(null);
            }}
            onSuccess={handleSwipeSuccess}
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
    paddingTop: 120,
    paddingBottom: 100,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
