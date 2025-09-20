import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import {
  Alert,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import watchlistService from "../../services/watchlistService";

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  type: "toggle" | "navigation" | "action";
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [showSpoilers, setShowSpoilers] = useState(false);

  const insets = useSafeAreaInsets();

  const handleClearData = useCallback(async () => {
    Alert.alert(
      "Clear All Data",
      "This will remove all your watchlists and saved data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Data",
          style: "destructive",
          onPress: async () => {
            try {
              await watchlistService.clearAllData();
              Alert.alert("Success", "All data has been cleared.");
            } catch (error) {
              console.error("Failed to clear data:", error);
              Alert.alert("Error", "Failed to clear data. Please try again.");
            }
          },
        },
      ]
    );
  }, []);

  const handleExportData = useCallback(() => {
    Alert.alert("Export Data", "Export functionality coming soon!");
  }, []);

  const handleImportData = useCallback(() => {
    Alert.alert("Import Data", "Import functionality coming soon!");
  }, []);

  const handleAbout = useCallback(() => {
    Alert.alert(
      "About Tempus",
      "Tempus is an anime tracking app built with React Native and Expo.\n\nVersion: 1.0.0\nDeveloped with ❤️ for anime fans"
    );
  }, []);

  const handleSupport = useCallback(() => {
    Alert.alert("Support", "Need help? Contact us at hrln.interactive.com");
  }, []);

  const settingSections = [
    {
      title: "Preferences",
      items: [
        {
          id: "notifications",
          title: "Push Notifications",
          subtitle: "Get notified about new episodes",
          icon: "notifications-outline",
          type: "toggle" as const,
          value: notifications,
          onToggle: setNotifications,
        },
        {
          id: "darkMode",
          title: "Dark Mode",
          subtitle: "Use dark theme",
          icon: "moon-outline",
          type: "toggle" as const,
          value: darkMode,
          onToggle: setDarkMode,
        },
        {
          id: "autoPlay",
          title: "Auto-play Trailers",
          subtitle: "Automatically play video previews",
          icon: "play-circle-outline",
          type: "toggle" as const,
          value: autoPlay,
          onToggle: setAutoPlay,
        },
        {
          id: "spoilers",
          title: "Show Spoilers",
          subtitle: "Display spoiler content in descriptions",
          icon: "eye-outline",
          type: "toggle" as const,
          value: showSpoilers,
          onToggle: setShowSpoilers,
        },
      ],
    },
    {
      title: "Data Management",
      items: [
        {
          id: "export",
          title: "Export Data",
          subtitle: "Save your watchlists to a file",
          icon: "download-outline",
          type: "navigation" as const,
          onPress: handleExportData,
        },
        {
          id: "import",
          title: "Import Data",
          subtitle: "Restore watchlists from a file",
          icon: "cloud-upload-outline",
          type: "navigation" as const,
          onPress: handleImportData,
        },
        {
          id: "clear",
          title: "Clear All Data",
          subtitle: "Remove all watchlists and settings",
          icon: "trash-outline",
          type: "action" as const,
          onPress: handleClearData,
        },
      ],
    },
    {
      title: "About",
      items: [
        {
          id: "about",
          title: "About Tempus",
          subtitle: "App information and version",
          icon: "information-circle-outline",
          type: "navigation" as const,
          onPress: handleAbout,
        },
        {
          id: "support",
          title: "Support",
          subtitle: "Get help and contact us",
          icon: "help-circle-outline",
          type: "navigation" as const,
          onPress: handleSupport,
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.settingItem,
          item.type === "action" && styles.settingItemDanger,
        ]}
        onPress={item.onPress}
        disabled={item.type === "toggle"}
        activeOpacity={item.type === "toggle" ? 1 : 0.7}
      >
        <BlurView
          intensity={60}
          style={[
            styles.settingItemBlur,
            item.type === "action" && styles.settingItemBlurDanger,
          ]}
        >
          <View style={styles.settingItemContent}>
            <View style={styles.settingItemLeft}>
              <View
                style={[
                  styles.settingItemIcon,
                  item.type === "action" && styles.settingItemIconDanger,
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={item.type === "action" ? "#FF5252" : "#fff"}
                />
              </View>
              <View style={styles.settingItemText}>
                <Text
                  style={[
                    styles.settingItemTitle,
                    item.type === "action" && styles.settingItemTitleDanger,
                  ]}
                >
                  {item.title}
                </Text>
                {item.subtitle && (
                  <Text style={styles.settingItemSubtitle}>
                    {item.subtitle}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.settingItemRight}>
              {item.type === "toggle" && (
                <Switch
                  value={item.value}
                  onValueChange={item.onToggle}
                  trackColor={{
                    false: "rgba(255, 255, 255, 0.2)",
                    true: "#4CAF50",
                  }}
                  thumbColor="#fff"
                />
              )}
              {item.type === "navigation" && (
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="rgba(255, 255, 255, 0.6)"
                />
              )}
            </View>
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  const renderSection = (section: { title: string; items: SettingItem[] }) => {
    return (
      <View key={section.title} style={styles.section}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <View style={styles.sectionContent}>
          {section.items.map(renderSettingItem)}
        </View>
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
        <View style={styles.container}>
          {/* Header */}
          <BlurView
            intensity={50}
            style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}
          >
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Settings</Text>
            </View>
          </BlurView>

          {/* Settings Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {settingSections.map(renderSection)}

            {/* App Version Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Tempus v1.0.0</Text>
              <Text style={styles.footerSubtext}>
                Made with ❤️ for anime fans
              </Text>
            </View>
          </ScrollView>
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
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 160,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionContent: {
    gap: 12,
  },
  settingItem: {
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  settingItemDanger: {
    borderColor: "rgba(255, 82, 82, 0.3)",
  },
  settingItemBlur: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  settingItemBlurDanger: {
    backgroundColor: "rgba(255, 82, 82, 0.1)",
  },
  settingItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingItemIconDanger: {
    backgroundColor: "rgba(255, 82, 82, 0.2)",
  },
  settingItemText: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
    marginBottom: 2,
  },
  settingItemTitleDanger: {
    color: "#FF5252",
  },
  settingItemSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
  },
  settingItemRight: {
    marginLeft: 12,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 32,
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
  },
});
