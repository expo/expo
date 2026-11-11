import React from 'react';
import { Text, View } from 'react-native';

// Launch screen for the `expo-splash-screen` prerender: the first route (`/test-suite`: native
// stack header, list of test modules with checkboxes, "Select all / Run tests" footer, native tabs)
// drawn with core components only. Rendered at build time through Fabric's renderer, so it must
// stay free of native modules and runtime state. Light appearance only for now.

const colors = {
  background: '#FFFFFF',
  bar: '#F7F7F7',
  text: '#000000',
  secondary: '#8E8E93',
  separator: '#E5E5EA',
  tint: '#007AFF',
  tabPill: '#E6E6E8',
};

const MODULES = [
  'Application',
  'AppMetrics',
  'Asset',
  'Audio',
  'AuthSession',
  'Basic',
  'Battery',
  'Blob',
  'Blur',
  'Brightness (device-only)',
  'Calendar',
  'Calendar@legacy',
];
const TABS = ['Tests', 'Playground', 'APIs', 'Components'];

export default function LaunchScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: 62,
          height: 106,
          backgroundColor: colors.bar,
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: 12,
        }}>
        <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>Expo Test Suite</Text>
        <View
          style={{
            position: 'absolute',
            right: 16,
            bottom: 6,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.tabPill,
          }}
        />
      </View>
      {MODULES.map((label) => (
        <View
          key={label}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 10,
            paddingHorizontal: 16,
            height: 39,
            borderBottomWidth: 1,
            borderBottomColor: colors.separator,
          }}>
          <Text style={{ fontSize: 16, color: colors.text }}>{label}</Text>
          <View style={{ width: 18, height: 18, borderRadius: 3, borderWidth: 2, borderColor: colors.tint }} />
        </View>
      ))}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 118,
          backgroundColor: colors.bar,
        }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.separator,
          }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.tint }}>Select all</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#B0CFF5' }}>Run tests</Text>
        </View>
        <View style={{ flexDirection: 'row', paddingTop: 8, paddingHorizontal: 20, justifyContent: 'space-between' }}>
          {TABS.map((label, index) => (
            <View
              key={label}
              style={{
                width: 72,
                alignItems: 'center',
                gap: 3,
                paddingVertical: 6,
                borderRadius: 18,
                backgroundColor: index === 0 ? colors.tabPill : undefined,
              }}>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 5,
                  borderWidth: 2,
                  borderColor: index === 0 ? colors.tint : colors.secondary,
                }}
              />
              <Text style={{ fontSize: 10, fontWeight: '500', color: index === 0 ? colors.tint : colors.secondary }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
