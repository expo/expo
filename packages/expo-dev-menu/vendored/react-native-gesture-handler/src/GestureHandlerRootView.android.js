import React from 'react';
import { View, ViewPropTypes, requireNativeComponent } from 'react-native';

const iface = {
  name: 'GestureHandlerRootView',
  propTypes: {
    ...ViewPropTypes,
  },
};

const GestureHandlerRootViewNative = requireNativeComponent(
  'GestureHandlerRootView',
  iface
);

const GestureHandlerRootViewContext = React.createContext(false);

export default function GestureHandlerRootView({ children, ...rest }) {
  return (
    <GestureHandlerRootViewContext.Consumer>
      {available => {
        if (available) {
          // If we already have a parent wrapped in the gesture handler root view,
          // We don't need to wrap it again in root view
          // We still wrap it in a normal view so our styling stays the same
          return <View {...rest}>{children}</View>;
        }

        return (
          <GestureHandlerRootViewContext.Provider value={true}>
            <GestureHandlerRootViewNative {...rest}>
              {children}
            </GestureHandlerRootViewNative>
          </GestureHandlerRootViewContext.Provider>
        );
      }}
    </GestureHandlerRootViewContext.Consumer>
  );
}
