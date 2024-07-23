// import ThreeThing from '@/components/www/three-01.tsx';
import ThreeThing from '@/components/www/ambient-bulb';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';

export default function Route() {
  const { height } = useWindowDimensions();
  const banner = height / 3;
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: '#e2ded2' }}>
        <ThreeThing
          dom={{
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,

              height: banner,
            },
            scrollEnabled: false,
          }}
        />
        <ScrollView
          style={{ flex: 1, position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
          contentContainerStyle={{
            paddingTop: banner,
          }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={i} style={{ height: 72, backgroundColor: i % 2 ? '#e2ded2' : 'white' }} />
          ))}
        </ScrollView>
      </View>
    </>
  );
}
