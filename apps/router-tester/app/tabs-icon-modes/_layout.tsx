import { NativeTabs, type NativeTabsTriggerIconProps } from 'expo-router/native-tabs';
import { useState } from 'react';

import { TabIconModesContext } from '../../components/tab-icon-modes';

// A transparent four-color image. An opaque image renders as a solid square with `template`.
const multicolorDot = require('../../assets/multicolor-dot.png');

// Returns the `Icon` element itself, because `NativeTabs.Trigger` reads only its direct children.
function icon(
  symbols: boolean,
  props: Pick<NativeTabsTriggerIconProps, 'renderingMode' | 'selectedColor'>
) {
  if (symbols) {
    return <NativeTabs.Trigger.Icon sf="cloud.sun.fill" md="partly_cloudy_day" {...props} />;
  }
  return <NativeTabs.Trigger.Icon src={multicolorDot} {...props} />;
}

export default function Layout() {
  const [symbols, setSymbols] = useState(false);
  return (
    <TabIconModesContext.Provider value={{ symbols, setSymbols }}>
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>Template</NativeTabs.Trigger.Label>
          {icon(symbols, { renderingMode: 'template' })}
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="original">
          <NativeTabs.Trigger.Label>Original</NativeTabs.Trigger.Label>
          {icon(symbols, { renderingMode: 'original' })}
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="unset">
          <NativeTabs.Trigger.Label>Not set</NativeTabs.Trigger.Label>
          {icon(symbols, { selectedColor: '#8e44ad' })}
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="no-color">
          <NativeTabs.Trigger.Label>No color</NativeTabs.Trigger.Label>
          {icon(symbols, {})}
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="per-state">
          <NativeTabs.Trigger.Label>Per state</NativeTabs.Trigger.Label>
          {icon(symbols, { renderingMode: { default: 'template', selected: 'original' } })}
        </NativeTabs.Trigger>
      </NativeTabs>
    </TabIconModesContext.Provider>
  );
}
