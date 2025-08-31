import React from 'react';
import { Platform, SafeAreaView, KeyboardAvoidingView, ScrollView, ViewStyle } from 'react-native';

type ScreenProps = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  scrollProps?: Partial<React.ComponentProps<typeof ScrollView>>;
};

export default function Screen({ children, style, scrollProps }: ScreenProps) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[{ padding: 16, paddingBottom: 40, flexGrow: 1 }, style]}
          showsVerticalScrollIndicator={false}
          {...scrollProps}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

