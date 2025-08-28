import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../theme/palette';
import { metrics } from '../theme/metrics';

const Header: React.FC = () => {
  return (
    <View style={styles.container}>
      <Ionicons name="flame" size={28} color={palette.accentEnd} style={styles.icon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Habbit Tracker</Text>
        <Text style={styles.subtitle}>Win the day, grow the flame</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: metrics.pad,
    paddingTop: metrics.pad,
    paddingBottom: metrics.gap,
    backgroundColor: 'transparent',
  },
  icon: {
    marginRight: metrics.gap,
  },
  title: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: palette.textDim,
    fontSize: 13,
    marginTop: 2,
  },
});

export default Header;

