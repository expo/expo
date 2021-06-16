package abi42_0_0.host.exp.exponent.modules.api.components.gesturehandler.react;

import abi42_0_0.com.facebook.react.bridge.WritableMap;
import abi42_0_0.host.exp.exponent.modules.api.components.gesturehandler.GestureHandler;

public interface RNGestureHandlerEventDataExtractor<T extends GestureHandler> {
  void extractEventData(T handler, WritableMap eventData);
}
