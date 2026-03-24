import * as React from 'react';

export const GestureHandlerRefContext = React.createContext<React.Ref<
  import('react-native-gesture-handler').PanGestureHandler
> | null>(null);
