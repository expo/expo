import { ComponentType, forwardRef } from 'react';
import createElement from 'react-native-web/dist/exports/createElement';

import { ViewProps } from '../primitives/View';

export const HR = forwardRef((props: ViewProps, ref) => {
  return createElement('hr', { ...props, ref });
}) as ComponentType<ViewProps>;
