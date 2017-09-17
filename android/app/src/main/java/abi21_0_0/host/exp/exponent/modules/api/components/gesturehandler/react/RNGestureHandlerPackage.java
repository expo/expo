package abi21_0_0.host.exp.exponent.modules.api.components.gesturehandler.react;

import android.view.View;

import abi21_0_0.com.facebook.react.ReactPackage;
import abi21_0_0.com.facebook.react.bridge.NativeModule;
import abi21_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi21_0_0.com.facebook.react.common.MapBuilder;
import abi21_0_0.com.facebook.react.uimanager.ReactShadowNode;
import abi21_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi21_0_0.com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import javax.annotation.Nullable;

public class RNGestureHandlerPackage implements ReactPackage {

  /**
   * This is an empty implementation of {@link ViewManager}. It is used only to export direct
   * event configuration through {@link UIManagerModule}.
   */
  private static class DummyViewManager extends ViewManager {
    @Override
    public String getName() {
      return "GestureHandlerDummyView";
    }

    @Override
    public ReactShadowNode createShadowNodeInstance() {
      return null;
    }

    @Override
    public Class getShadowNodeClass() {
      return ReactShadowNode.class;
    }

    @Override
    protected View createViewInstance(ThemedReactContext reactContext) {
      return null;
    }

    @Override
    public void updateExtraData(View root, Object extraData) {
    }

    @Override
    public @Nullable Map getExportedCustomDirectEventTypeConstants() {
      return MapBuilder.of(
              RNGestureHandlerEvent.EVENT_NAME,
              MapBuilder.of("registrationName", RNGestureHandlerEvent.EVENT_NAME),
              RNGestureHandlerStateChangeEvent.EVENT_NAME,
              MapBuilder.of("registrationName", RNGestureHandlerStateChangeEvent.EVENT_NAME));
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
