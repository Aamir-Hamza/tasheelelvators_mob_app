import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { healthColor } from '../utils/format';
import { useTheme } from '../theme/ThemeContext';

export function HealthScoreCircle({
  score,
  size = 148,
  label,
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const { theme } = useTheme();
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score));
  const color = healthColor(pct);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.border}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={circ - (pct / 100) * circ}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.score, { color: theme.text }]}>{pct}</Text>
        <Text style={[styles.sub, { color: theme.muted }]}>{label ?? '%'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', alignItems: 'center' },
  score: { fontSize: 32, fontWeight: '800', letterSpacing: 0.4 },
  sub: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
});
