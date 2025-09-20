import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolate,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import animeService from "../../services/animeService";
import { Anime } from "../../types/anime";

interface SwipeCardProps {
  anime: Anime;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
  onDismiss: () => void;
  isVisible: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const SWIPE_THRESHOLD = 120;
const ROTATION_STRENGTH = 0.15;

export const SwipeCard: React.FC<SwipeCardProps> = ({
  anime,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onDismiss,
  isVisible,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(isVisible ? 1 : 0);
  const opacity = useSharedValue(isVisible ? 1 : 0);

  React.useEffect(() => {
    if (isVisible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      scale.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isVisible, opacity, scale]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      // Optional: add haptic feedback
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const { translationX, translationY, velocityX, velocityY } = event;

      // Check for upward swipe first
      if (translationY < -SWIPE_THRESHOLD || velocityY < -1000) {
        translateY.value = withTiming(-screenHeight, { duration: 300 });
        translateX.value = withTiming(0, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        runOnJS(onSwipeUp)();
        return;
      }

      // Check for downward swipe first
      if (translationY > SWIPE_THRESHOLD || velocityY > 1000) {
        translateY.value = withTiming(screenHeight, { duration: 300 });
        translateX.value = withTiming(0, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        runOnJS(onSwipeDown)();
        return;
      }

      // Check for horizontal swipes
      if (
        Math.abs(translationX) > SWIPE_THRESHOLD ||
        Math.abs(velocityX) > 1000
      ) {
        const direction = translationX > 0 ? 1 : -1;
        translateX.value = withTiming(direction * screenWidth * 1.5, {
          duration: 300,
        });
        opacity.value = withTiming(0, { duration: 300 });

        if (direction > 0) {
          runOnJS(onSwipeRight)();
        } else {
          runOnJS(onSwipeLeft)();
        }
        return;
      }

      // Spring back to center
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-screenWidth / 2, 0, screenWidth / 2],
      [-30, 0, 30],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation * ROTATION_STRENGTH}deg` },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  const leftIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const rightIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const upIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const downIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      [SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const formattedTitle = animeService.getFormattedTitle(anime);
  const year = animeService.getAnimeYear(anime);
  const description = animeService.formatDescription(anime.description);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <Image
          source={{ uri: anime.coverImage.large }}
          style={styles.coverImage}
          resizeMode="cover"
        />

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.9)"]}
          style={styles.gradientOverlay}
        />

        {/* Swipe Indicators */}
        <Animated.View style={[styles.leftIndicator, leftIndicatorStyle]}>
          <BlurView intensity={80} style={styles.indicatorBlur}>
            <Text style={styles.indicatorText}>📚</Text>
            <Text style={styles.indicatorLabel}>Plan to Watch</Text>
          </BlurView>
        </Animated.View>

        <Animated.View style={[styles.rightIndicator, rightIndicatorStyle]}>
          <BlurView intensity={80} style={styles.indicatorBlur}>
            <Text style={styles.indicatorText}>▶️</Text>
            <Text style={styles.indicatorLabel}>Currently Watching</Text>
          </BlurView>
        </Animated.View>

        <Animated.View style={[styles.upIndicator, upIndicatorStyle]}>
          <BlurView intensity={80} style={styles.indicatorBlur}>
            <Text style={styles.indicatorText}>✅</Text>
            <Text style={styles.indicatorLabel}>Completed</Text>
          </BlurView>
        </Animated.View>

        <Animated.View style={[styles.upIndicator, downIndicatorStyle]}>
          <BlurView intensity={80} style={styles.indicatorBlur}>
            <Text style={styles.indicatorText}>❌</Text>
            <Text style={styles.indicatorLabel}>Remove</Text>
          </BlurView>
        </Animated.View>

        {/* Content */}
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
            {anime.averageScore && (
              <Text style={styles.rating}>
                ⭐ {Math.round(anime.averageScore / 10)}/10
              </Text>
            )}
          </View>

          {anime.genres.length > 0 && (
            <View style={styles.genreContainer}>
              <Text style={styles.genre} numberOfLines={1}>
                {anime.genres.slice(0, 3).join(" • ")}
              </Text>
            </View>
          )}

          {description && (
            <Text style={styles.description} numberOfLines={3}>
              {description}
            </Text>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: {
    width: screenWidth - 32,
    height: screenHeight * 0.6,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  coverImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  leftIndicator: {
    position: "absolute",
    left: 20,
    top: "50%",
    transform: [{ translateY: -40 }],
    borderRadius: 20,
    overflow: "hidden",
  },
  rightIndicator: {
    position: "absolute",
    right: 20,
    top: "50%",
    transform: [{ translateY: -40 }],
    borderRadius: 20,
    overflow: "hidden",
  },
  upIndicator: {
    position: "absolute",
    top: 60,
    left: "50%",
    transform: [{ translateX: -60 }],
    borderRadius: 20,
    overflow: "hidden",
  },
  indicatorBlur: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  indicatorText: {
    fontSize: 24,
    marginBottom: 4,
  },
  indicatorLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  contentContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    lineHeight: 30,
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  metaInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  year: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 12,
  },
  episodes: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 12,
  },
  rating: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    fontWeight: "600",
  },
  genreContainer: {
    marginBottom: 12,
  },
  genre: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  description: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
  },
});
