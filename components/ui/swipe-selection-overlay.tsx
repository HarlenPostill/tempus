import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import watchlistService from "../../services/watchlistService";
import { Anime, WatchStatus } from "../../types/anime";
import { SwipeCard } from "./swipe-card";

interface SwipeSelectionOverlayProps {
  visible: boolean;
  anime: Anime | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const SwipeSelectionOverlay: React.FC<SwipeSelectionOverlayProps> = ({
  visible,
  anime,
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();

  const handleSwipeLeft = async () => {
    if (!anime) return;

    try {
      await watchlistService.addAnimeToWatchlist(
        "plan-to-watch",
        anime,
        WatchStatus.PLAN_TO_WATCH
      );
      Alert.alert(
        "Added to Plan to Watch! 📚",
        anime.title.english || anime.title.romaji
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to add to plan to watch:", error);
      Alert.alert(
        "Error",
        "Failed to add anime to watchlist. Please try again."
      );
    }
  };

  const handleSwipeRight = async () => {
    if (!anime) return;

    try {
      await watchlistService.addAnimeToWatchlist(
        "currently-watching",
        anime,
        WatchStatus.WATCHING
      );
      Alert.alert(
        "Added to Currently Watching! ▶️",
        anime.title.english || anime.title.romaji
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to add to currently watching:", error);
      Alert.alert(
        "Error",
        "Failed to add anime to watchlist. Please try again."
      );
    }
  };

  const handleSwipeUp = async () => {
    if (!anime) return;

    try {
      await watchlistService.addAnimeToWatchlist(
        "completed",
        anime,
        WatchStatus.COMPLETED
      );
      Alert.alert(
        "Added to Completed! ✅",
        anime.title.english || anime.title.romaji
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to add to completed:", error);
      Alert.alert(
        "Error",
        "Failed to add anime to watchlist. Please try again."
      );
    }
  };

  const handleSwipeDown = async () => {
    if (!anime) return;

    try {
      await watchlistService.addAnimeToWatchlist(
        "completed",
        anime,
        WatchStatus.COMPLETED
      );
      Alert.alert(
        "Removed from watchlist",
        anime.title.english || anime.title.romaji
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to add to completed:", error);
      Alert.alert(
        "Error",
        "Failed to remove anime from watchlist. Please try again."
      );
    }
  };

  if (!anime) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={50} style={styles.overlay}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Text style={styles.headerTitle}>Add to Watchlist</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <BlurView intensity={30} style={styles.instructionsBlur}>
            <View style={styles.instruction}>
              <Text style={styles.instructionEmoji}>👈</Text>
              <Text style={styles.instructionText}>Plan to Watch</Text>
            </View>
            <View style={styles.instruction}>
              <Text style={styles.instructionEmoji}>👆</Text>
              <Text style={styles.instructionText}>Completed</Text>
            </View>
            <View style={styles.instruction}>
              <Text style={styles.instructionEmoji}>👉</Text>
              <Text style={styles.instructionText}>Currently Watching</Text>
            </View>
          </BlurView>
        </View>

        {/* Card Container */}
        <View style={styles.cardContainer}>
          <SwipeCard
            anime={anime}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onSwipeUp={handleSwipeUp}
            onSwipeDown={handleSwipeDown}
            onDismiss={onClose}
            isVisible={visible}
          />
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  instructionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  instructionsBlur: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
  },
  instruction: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  instructionEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  instructionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 60,
  },
});
