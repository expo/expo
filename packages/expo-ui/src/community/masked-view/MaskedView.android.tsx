import { requireNativeView } from 'expo';
import { StyleSheet, View } from 'react-native';

import type { MaskedViewProps } from './types';
import { Host } from '../../jetpack-compose/Host';
import { RNHostView } from '../../jetpack-compose/RNHostView';
import { Slot } from '../../jetpack-compose/SlotView';
import { fillMaxSize } from '../../jetpack-compose/modifiers';

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
  // `style` is applied only to the outer container. Re-applying it inside the
  // Host/MaskView wrappers used to double offsets (`translateX`, `marginLeft`, …)
  // and transforms because the inner views inherit layout from `absoluteFill`.
  return (
    <View {...viewProps} style={style}>
      <Host style={StyleSheet.absoluteFill}>
        <MaskNativeView alignment="topStart" modifiers={[fillMaxSize()]}>
          <RNHostView modifiers={[fillMaxSize()]}>
            <View style={StyleSheet.absoluteFill}>{children}</View>
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
