import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import animeService from "../../services/animeService";
import { Anime } from "../../types/anime";

interface AnimeCardProps {
  anime: Anime;
  onPress: () => void;
  onAddToWatchlist?: () => void;
  isInWatchlist?: boolean;
  style?: any;
}

const { width: screenWidth } = Dimensions.get("window");
const cardWidth = (screenWidth - 48) / 2; // 2 columns with 16px margins

export const AnimeCard: React.FC<AnimeCardProps> = ({
  anime,
  onPress,
  onAddToWatchlist,
  isInWatchlist = false,
  style,
}) => {
  const formattedTitle = animeService.getFormattedTitle(anime);
  const year = animeService.getAnimeYear(anime);

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: anime.coverImage.large }}
          style={styles.coverImage}
          resizeMode="cover"
        />

        {/* Glass overlay for better text readability */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={styles.gradientOverlay}
        />

        {/* Rating badge */}
        {anime.averageScore && (
          <View style={styles.ratingBadge}>
            <BlurView intensity={80} style={styles.ratingBlur}>
              <Text style={styles.ratingText}>
                {Math.round(anime.averageScore / 10)}/10
              </Text>
            </BlurView>
          </View>
        )}

        {/* Watchlist button */}
        <TouchableOpacity
          style={styles.watchlistButton}
          onPress={onAddToWatchlist}
          activeOpacity={0.7}
        >
          <BlurView intensity={80} style={styles.watchlistBlur}>
            <Text style={styles.watchlistIcon}>
              {isInWatchlist ? "✓" : "+"}
            </Text>
          </BlurView>
        </TouchableOpacity>
      </View>

      {/* Content overlay */}
      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {formattedTitle}
        </Text>

        <View style={styles.metaInfo}>
          {year && <Text style={styles.year}>{year}</Text>}
          {anime.episodes && (
            <Text style={styles.episodes}>
              {anime.episodes} ep{anime.episodes !== 1 ? "s" : ""}
            </Text>
          )}
        </View>

        {anime.genres.length > 0 && (
          <View style={styles.genreContainer}>
            <Text style={styles.genre} numberOfLines={1}>
              {anime.genres.slice(0, 2).join(" • ")}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    height: 280,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  imageContainer: {
    flex: 1,
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  ratingBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  ratingBlur: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  watchlistButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
  },
  watchlistBlur: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  watchlistIcon: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  contentContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  title: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  metaInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  year: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "500",
    marginRight: 8,
  },
  episodes: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "500",
  },
  genreContainer: {
    marginTop: 2,
  },
  genre: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 11,
    fontWeight: "400",
  },
});
