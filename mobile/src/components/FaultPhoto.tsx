import React from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';

export function FaultPhoto({ uri }: { uri?: string }) {
  if (!uri) return null;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.frame}>
        <img src={uri} alt="Fault evidence" style={webImg} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      resizeMode="contain"
      accessibilityLabel="Fault evidence"
      style={styles.native}
    />
  );
}

const webImg: React.CSSProperties = {
  width: '100%',
  maxHeight: 280,
  objectFit: 'contain',
  display: 'block',
  backgroundColor: '#111',
  borderRadius: 10,
};

const styles = StyleSheet.create({
  frame: { marginTop: 10, width: '100%' },
  native: {
    width: '100%',
    height: 220,
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: '#111',
  },
});
