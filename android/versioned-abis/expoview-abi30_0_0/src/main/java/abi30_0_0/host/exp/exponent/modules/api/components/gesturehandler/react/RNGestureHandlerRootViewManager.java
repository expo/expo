package abi30_0_0.host.exp.exponent.modules.api.components.gesturehandler.react;

import abi30_0_0.com.facebook.react.common.MapBuilder;
import abi30_0_0.com.facebook.react.module.annotations.ReactModule;
import abi30_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi30_0_0.com.facebook.react.uimanager.ViewGroupManager;

import java.util.Map;

import javax.annotation.Nullable;

/**
 * React native's view manager used for creating instances of {@link }RNGestureHandlerRootView}. It
 * is being used by projects using react-native-navigation where for each screen new root view need
 * to be provided.
 */
@ReactModule(name = RNGestureHandlerRootViewManager.REACT_CLASS)
public class RNGestureHandlerRootViewManager extends ViewGroupManager<RNGestureHandlerRootView> {

  public static final String REACT_CLASS = "GestureHandlerRootView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected RNGestureHandlerRootView createViewInstance(ThemedReactContext reactContext) {
    return new RNGestureHandlerRootView(reactContext);
  }

  @Override
  public void onDropViewInstance(RNGestureHandlerRootView view) {
    view.tearDown();
  }

  /**
   * The following event configuration is necessary even if you are not using
   * GestureHandlerRootView component directly.
   */
  @Override
  public @Nullable Map getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.of(
            RNGestureHandlerEvent.EVENT_NAME,
            MapBuilder.of("registrationName", RNGestureHandlerEvent.EVENT_NAME),
            RNGestureHandlerStateChangeEvent.EVENT_NAME,
            MapBuilder.of("registrationName", RNGestureHandlerStateChangeEvent.EVENT_NAME));
  }
}
