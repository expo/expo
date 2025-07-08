import React from 'react';
import { View } from 'react-native';

import BlurViewWithControls from './BlurViewWithControls';

export default function BlurViewNativeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <BlurViewWithControls blurMethod="dimezisBlurView" tint="regular" />
    </View>
  );
}
