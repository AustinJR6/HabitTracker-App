import React, { useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { palette } from '../theme/palette';
import { metrics } from '../theme/metrics';

interface Props {
  label: string;
  checked: boolean;
  onToggle: () => void;
  color?: string;
}

const HabitItem: React.FC<Props> = ({ label, checked, onToggle, color }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animatePress = (to: number, duration = 100) => {
    Animated.timing(scale, {
      toValue: to,
      duration,
      useNativeDriver: true,
    }).start();
  };

  const onPress = () => {
    Haptics.selectionAsync().catch(() => {});
    onToggle();
  };

  const checkbox = useMemo(() => {
    return (
      <View style={styles.checkboxOuter}>
        {checked ? (
          <LinearGradient
            colors={[palette.accentStart, palette.accentEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.checkboxFill}
          >
            <Feather name="check" size={16} color="#fff" />
          </LinearGradient>
        ) : (
          <View style={styles.checkboxIdle} />
        )}
      </View>
    );
  }, [checked]);

  return (
    <Animated.View style={[styles.container, { borderLeftColor: color || 'transparent', transform: [{ scale }] }]}> 
      <Pressable
        onPress={onPress}
        onPressIn={() => animatePress(0.97)}
        onPressOut={() => animatePress(1)}
        android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
        style={styles.row}
        hitSlop={8}
      >
        {checkbox}
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.card,
    borderRadius: metrics.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
    marginBottom: metrics.gap,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: metrics.pad,
    paddingVertical: metrics.pad,
  },
  checkboxOuter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: palette.checkIdle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: metrics.gap,
  },
  checkboxIdle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'transparent',
  },
  checkboxFill: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: palette.text,
    fontSize: 16,
  },
});

export default HabitItem;
