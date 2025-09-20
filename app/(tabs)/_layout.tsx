import React from "react";

import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger role="search" name="index">
        <Label>Search</Label>
        <Icon sf="magnifyingglass" drawable="custom_search_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <Icon sf="list.bullet" drawable="custom_watchlist_drawable" />
        <Label>Watchlist</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
