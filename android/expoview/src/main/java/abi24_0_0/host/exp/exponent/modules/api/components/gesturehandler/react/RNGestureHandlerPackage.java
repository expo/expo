package abi24_0_0.host.exp.exponent.modules.api.components.gesturehandler.react;

import abi24_0_0.com.facebook.react.ReactPackage;
import abi24_0_0.com.facebook.react.bridge.NativeModule;
import abi24_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi24_0_0.com.facebook.react.common.MapBuilder;
import abi24_0_0.com.facebook.react.uimanager.ViewManager;
import abi24_0_0.com.facebook.react.views.view.ReactViewManager;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import javax.annotation.Nullable;

public class RNGestureHandlerPackage implements ReactPackage {

  /**
   * This is an empty implementation of {@link ViewManager}. It is only used to export direct
   * event configuration through {@link UIManagerModule} – no actual views using this manager gets
   * instantiated. The direct event configuration serves the purpose of translating event names from
   * event names used in native code to "registration names" used in JS. This is necessary for the
   * native Animated implementation that has to match events by their names on the native side by
   * their "registration names" passed down from JS. For relevant code parts please refer to the
   * following react-native core code parts:
   *  - {@link UIManagerModule.CustomEventNamesResolver}
   *  - {@link UIManagerModuleConstantsHelper#createConstantsForViewManager}
   *  - {@link NativeAnimatedNodesManager#handleEvent}
   */
  private static class DummyViewManager extends ReactViewManager {
    @Override
    public String getName() {
      return "GestureHandlerDummyView";
    }

    @Override
    public @Nullable Map getExportedCustomDirectEventTypeConstants() {
      return MapBuilder.of(
              RNGestureHandlerEvent.EVENT_NAME,
              MapBuilder.of("registrationName", RNGestureHandlerEvent.REGISTRATION_NAME),
              RNGestureHandlerStateChangeEvent.EVENT_NAME,
              MapBuilder.of("registrationName", RNGestureHandlerStateChangeEvent.REGISTRATION_NAME));
    }
  }

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    return Arrays.<NativeModule>asList(new RNGestureHandlerModule(reactContext));
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return Arrays.<ViewManager>asList(
            new RNGestureHandlerButtonViewManager(),
            new DummyViewManager());
  }
}
