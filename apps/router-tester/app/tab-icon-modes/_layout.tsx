import { NativeTabs } from 'expo-router/native-tabs';

const multicolorDot = require('@/assets/multicolor-dot.png');

export default function Layout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Image</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={multicolorDot}
          renderingMode={{ default: 'template', selected: 'original' }}
          tinting={{ default: 'tinted', selected: 'original' }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="symbol">
        <NativeTabs.Trigger.Label>Symbol</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'cloud.sun', selected: 'cloud.sun.fill' }}
          renderingMode={{ default: 'template', selected: 'original' }}
          md="cloud"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="auto">
        <NativeTabs.Trigger.Label>Auto</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={multicolorDot} selectedColor="#8e44ad" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="original">
        <NativeTabs.Trigger.Label>Original</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="sun.max.fill"
          renderingMode="original"
          src={multicolorDot}
          tinting="original"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
