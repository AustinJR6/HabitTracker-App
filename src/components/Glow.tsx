import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette } from '../theme/palette';

const Glow: React.FC = () => {
  return (
    <View pointerEvents="none" style={styles.container}>
      <LinearGradient
        colors={[palette.glow, 'transparent']}
        start={{ x: 0.5, y: 0.2 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.glow}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    top: -120,
  },
  glow: {
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'transparent',
  },
});

export default Glow;
