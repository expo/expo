import React, { ComponentType, forwardRef } from 'react';

import View, { ViewProps } from '../primitives/View';

export const Section = forwardRef((props: ViewProps, ref) => {
  return <View accessibilityRole="summary" {...props} ref={ref} />;
}) as ComponentType<ViewProps>;
