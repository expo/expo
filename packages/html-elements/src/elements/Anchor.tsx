import { Linking, Platform } from 'react-native';

import Text from '../primitives/Text';
import type { LinkProps } from './Text.types';

export function A({ href, target, download, rel, ...props }: LinkProps) {
  const nativeProps = Platform.select<LinkProps>({
    web: {
      href,
      hrefAttrs: {
        target,
        download,
        rel,
      },
    },
    default: {
      onPress: (event) => {
        props.onPress && props.onPress(event);
        if (Platform.OS !== 'web' && href !== undefined) {
          Linking.openURL(href);
        }
      },
    },
  });
  return <Text role="link" {...props} {...nativeProps} />;
}
