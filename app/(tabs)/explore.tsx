import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimeCard } from "../../components/ui/anime-card";
import { SwipeSelectionOverlay } from "../../components/ui/swipe-selection-overlay";
import { WatchlistSelectionModal } from "../../components/ui/watchlist-selection-modal";
import watchlistService from "../../services/watchlistService";
import { Anime, Watchlist, WatchlistItem } from "../../types/anime";

export default function WatchlistScreen() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedList, setSelectedList] = useState<string>("plan-to-watch");
  const [loading, setLoading] = useState(true);
  const [watchlistModalVisible, setWatchlistModalVisible] = useState(false);
  const [swipeModalVisible, setSwipeModalVisible] = useState(false);
  const [selectedAnimeForWatchlist, setSelectedAnimeForWatchlist] =
    useState<Anime | null>(null);
  const [selectedAnimeForSwipe, setSelectedAnimeForSwipe] =
    useState<Anime | null>(null);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const loadWatchlists = useCallback(async () => {
    try {
      setLoading(true);
      const lists = await watchlistService.getAllWatchlists();
      setWatchlists(lists);
    } catch (error) {
      console.error("Failed to load watchlists:", error);
      Alert.alert("Error", "Failed to load watchlists. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWatchlists();
  }, [loadWatchlists]);

  const handleAnimePress = useCallback(
    (anime: Anime) => {
      // Navigate to anime detail screen
      router.push(`/anime/${anime.id}`);
    },
    [router]
  );

  const handleRemoveAnime = useCallback(async (anime: Anime) => {
    setSelectedAnimeForSwipe(anime);
    setSwipeModalVisible(true);
  }, []);

  const handleWatchlistSuccess = useCallback(
    async (watchlistId: string) => {
      await loadWatchlists();
      setWatchlistModalVisible(false);
      setSelectedAnimeForWatchlist(null);
    },
    [loadWatchlists]
  );

  const handleSwipeSuccess = useCallback(async () => {
    await loadWatchlists();
    setSwipeModalVisible(false);
    setSelectedAnimeForSwipe(null);
  }, [loadWatchlists]);

  const getCurrentWatchlist = (): Watchlist | undefined => {
    return watchlists.find((list) => list.id === selectedList);
  };

  const renderWatchlistTab = ({ item }: { item: Watchlist }) => {
    const isSelected = selectedList === item.id;

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.tab, isSelected && styles.activeTab]}
        onPress={() => setSelectedList(item.id)}
      >
        <BlurView intensity={isSelected ? 100 : 60} style={styles.tabBlur}>
          <Text style={[styles.tabText, isSelected && styles.activeTabText]}>
            {item.name}
          </Text>
          <Text style={[styles.tabCount, isSelected && styles.activeTabCount]}>
            {item.items.length}
          </Text>
        </BlurView>
      </TouchableOpacity>
    );
  };

  const renderAnimeItem = useCallback(
    ({ item, index }: { item: WatchlistItem; index: number }) => (
      <AnimeCard
        anime={item.anime}
        onPress={() => handleAnimePress(item.anime)}
        onAddToWatchlist={() => handleRemoveAnime(item.anime)}
        isInWatchlist={true}
        style={{
          marginLeft: index % 2 === 0 ? 16 : 8,
          marginRight: index % 2 === 0 ? 8 : 16,
        }}
      />
    ),
    [handleAnimePress, handleRemoveAnime]
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <BlurView intensity={80} style={styles.emptyBlur}>
        <Ionicons
          name="list-outline"
          size={64}
          color="rgba(255, 255, 255, 0.5)"
        />
        <Text style={styles.emptyTitle}>No Saves Yet</Text>
        <Text style={styles.emptySubtitle}>
          Start adding anime to your watchlist from the search tab!
        </Text>
      </BlurView>
    </View>
  );

  if (loading) {
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
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading watchlists...</Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    );
  }

  const currentWatchlist = getCurrentWatchlist();

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
        <View style={[styles.container]}>
          <BlurView
            intensity={50}
            style={{ position: "absolute", width: "100%", zIndex: 1 }}
          >
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
              <Text style={styles.headerTitle}>My Watchlists</Text>
            </View>

            {/* Watchlist Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabContainer}
              contentContainerStyle={styles.tabContent}
            >
              {watchlists.map((list) => renderWatchlistTab({ item: list }))}
            </ScrollView>
          </BlurView>
          {/* Anime List */}
          {currentWatchlist && currentWatchlist.items.length > 0 ? (
            <FlashList
              data={currentWatchlist.items}
              renderItem={renderAnimeItem}
              keyExtractor={(item) => `${selectedList}-${item.anime.id}`}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            renderEmptyState()
          )}

          <WatchlistSelectionModal
            visible={watchlistModalVisible}
            anime={selectedAnimeForWatchlist}
            onClose={() => {
              setWatchlistModalVisible(false);
              setSelectedAnimeForWatchlist(null);
            }}
            onSuccess={handleWatchlistSuccess}
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
  header: {
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  tabContainer: {
    maxHeight: 60,
    marginBottom: 16,
  },
  tabContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  tab: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  activeTab: {
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  tabBlur: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tabText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "500",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "600",
  },
  tabCount: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
    minWidth: 20,
    textAlign: "center",
  },
  activeTabCount: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    color: "#fff",
  },
  listContent: {
    paddingTop: 196,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 64,
  },
  emptyBlur: {
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
});
