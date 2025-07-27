import createElement from 'react-native-web/dist/exports/createElement';

import { TextProps } from '../primitives/Text';

export function BR(props: TextProps) {
  return createElement('br', props);
}
