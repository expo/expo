import createElement from 'react-native-web/dist/exports/createElement';

import type { ViewProps } from '../primitives/View';

export function HR(props: ViewProps) {
  return createElement('hr', props);
}
