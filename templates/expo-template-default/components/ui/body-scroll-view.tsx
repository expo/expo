import React from 'react';
import { ScrollView } from 'react-native';

export function BodyScrollView(props: React.ComponentProps<typeof ScrollView>) {
  return (
    <ScrollView
      automaticallyAdjustsScrollIndicatorInsets={true}
      contentInsetAdjustmentBehavior="automatic"
      scrollToOverflowEnabled
      {...props}
    />
  );
}
