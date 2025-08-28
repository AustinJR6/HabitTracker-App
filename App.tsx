import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import { AppStoreProvider } from './src/state/useAppStore';
import { palette } from './src/theme/palette';

const App: React.FC = () => (
  <AppStoreProvider>
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <StatusBar barStyle="light-content" />
      <HomeScreen />
    </SafeAreaView>
  </AppStoreProvider>
);

export default App;
