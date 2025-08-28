import React from 'react';
import { SafeAreaView } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import { AppStoreProvider } from './src/state/useAppStore';

const App: React.FC = () => (
  <AppStoreProvider>
    <SafeAreaView style={{ flex: 1 }}>
      <HomeScreen />
    </SafeAreaView>
  </AppStoreProvider>
);

export default App;
