import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoCssViewProps } from './ExpoCssView.types';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
// @ts-ignore
import processFilter from 'react-native/Libraries/StyleSheet/processFilter';

const NativeView: React.ComponentType<ExpoCssViewProps> = requireNativeView('ExpoCssView');

const rnUnsupportedStyleProps: Record<string, { process: (value: any) => any }> = {
  backdropFilter: {
    process: processFilter,
  },
};

const separateStyles = (styles: StyleProp<ViewStyle>) => {
  const flattenedStyles = StyleSheet.flatten(styles);

  const supported: any = {};
  const unsupported: any = {};

  for (const [key, value] of Object.entries(flattenedStyles)) {
    if (rnUnsupportedStyleProps[key]) {
      unsupported[key] = rnUnsupportedStyleProps[key].process(value);
    } else {
      supported[key] = value;
    }
  }

  return { supported, unsupported };
};

export default function ExpoCssView(props: ExpoCssViewProps) {
  const { supported, unsupported } = separateStyles(props.style);
  return <NativeView {...props} style={supported} {...unsupported} />;
}
