import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  MediaFormat,
  MediaSeason,
  MediaStatus,
  SearchFilters,
} from "../../types/anime";

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onApplyFilters: (filters: SearchFilters) => void;
  onResetFilters: () => void;
}

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  children,
  isCollapsed = false,
  onToggle,
}) => (
  <View style={styles.filterSection}>
    <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Ionicons
        name={isCollapsed ? "chevron-down" : "chevron-up"}
        size={20}
        color="rgba(255, 255, 255, 0.7)"
      />
    </TouchableOpacity>
    {!isCollapsed && <View style={styles.sectionContent}>{children}</View>}
  </View>
);

const genres = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mahou Shoujo",
  "Mecha",
  "Music",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

export default function FilterModal({
  visible,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
}: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );
  const insets = useSafeAreaInsets();

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const updateGenres = (genre: string) => {
    setLocalFilters((prev) => {
      const currentGenres = prev.genre || [];
      const isSelected = currentGenres.includes(genre);

      return {
        ...prev,
        genre: isSelected
          ? currentGenres.filter((g) => g !== genre)
          : [...currentGenres, genre],
      };
    });
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: SearchFilters = {};
    setLocalFilters(resetFilters);
    onResetFilters();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.genre?.length) count++;
    if (localFilters.year) count++;
    if (localFilters.season) count++;
    if (localFilters.format) count++;
    if (localFilters.status) count++;
    return count;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      backdropColor="green"
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <BlurView intensity={10} style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Filters</Text>
            {getActiveFiltersCount() > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {getActiveFiltersCount()}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetButton}>Reset</Text>
          </TouchableOpacity>
        </BlurView>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Genres */}
          <FilterSection
            title="Genres"
            isCollapsed={collapsedSections.has("genres")}
            onToggle={() => toggleSection("genres")}
          >
            <View style={styles.optionsGrid}>
              {genres.map((genre) => {
                const isSelected = localFilters.genre?.includes(genre) || false;
                return (
                  <TouchableOpacity
                    key={genre}
                    style={[
                      styles.optionChip,
                      isSelected && styles.selectedChip,
                    ]}
                    onPress={() => updateGenres(genre)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.selectedText,
                      ]}
                    >
                      {genre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </FilterSection>

          {/* Year */}
          <FilterSection
            title="Year"
            isCollapsed={collapsedSections.has("year")}
            onToggle={() => toggleSection("year")}
          >
            <View style={styles.optionsGrid}>
              {years.map((year) => {
                const isSelected = localFilters.year === year;
                return (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.optionChip,
                      isSelected && styles.selectedChip,
                    ]}
                    onPress={() =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        year: isSelected ? undefined : year,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.selectedText,
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </FilterSection>

          {/* Season */}
          <FilterSection
            title="Season"
            isCollapsed={collapsedSections.has("season")}
            onToggle={() => toggleSection("season")}
          >
            <View style={styles.optionsRow}>
              {Object.values(MediaSeason).map((season) => {
                const isSelected = localFilters.season === season;
                const displayName =
                  season.charAt(0) + season.slice(1).toLowerCase();
                return (
                  <TouchableOpacity
                    key={season}
                    style={[
                      styles.optionButton,
                      isSelected && styles.selectedButton,
                    ]}
                    onPress={() =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        season: isSelected ? undefined : season,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        isSelected && styles.selectedButtonText,
                      ]}
                    >
                      {displayName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </FilterSection>

          {/* Format */}
          <FilterSection
            title="Format"
            isCollapsed={collapsedSections.has("format")}
            onToggle={() => toggleSection("format")}
          >
            <View style={styles.optionsGrid}>
              {Object.values(MediaFormat).map((format) => {
                const isSelected = localFilters.format === format;
                const displayName = format.replace(/_/g, " ");
                return (
                  <TouchableOpacity
                    key={format}
                    style={[
                      styles.optionChip,
                      isSelected && styles.selectedChip,
                    ]}
                    onPress={() =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        format: isSelected ? undefined : format,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.selectedText,
                      ]}
                    >
                      {displayName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </FilterSection>

          {/* Status */}
          <FilterSection
            title="Status"
            isCollapsed={collapsedSections.has("status")}
            onToggle={() => toggleSection("status")}
          >
            <View style={styles.optionsColumn}>
              {Object.values(MediaStatus).map((status) => {
                const isSelected = localFilters.status === status;
                const displayName = status
                  .replace(/_/g, " ")
                  .toLowerCase()
                  .replace(/\b\w/g, (l) => l.toUpperCase());
                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.optionButton,
                      isSelected && styles.selectedButton,
                    ]}
                    onPress={() =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        status: isSelected ? undefined : status,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        isSelected && styles.selectedButtonText,
                      ]}
                    >
                      {displayName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </FilterSection>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Apply Button */}
        <BlurView intensity={10} style={styles.applyContainer}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>
              Apply Filters
              {getActiveFiltersCount() > 0 && ` (${getActiveFiltersCount()})`}
            </Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    position: "absolute",
    top: 0,
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  cancelButton: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  filterBadge: {
    backgroundColor: "#FF6B6B",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  resetButton: {
    color: "#FF6B6B",
    fontSize: 16,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  sectionContent: {
    paddingHorizontal: 20,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  optionsColumn: {
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  selectedChip: {
    backgroundColor: "rgba(70, 130, 180, 0.3)",
    borderColor: "#4682B4",
  },
  optionText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  selectedText: {
    color: "#fff",
    fontWeight: "600",
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
  },
  selectedButton: {
    backgroundColor: "rgba(70, 130, 180, 0.3)",
    borderColor: "#4682B4",
  },
  optionButtonText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
    textAlign: "center",
  },
  selectedButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 100,
  },
  applyContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  applyButton: {
    backgroundColor: "#2F78D4",
    borderRadius: 99,
    paddingVertical: 16,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
