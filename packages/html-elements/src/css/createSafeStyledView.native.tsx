import React, { useMemo } from 'react';

import { filterStyles } from './filterStyles';

export function createSafeStyledView<TView extends React.ComponentType<any>>(View: TView) {
  return React.forwardRef(({ style, ...props }: any, forwardedRef: React.Ref<TView>) => {
    // Filter and apply `center` prop.
    const finalStyle = useMemo(() => filterStyles(style), [style]);

    return <View ref={forwardedRef} style={finalStyle} {...props} />;
  });
}
