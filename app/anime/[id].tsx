import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  ImageBackground,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import animeService from "../../services/animeService";
import watchlistService from "../../services/watchlistService";
import {
  Anime,
  MediaFormat,
  MediaSeason,
  MediaStatus,
} from "../../types/anime";

const { width } = Dimensions.get("window");

export default function AnimeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [anime, setAnime] = useState<Anime | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const loadAnimeDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await animeService.getAnimeById(parseInt(id!));
      setAnime(response.data.Media);
    } catch (error) {
      console.error("Failed to load anime details:", error);
      const errorMessage =
        error instanceof Error && error.message.includes("Rate limit")
          ? "Too many requests. Please wait a moment and try again."
          : "Failed to load anime details. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const checkWatchlistStatus = useCallback(async () => {
    try {
      const watchlists = await watchlistService.getAllWatchlists();
      const inWatchlist = watchlists.some((list) =>
        list.items.some((item) => item.anime.id === parseInt(id!))
      );
      setIsInWatchlist(inWatchlist);
    } catch (error) {
      console.error("Failed to check watchlist status:", error);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadAnimeDetails();
      checkWatchlistStatus();
    }
  }, [id, loadAnimeDetails, checkWatchlistStatus]);

  const handleAddToWatchlist = async () => {
    if (!anime) return;

    try {
      if (isInWatchlist) {
        // Remove from watchlist
        const watchlists = await watchlistService.getAllWatchlists();
        for (const list of watchlists) {
          if (list.items.some((item) => item.anime.id === anime.id)) {
            await watchlistService.removeAnimeFromWatchlist(list.id, anime.id);
            break;
          }
        }
        setIsInWatchlist(false);
        Alert.alert("Success", "Anime removed from watchlist!");
      } else {
        // Add to Plan to Watch list by default
        await watchlistService.addAnimeToWatchlist("plan-to-watch", anime);
        setIsInWatchlist(true);
        Alert.alert("Success", "Anime added to Plan to Watch!");
      }
    } catch (error) {
      console.error("Failed to update watchlist:", error);
      Alert.alert("Error", "Failed to update watchlist. Please try again.");
    }
  };

  const openTrailer = () => {
    if (anime?.trailer) {
      const url =
        anime.trailer.site === "youtube"
          ? `https://www.youtube.com/watch?v=${anime.trailer.id}`
          : `https://www.dailymotion.com/video/${anime.trailer.id}`;
      Linking.openURL(url);
    }
  };

  const formatStatus = (status: MediaStatus) => {
    return status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatSeason = (season: MediaSeason) => {
    return season.charAt(0) + season.slice(1).toLowerCase();
  };

  const formatFormat = (format: MediaFormat) => {
    return format.replace(/_/g, " ");
  };

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
              <Text style={styles.loadingText}>Loading anime details...</Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    );
  }

  if (!anime) {
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
              <Text style={styles.loadingText}>Anime not found</Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={{ uri: anime.bannerImage || anime.coverImage.large }}
      style={styles.backgroundImage}
      blurRadius={30}
    >
      <LinearGradient
        colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)", "rgba(0,0,0,0.95)"]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <BlurView intensity={80} style={styles.buttonBlur}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.watchlistButton}
            onPress={handleAddToWatchlist}
          >
            <BlurView intensity={80} style={styles.buttonBlur}>
              <Ionicons
                name={isInWatchlist ? "bookmark" : "bookmark-outline"}
                size={24}
                color="#fff"
              />
            </BlurView>
          </TouchableOpacity>
        </View>
        <ScrollView
          style={[styles.container, { paddingTop: insets.top }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Cover and basic info */}
          <View style={styles.heroSection}>
            <ImageBackground
              source={{ uri: anime.coverImage.large }}
              style={styles.coverImage}
              borderRadius={16}
            >
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.7)"]}
                style={styles.coverOverlay}
              />
            </ImageBackground>

            <View style={styles.basicInfo}>
              <Text style={styles.title}>
                {animeService.getFormattedTitle(anime)}
              </Text>
              {anime.title.english &&
                anime.title.english !== anime.title.romaji && (
                  <Text style={styles.englishTitle}>{anime.title.english}</Text>
                )}

              <View style={styles.ratingRow}>
                {anime.averageScore && (
                  <BlurView intensity={60} style={styles.ratingBadge}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.ratingText}>
                      {(anime.averageScore / 10).toFixed(1)}
                    </Text>
                  </BlurView>
                )}

                <BlurView intensity={60} style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {formatStatus(anime.status)}
                  </Text>
                </BlurView>
              </View>
            </View>
          </View>

          {/* Quick info cards */}
          <View style={styles.quickInfoGrid}>
            <BlurView intensity={80} style={styles.infoCard}>
              <Text style={styles.infoLabel}>Episodes</Text>
              <Text style={styles.infoValue}>{anime.episodes || "TBA"}</Text>
            </BlurView>

            <BlurView intensity={80} style={styles.infoCard}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>
                {anime.duration ? `${anime.duration}m` : "TBA"}
              </Text>
            </BlurView>

            <BlurView intensity={80} style={styles.infoCard}>
              <Text style={styles.infoLabel}>Format</Text>
              <Text style={styles.infoValue}>{formatFormat(anime.format)}</Text>
            </BlurView>

            <BlurView intensity={80} style={styles.infoCard}>
              <Text style={styles.infoLabel}>Season</Text>
              <Text style={styles.infoValue}>
                {anime.season && anime.seasonYear
                  ? `${formatSeason(anime.season)} ${anime.seasonYear}`
                  : "TBA"}
              </Text>
            </BlurView>
          </View>

          {/* Trailer button */}
          {anime.trailer && (
            <TouchableOpacity
              style={styles.trailerButton}
              onPress={openTrailer}
            >
              <BlurView intensity={80} style={styles.trailerBlur}>
                <Ionicons name="play-circle" size={24} color="#FF6B6B" />
                <Text style={styles.trailerText}>Watch Trailer</Text>
              </BlurView>
            </TouchableOpacity>
          )}

          {/* Description */}
          {anime.description && (
            <BlurView intensity={80} style={styles.descriptionCard}>
              <Text style={styles.sectionTitle}>Synopsis</Text>
              <Text style={styles.description}>
                {animeService.formatDescription(anime.description)}
              </Text>
            </BlurView>
          )}

          {/* Genres */}
          {anime.genres.length > 0 && (
            <BlurView intensity={80} style={styles.genresCard}>
              <Text style={styles.sectionTitle}>Genres</Text>
              <View style={styles.genresContainer}>
                {anime.genres.map((genre, index) => (
                  <View key={index} style={styles.genreBadge}>
                    <Text style={styles.genreText}>{genre}</Text>
                  </View>
                ))}
              </View>
            </BlurView>
          )}

          {/* Tags */}
          {anime.tags.length > 0 && (
            <BlurView intensity={80} style={styles.tagsCard}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {anime.tags
                  .filter((tag) => !tag.isMediaSpoiler && !tag.isGeneralSpoiler)
                  .slice(0, 10)
                  .map((tag, index) => (
                    <View key={index} style={styles.tagBadge}>
                      <Text style={styles.tagText}>{tag.name}</Text>
                    </View>
                  ))}
              </View>
            </BlurView>
          )}

          {/* Studios */}
          {anime.studios.nodes.length > 0 && (
            <BlurView intensity={80} style={styles.studiosCard}>
              <Text style={styles.sectionTitle}>Studios</Text>
              <View style={styles.studiosContainer}>
                {anime.studios.nodes.map((studio, index) => (
                  <Text key={index} style={styles.studioText}>
                    {studio.name}
                  </Text>
                ))}
              </View>
            </BlurView>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
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
  header: {
    flexDirection: "row",
    position: "fixed",
    top: 60,
    zIndex: 10,
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  watchlistButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  buttonBlur: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
  },
  heroSection: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  coverImage: {
    width: 120,
    height: 170,
    borderRadius: 16,
    overflow: "hidden",
  },
  coverOverlay: {
    flex: 1,
    borderRadius: 16,
  },
  basicInfo: {
    flex: 1,
    justifyContent: "flex-end",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    lineHeight: 30,
    marginBottom: 4,
  },
  englishTitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: "row",
    gap: 8,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  quickInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    width: (width - 56) / 2,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
  },
  infoLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  trailerButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  trailerBlur: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 30,
  },
  trailerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  descriptionCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 24,
  },
  genresCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
  },
  genresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  genreBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  genreText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  tagsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    fontWeight: "500",
  },
  studiosCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
  },
  studiosContainer: {
    gap: 4,
  },
  studioText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
    fontWeight: "500",
  },
  bottomSpacer: {
    height: 40,
  },
});
