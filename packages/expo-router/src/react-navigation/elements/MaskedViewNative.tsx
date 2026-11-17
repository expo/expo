/**
 * The native MaskedView that we explicitly re-export for supported platforms: Android, iOS.
 */
import * as React from 'react';
import { UIManager, type ViewProps } from 'react-native';

// Keep the prop type independent of the optional native package.
type Props = ViewProps & {
  maskElement: React.ReactElement;
  androidRenderingMode?: 'software' | 'hardware';
  children: React.ReactElement;
};

let RNCMaskedView: React.ComponentType<Props> | undefined;

try {
  // Add try/catch to support usage even if it's not installed, since it's optional.
  // Newer versions of Metro will handle it properly.
  RNCMaskedView = require('@react-native-masked-view/masked-view').default;
} catch (e) {
  // Ignore
}

const isMaskedViewAvailable = UIManager.getViewManagerConfig('RNCMaskedView') != null;

export function MaskedView({ children, ...rest }: Props) {
  if (isMaskedViewAvailable && RNCMaskedView) {
    return <RNCMaskedView {...rest}>{children}</RNCMaskedView>;
  }

  return children;
}
