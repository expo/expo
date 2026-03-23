/**
 * The native MaskedView that we explicitly re-export for supported platforms: Android, iOS.
 */
import * as React from 'react';
import { UIManager } from 'react-native';

type MaskedViewType =
  typeof import('@react-native-masked-view/masked-view').default;

type Props = React.ComponentProps<MaskedViewType> & {
  children: React.ReactElement;
};

let RNCMaskedView: MaskedViewType | undefined;

try {
  // Add try/catch to support usage even if it's not installed, since it's optional.
  // Newer versions of Metro will handle it properly.
  RNCMaskedView = require('@react-native-masked-view/masked-view').default;
} catch (e) {
  // Ignore
}

const isMaskedViewAvailable =
  UIManager.getViewManagerConfig('RNCMaskedView') != null;

export function MaskedView({ children, ...rest }: Props) {
  if (isMaskedViewAvailable && RNCMaskedView) {
    return <RNCMaskedView {...rest}>{children}</RNCMaskedView>;
  }

  return children;
}
