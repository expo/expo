import { Link, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const colors = ['#ff6a00', '#1e3a8a', '#16a34a', '#c026d3', '#0891b2', '#e11d48'];

export default function CornerRadius() {
  // `?case=` selects where `borderRadius` is set. Docs screenshots use each case.
  const { case: variant = 'none' } = useLocalSearchParams<{ case?: 'none' | 'radius' | 'label' }>();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentInsetAdjustmentBehavior="automatic">
      <SafeAreaView
        edges={['left', 'right']}
        style={{
          padding: 24,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'center',
        }}>
        {colors.map((color) => (
          <Link key={color} href="/link-preview/one" asChild>
            <Link.Trigger>
              {variant === 'label' ? (
                <Pressable style={{ width: 100, borderRadius: 16 }}>
                  <View style={{ height: 100, borderRadius: 16, backgroundColor: color }} />
                  <Text style={{ textAlign: 'center' }}>Label</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: variant === 'radius' ? 16 : 0,
                    backgroundColor: color,
                  }}
                />
              )}
            </Link.Trigger>
            <Link.Menu>
              <Link.MenuAction title="Share" icon="square.and.arrow.up" onPress={() => {}} />
            </Link.Menu>
          </Link>
        ))}
      </SafeAreaView>
    </ScrollView>
  );
}
