import React from 'react';

import { withClassName } from './className';

export function createClassNameView<TView extends React.ComponentType<any>>(View: TView) {
  return React.forwardRef(({ style, className, ...props }: any, forwardedRef: React.Ref<TView>) => {
    return <View ref={forwardedRef} style={withClassName(style, className)} {...props} />;
  });
}
