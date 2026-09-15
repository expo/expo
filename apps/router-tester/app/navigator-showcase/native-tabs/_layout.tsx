import { NativeTabs } from 'expo-router/native-tabs';
import { useState } from 'react';

import { ShowcaseAccessory } from '@/components/navigator-showcase/showcase-accessory';

export default function NativeTabsShowcaseLayout() {
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <NativeTabs>
      {process.env.EXPO_OS === 'ios' && (
        <NativeTabs.BottomAccessory>
          <ShowcaseAccessory isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
        </NativeTabs.BottomAccessory>
      )}
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'play.circle', selected: 'play.circle.fill' }}
          md="home"
        />
        <NativeTabs.Trigger.Label>
          {process.env.EXPO_OS === 'ios' ? 'Listen Now' : 'Home'}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="library">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'rectangle.stack', selected: 'rectangle.stack.fill' }}
          md="local_library"
        />
        <NativeTabs.Trigger.Label>Library</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search" role="search">
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
