import React, { useMemo } from 'react';

import { filterStyles } from './filterStyles';

export function createSafeStyledView<TView extends React.ComponentType<any>>(View: TView) {
  return function Safe({ style, ...props }: any) {
    // Filter and apply `center` prop.
    const finalStyle = useMemo(() => filterStyles(style), [style]);

    return <View style={finalStyle} {...props} />;
  };
}
