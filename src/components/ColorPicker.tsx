import React from 'react';
import { View, Pressable } from 'react-native';
import { HABIT_COLORS } from '../theme/palette';

export function ColorPicker({ value, onChange }: { value?: string; onChange: (hex: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {HABIT_COLORS.map((hex) => {
        const selected = value === hex;
        return (
          <Pressable
            key={hex}
            onPress={() => onChange(hex)}
            style={{
              width: 28, height: 28, borderRadius: 14, backgroundColor: hex,
              borderWidth: selected ? 3 : 1,
              borderColor: selected ? '#fff' : 'rgba(255,255,255,0.3)',
            }}
          />
        );
      })}
    </View>
  );
}

export default ColorPicker;
