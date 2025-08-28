import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Glow from './Glow';
import { palette } from '../theme/palette';
import { metrics } from '../theme/metrics';

interface Props {
  streak: number;
}

const StreakCounter: React.FC<Props> = ({ streak }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const prevStreak = useRef(streak);

  useEffect(() => {
    if (streak > prevStreak.current) {
      scale.setValue(0.9);
      fade.setValue(0);
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    prevStreak.current = streak;
  }, [streak]);

  return (
    <View style={styles.wrapper}>
      <Glow />
      <Animated.View style={[styles.container, { transform: [{ scale }], opacity: fade }]}>
        <Ionicons name="flame" size={40} color={palette.accentEnd} style={{ marginRight: 8 }} />
        <Text style={styles.count}>{streak}</Text>
        <Text style={styles.label}>day streak</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginVertical: metrics.pad,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: palette.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    paddingHorizontal: metrics.pad,
    paddingVertical: metrics.pad,
    borderRadius: metrics.radiusXL,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  count: {
    color: palette.text,
    fontSize: 36,
    fontWeight: '800',
    marginRight: 8,
  },
  label: {
    color: palette.textDim,
    fontSize: 16,
    marginBottom: 4,
  },
});

export default StreakCounter;

