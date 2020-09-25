import { Direction } from './web/constants';
import FlingGestureHandler from './web/FlingGestureHandler';
import LongPressGestureHandler from './web/LongPressGestureHandler';
import NativeViewGestureHandler from './web/NativeViewGestureHandler';
import * as NodeManager from './web/NodeManager';
import PanGestureHandler from './web/PanGestureHandler';
import PinchGestureHandler from './web/PinchGestureHandler';
import RotationGestureHandler from './web/RotationGestureHandler';
import TapGestureHandler from './web/TapGestureHandler';

const Gestures = {
  PanGestureHandler,
  RotationGestureHandler,
  PinchGestureHandler,
  TapGestureHandler,
  NativeViewGestureHandler,
  LongPressGestureHandler,
  FlingGestureHandler,
  // ForceTouchGestureHandler,
};

export default {
  Direction,
  handleSetJSResponder(tag, blockNativeResponder) {
    console.warn('handleSetJSResponder: ', tag, blockNativeResponder);
  },
  handleClearJSResponder() {
    console.warn('handleClearJSResponder: ');
  },
  createGestureHandler(handlerName, handlerTag, config) {
    if (!(handlerName in Gestures))
      throw new Error(`react-native-gesture-handler: ${handlerName} is not supported on web.`);
    const GestureClass = Gestures[handlerName];
    NodeManager.createGestureHandler(handlerTag, new GestureClass());
    this.updateGestureHandler(handlerTag, config);
  },
  attachGestureHandler(handlerTag, newView) {
    NodeManager.getHandler(handlerTag).setView(newView);
  },
  updateGestureHandler(handlerTag, newConfig) {
    NodeManager.getHandler(handlerTag).updateGestureConfig(newConfig);
  },
  getGestureHandlerNode(handlerTag) {
    return NodeManager.getHandler(handlerTag);
  },
  dropGestureHandler(handlerTag) {
    NodeManager.dropGestureHandler(handlerTag);
  },
};
