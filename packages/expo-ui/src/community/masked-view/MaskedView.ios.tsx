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
  return (
    <View {...viewProps} style={style}>
      <Host style={StyleSheet.absoluteFill}>
        <Mask alignment="topLeading">
          <RNHostView>
            <View style={[StyleSheet.absoluteFill, style]}>{children}</View>
          </RNHostView>
          <Mask.Content>
            <RNHostView>
              <View style={[StyleSheet.absoluteFill, style]}>{maskElement}</View>
            </RNHostView>
          </Mask.Content>
        </Mask>
      </Host>
    </View>
  );
}

export default MaskedView;
