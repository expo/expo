package versioned.host.exp.exponent.modules.api.components.gesturehandler.react;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.views.view.ReactViewManager;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import javax.annotation.Nullable;

public class RNGestureHandlerPackage implements ReactPackage {

  private static class DummyViewManager extends ViewGroupManager<RNGestureHandlerRootView> {
    @Override
    public String getName() {
      return "GestureHandlerRootView";
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
     *
     * This direct event configuration serves the purpose of translating event names from
     * the names used in native code to "registration names" used in JS. This is necessary for the
     * native Animated implementation that has to match events by their names on the native side
     * given their "registration names" passed down from JS. For relevant code parts please refer to
     * the following react-native core code parts:
     *  - {@link UIManagerModule.CustomEventNamesResolver}
     *  - {@link UIManagerModuleConstantsHelper#createConstantsForViewManager}
     *  - {@link NativeAnimatedNodesManager#handleEvent}
     */
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
