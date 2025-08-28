import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  streak: number;
}

const StreakCounter: React.FC<Props> = ({ streak }) => (
  <View style={{ alignItems: 'center', marginVertical: 16 }}>
    <Text style={{ fontSize: 32 }}>🔥 {streak}</Text>
  </View>
);

export default StreakCounter;
