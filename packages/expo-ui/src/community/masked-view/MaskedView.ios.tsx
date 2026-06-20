import { StyleSheet, View } from 'react-native';

import type { MaskedViewProps } from './types';
import { Host } from '../../swift-ui/Host';
import { Mask } from '../../swift-ui/Mask';
import { RNHostView } from '../../swift-ui/RNHostView';

/**
 * iOS implementation of `MaskedView`. Bridges arbitrary React Native children
 * (and `maskElement`) into the SwiftUI `Mask` primitive via `RNHostView`.
 */
export function MaskedView(props: MaskedViewProps) {
  const { maskElement, children, style, ...viewProps } = props;
  // `style` is applied only to the outer container. Re-applying it inside the
  // Host/Mask wrappers used to double offsets (`translateX`, `marginLeft`, …)
  // and transforms because the inner views inherit layout from `absoluteFill`.
  return (
    <View {...viewProps} style={style}>
      <Host style={StyleSheet.absoluteFill}>
        <Mask alignment="topLeading">
          <RNHostView>
            <View style={StyleSheet.absoluteFill}>{children}</View>
          </RNHostView>
          <Mask.Content>
            <RNHostView>
              <View style={StyleSheet.absoluteFill}>{maskElement}</View>
            </RNHostView>
          </Mask.Content>
        </Mask>
      </Host>
    </View>
  );
}

export default MaskedView;
