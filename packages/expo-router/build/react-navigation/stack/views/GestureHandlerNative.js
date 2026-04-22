'use client';
import * as React from 'react';
import { PanGestureHandler as PanGestureHandlerNative, } from 'react-native-gesture-handler';
import { GestureHandlerRefContext } from '../utils/GestureHandlerRefContext';
export function PanGestureHandler(props) {
    const gestureRef = React.useRef(null);
    return (<GestureHandlerRefContext.Provider value={gestureRef}>
      <PanGestureHandlerNative {...props} ref={gestureRef}/>
    </GestureHandlerRefContext.Provider>);
}
export { GestureHandlerRootView, State as GestureState } from 'react-native-gesture-handler';
//# sourceMappingURL=GestureHandlerNative.js.map