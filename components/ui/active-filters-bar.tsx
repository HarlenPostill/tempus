import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SearchFilters } from "../../types/anime";

interface ActiveFiltersBarProps {
  filters: SearchFilters;
  onRemoveFilter: (filterType: string, value?: string) => void;
  onClearAll: () => void;
}

export const ActiveFiltersBar: React.FC<ActiveFiltersBarProps> = ({
  filters,
  onRemoveFilter,
  onClearAll,
}) => {
  const hasActiveFilters = Object.keys(filters).some((key) => {
    const value = filters[key as keyof SearchFilters];
    return (
      value !== undefined &&
      value !== null &&
      (Array.isArray(value) ? value.length > 0 : true)
    );
  });

  if (!hasActiveFilters) return null;

  const formatValue = (key: string, value: any): string => {
    if (key === "genre" && Array.isArray(value)) {
      return value.length > 1 ? `${value.length} genres` : value[0];
    }
    if (key === "season") {
      return value.charAt(0) + value.slice(1).toLowerCase();
    }
    if (key === "format") {
      return value.replace(/_/g, " ");
    }
    if (key === "status") {
      return value
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (l: string) => l.toUpperCase());
    }
    return value.toString();
  };

  const getFilterIcon = (key: string): string => {
    switch (key) {
      case "genre":
        return "pricetag";
      case "year":
        return "calendar";
      case "season":
        return "leaf";
      case "format":
        return "film";
      case "status":
        return "information-circle";
      default:
        return "filter";
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {Object.entries(filters).map(([key, value]) => {
          if (!value || (Array.isArray(value) && value.length === 0))
            return null;

          return (
            <BlurView key={key} intensity={80} style={styles.filterChip}>
              <Ionicons
                name={getFilterIcon(key) as any}
                size={14}
                color="rgba(255, 255, 255, 0.8)"
              />
              <Text style={styles.filterText}>{formatValue(key, value)}</Text>
              <TouchableOpacity
                onPress={() => onRemoveFilter(key)}
                style={styles.removeButton}
              >
                <Ionicons
                  name="close"
                  size={14}
                  color="rgba(255, 255, 255, 0.6)"
                />
              </TouchableOpacity>
            </BlurView>
          );
        })}

        <TouchableOpacity onPress={onClearAll} style={styles.clearAllButton}>
          <BlurView intensity={60} style={styles.clearAllBlur}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </BlurView>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  scrollContent: {
    paddingRight: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    gap: 6,
  },
  filterText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  removeButton: {
    padding: 2,
  },
  clearAllButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  clearAllBlur: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
  },
  clearAllText: {
    color: "#FF6B6B",
    fontSize: 12,
    fontWeight: "500",
  },
});
