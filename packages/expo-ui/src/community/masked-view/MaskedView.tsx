import { useEffect } from 'react';
import { View } from 'react-native';

import type { MaskedViewProps } from './types';

let warned = false;

/**
 * Renders `children` with the alpha channel of `maskElement` applied as a mask:
 * opaque pixels of `maskElement` reveal `children`, transparent pixels hide them.
 *
 * API-compatible with `@react-native-masked-view/masked-view`.
 */
// This default file is used on platforms without a `.<platform>.tsx` override
// (notably web). It renders children unmasked and warns once.
export function MaskedView(props: MaskedViewProps) {
  const { maskElement: _maskElement, children, style, ...rest } = props;
  useEffect(() => {
    if (!warned) {
      warned = true;
      console.warn(
        '[@expo/ui/community/masked-view] MaskedView is not implemented on this platform. ' +
          'Children will render without a mask.'
      );
    }
  }, []);
  return (
    <View {...rest} style={style}>
      {children}
    </View>
  );
}

export default MaskedView;
