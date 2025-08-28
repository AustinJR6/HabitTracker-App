import React from 'react';
import { View, Text, Switch } from 'react-native';

interface Props {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

const HabitItem: React.FC<Props> = ({ label, checked, onToggle }) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
      <Switch value={checked} onValueChange={onToggle} />
      <Text style={{ marginLeft: 8 }}>{label}</Text>
    </View>
  );
};

export default HabitItem;
