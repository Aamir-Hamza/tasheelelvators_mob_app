import React from 'react';
import { Image, StyleSheet } from 'react-native';

export function FaultPhoto({ uri }: { uri?: string }) {
  if (!uri) return null;
  return <Image source={{ uri }} style={styles.photo} resizeMode="cover" accessibilityLabel="Fault evidence" />;
}

const styles = StyleSheet.create({
  photo: { width: '100%', height: 180, borderRadius: 10, marginTop: 10, backgroundColor: '#111' },
});
