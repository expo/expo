import { requireNativeView } from 'expo';
import { StyleSheet, View } from 'react-native';

import { Host } from '../../jetpack-compose/Host';
import { RNHostView } from '../../jetpack-compose/RNHostView';
import { Slot } from '../../jetpack-compose/SlotView';
import { fillMaxSize, matchParentSize } from '../../jetpack-compose/modifiers';
import { getMaskedViewLayout } from './layout';
import type { MaskedViewProps } from './types';

const MaskNativeView: React.ComponentType<{
  alignment?: 'topStart';
  modifiers?: ReturnType<typeof fillMaxSize>[];
  children?: React.ReactNode;
}> = requireNativeView('ExpoUI', 'MaskView');

/**
 * Android implementation of `MaskedView`. Bridges arbitrary React Native children
 * (and `maskElement`) into the Compose `MaskView` primitive via `RNHostView`.
 */
export function MaskedView(props: MaskedViewProps) {
  const { maskElement, children, style, ...viewProps } = props;
  const { outerStyle, contentStyle, matchContents } = getMaskedViewLayout(style);

  if (matchContents) {
    return (
      <View {...viewProps} style={outerStyle}>
        <Host matchContents={matchContents}>
          <MaskNativeView alignment="topStart">
            <RNHostView matchContents={matchContents}>
              <View style={contentStyle}>{children}</View>
            </RNHostView>
            <Slot slotName="content">
              <RNHostView modifiers={[matchParentSize()]}>
                <View style={StyleSheet.absoluteFill}>{maskElement}</View>
              </RNHostView>
            </Slot>
          </MaskNativeView>
        </Host>
      </View>
    );
  }

  return (
    <View {...viewProps} style={outerStyle}>
      <Host style={StyleSheet.absoluteFill}>
        <MaskNativeView alignment="topStart" modifiers={[fillMaxSize()]}>
          <RNHostView modifiers={[fillMaxSize()]}>
            <View style={[StyleSheet.absoluteFill, contentStyle]}>{children}</View>
          </RNHostView>
          <Slot slotName="content">
            <RNHostView modifiers={[fillMaxSize()]}>
              <View style={StyleSheet.absoluteFill}>{maskElement}</View>
            </RNHostView>
          </Slot>
        </MaskNativeView>
      </Host>
    </View>
  );
}

export default MaskedView;
