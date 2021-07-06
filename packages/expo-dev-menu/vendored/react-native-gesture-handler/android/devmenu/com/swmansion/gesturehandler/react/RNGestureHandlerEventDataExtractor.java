package devmenu.com.swmansion.gesturehandler.react;

import com.facebook.react.bridge.WritableMap;
import devmenu.com.swmansion.gesturehandler.GestureHandler;

public interface RNGestureHandlerEventDataExtractor<T extends GestureHandler> {
  void extractEventData(T handler, WritableMap eventData);
}
