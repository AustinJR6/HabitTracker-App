import React from 'react';
import { SafeAreaView, StatusBar, View, Pressable, Text, StyleSheet, Platform } from 'react-native';
import { palette } from './src/theme/palette';
import TodayScreen from './src/screens/TodayScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import AddHabitScreen from './src/screens/AddHabitScreen';
import Header from './src/components/Header';
import Glow from './src/components/Glow';
import { useHabitStore } from './src/store/habits';
import { ensureNotifPermissions, scheduleTodayReminders } from './src/notifications';
import * as Notifications from 'expo-notifications';

type Tab = 'today' | 'calendar' | 'add';

const App: React.FC = () => {
  const [tab, setTab] = React.useState<Tab>('today');
  const habits = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);

  React.useEffect(() => {
    ensureNotifPermissions();
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.DEFAULT,
      }).catch(() => {});
    }
  }, []);

  React.useEffect(() => {
    scheduleTodayReminders(habits, logs);
  }, [habits, logs]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <StatusBar barStyle="light-content" />
      <Glow />
      <Header />
      <View style={{ flex: 1 }}>
        {tab === 'today' && <TodayScreen />}
        {tab === 'calendar' && <CalendarScreen />}
        {tab === 'add' && <AddHabitScreen />}
      </View>
      <View style={styles.tabBar}>
        <TabBtn label="Today" active={tab === 'today'} onPress={() => setTab('today')} />
        <TabBtn label="Calendar" active={tab === 'calendar'} onPress={() => setTab('calendar')} />
        <TabBtn label="Add" active={tab === 'add'} onPress={() => setTab('add')} />
      </View>
    </SafeAreaView>
  );
};

function TabBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]} hitSlop={8}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
    backgroundColor: 'rgba(12,22,35,0.8)',
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { backgroundColor: 'rgba(16,34,52,0.6)' },
  tabText: { color: palette.textDim },
  tabTextActive: { color: palette.text },
});

export default App;
