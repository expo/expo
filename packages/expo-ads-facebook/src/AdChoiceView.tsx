import React from 'react';
import { View } from 'react-native';
import { requireNativeViewManager } from '@unimodules/core';

type Props = React.ComponentProps<typeof View>;

export default class AdChoiceView extends React.Component<Props> {
  render() {
    return <NativeAdChoiceView {...this.props} />;
  }
}

// The native AdChoiceView has the same props as regular View
export type NativeAdChoiceView = React.Component<Props>;
export const NativeAdChoiceView = requireNativeViewManager('AdChoiceWrapper');
