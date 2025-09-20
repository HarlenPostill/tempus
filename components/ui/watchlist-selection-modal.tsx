import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import watchlistService from "../../services/watchlistService";
import { Anime, Watchlist, WatchStatus } from "../../types/anime";

interface WatchlistSelectionModalProps {
  visible: boolean;
  anime: Anime | null;
  onClose: () => void;
  onSuccess: (watchlistId: string) => void;
}

export const WatchlistSelectionModal: React.FC<
  WatchlistSelectionModalProps
> = ({ visible, anime, onClose, onSuccess }) => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [currentWatchlists, setCurrentWatchlists] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && anime) {
      loadWatchlists();
      checkCurrentWatchlists();
    }
  }, [visible, anime]);

  const loadWatchlists = async () => {
    try {
      const lists = await watchlistService.getAllWatchlists();
      setWatchlists(lists);
    } catch (error) {
      console.error("Failed to load watchlists:", error);
    }
  };

  const checkCurrentWatchlists = async () => {
    if (!anime) return;

    try {
      const inWatchlists = await watchlistService.isAnimeInWatchlists(anime.id);
      setCurrentWatchlists(new Set(inWatchlists.map((w) => w.watchlistId)));
    } catch (error) {
      console.error("Failed to check current watchlists:", error);
    }
  };

  const handleWatchlistSelect = async (watchlistId: string) => {
    if (!anime) return;

    setLoading(true);
    try {
      const isCurrentlyInList = currentWatchlists.has(watchlistId);

      if (isCurrentlyInList) {
        await watchlistService.removeAnimeFromWatchlist(watchlistId, anime.id);
        setCurrentWatchlists((prev) => {
          const newSet = new Set(prev);
          newSet.delete(watchlistId);
          return newSet;
        });
        Alert.alert("Success", "Removed from watchlist!");
      } else {
        // Map watchlist IDs to appropriate watch status
        let watchStatus = WatchStatus.PLAN_TO_WATCH;
        if (watchlistId === "currently-watching") {
          watchStatus = WatchStatus.WATCHING;
        } else if (watchlistId === "completed") {
          watchStatus = WatchStatus.COMPLETED;
        }

        await watchlistService.addAnimeToWatchlist(
          watchlistId,
          anime,
          watchStatus
        );
        setCurrentWatchlists((prev) => new Set(prev).add(watchlistId));
        Alert.alert("Success", "Added to watchlist!");
      }

      onSuccess(watchlistId);
    } catch (error) {
      console.error("Failed to update watchlist:", error);
      Alert.alert("Error", "Failed to update watchlist. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getWatchlistIcon = (watchlistId: string) => {
    switch (watchlistId) {
      case "plan-to-watch":
        return "bookmark-outline";
      case "currently-watching":
        return "play-circle-outline";
      case "completed":
        return "checkmark-circle-outline";
      default:
        return "list-outline";
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
      <View style={styles.overlay}>
        <BlurView intensity={80} style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Add to Watchlist</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.animeInfo}>
            <Text style={styles.animeTitle} numberOfLines={2}>
              {anime.title.english || anime.title.romaji || anime.title.native}
            </Text>
          </View>

          <ScrollView style={styles.watchlistsList}>
            {watchlists.map((watchlist) => {
              const isInList = currentWatchlists.has(watchlist.id);
              return (
                <TouchableOpacity
                  key={watchlist.id}
                  style={[
                    styles.watchlistItem,
                    isInList && styles.watchlistItemActive,
                  ]}
                  onPress={() => handleWatchlistSelect(watchlist.id)}
                  disabled={loading}
                >
                  <View style={styles.watchlistInfo}>
                    <Ionicons
                      name={getWatchlistIcon(watchlist.id) as any}
                      size={24}
                      color={isInList ? "#4CAF50" : "#fff"}
                    />
                    <View style={styles.watchlistTextContainer}>
                      <Text
                        style={[
                          styles.watchlistName,
                          isInList && styles.watchlistNameActive,
                        ]}
                      >
                        {watchlist.name}
                      </Text>
                      <Text style={styles.watchlistCount}>
                        {watchlist.items.length} anime
                      </Text>
                    </View>
                  </View>

                  {isInList && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </BlurView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  closeButton: {
    padding: 4,
  },
  animeInfo: {
    padding: 20,
    paddingBottom: 10,
  },
  animeTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 22,
  },
  watchlistsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  watchlistItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  watchlistItemActive: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderColor: "rgba(76, 175, 80, 0.3)",
  },
  watchlistInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  watchlistTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  watchlistName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
    marginBottom: 2,
  },
  watchlistNameActive: {
    color: "#4CAF50",
  },
  watchlistCount: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
  },
});
