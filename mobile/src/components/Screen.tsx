import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

export function Screen({
  children,
  scroll = true,
  style,
  refreshing,
  onRefresh,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const pad = { paddingTop: insets.top + 8, paddingBottom: 24, paddingHorizontal: 16 };

  if (!scroll) {
    return <View style={[styles.fill, { backgroundColor: theme.bg }, pad, style]}>{children}</View>;
  }

  return (
    <ScrollView
      style={[styles.fill, { backgroundColor: theme.bg }]}
      contentContainerStyle={[pad, style]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={theme.accent} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
