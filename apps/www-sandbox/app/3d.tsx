import ThreeThing from '@/components/www/three-01.tsx';
import { useState } from 'react';
import { View } from 'react-native';

export default function Route() {
  return (
    <ThreeThing
      webview={{
        scrollEnabled: false,
      }}
    />
  );
}
