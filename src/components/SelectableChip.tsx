import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
}

export default function SelectableChip({ label, selected, onPress, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : styles.unselected,
        pressed && styles.pressed,
        style,
      ]}
      testID={`chip-${label}`}
    >
      <Text style={[styles.text, selected ? styles.textSelected : styles.textUnselected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 2,
    marginRight: 8,
    marginBottom: 8,
  },
  unselected: {
    backgroundColor: '#F1F5F9', // slate-100
    borderColor: '#CBD5E1', // slate-300
  },
  selected: {
    backgroundColor: '#F97316', // strong orange highlight
    borderColor: '#111827', // near-black border
  },
  pressed: { opacity: 0.9 },
  text: { fontSize: 14, fontWeight: '700' },
  textUnselected: { color: '#0F172A' },
  textSelected: { color: '#FFFFFF' },
});

