import { StyleSheet, View } from 'react-native';

import { Host } from '../../swift-ui/Host';
import { Mask } from '../../swift-ui/Mask';
import { RNHostView } from '../../swift-ui/RNHostView';
import { getMaskedViewLayout } from './layout';
import type { MaskedViewProps } from './types';

/**
 * iOS implementation of `MaskedView`. Bridges arbitrary React Native children
 * (and `maskElement`) into the SwiftUI `Mask` primitive via `RNHostView`.
 */
export function MaskedView(props: MaskedViewProps) {
  const { maskElement, children, style, ...viewProps } = props;
  const { outerStyle, contentStyle, matchContents } = getMaskedViewLayout(style);
  const mask = (
    <Mask.Content>
      <RNHostView>
        <View style={StyleSheet.absoluteFill}>{maskElement}</View>
      </RNHostView>
    </Mask.Content>
  );

  if (matchContents) {
    return (
      <View {...viewProps} style={outerStyle}>
        <Host matchContents ignoreSafeArea="all">
          <Mask alignment="topLeading">
            <RNHostView matchContents>
              <View style={contentStyle}>{children}</View>
            </RNHostView>
            {mask}
          </Mask>
        </Host>
      </View>
    );
  }

  return (
    <View {...viewProps} style={outerStyle}>
      <Host style={StyleSheet.absoluteFill} ignoreSafeArea="all">
        <Mask alignment="topLeading">
          <RNHostView>
            <View style={[StyleSheet.absoluteFill, contentStyle]}>{children}</View>
          </RNHostView>
          {mask}
        </Mask>
      </Host>
    </View>
  );
}

export default MaskedView;
