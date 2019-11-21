package abi36_0_0.host.exp.exponent.modules.api.safeareacontext;

import abi36_0_0.com.facebook.react.common.MapBuilder;
import abi36_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi36_0_0.com.facebook.react.uimanager.UIManagerModule;
import abi36_0_0.com.facebook.react.uimanager.ViewGroupManager;
import abi36_0_0.com.facebook.react.uimanager.events.EventDispatcher;

import java.util.Map;

import androidx.annotation.NonNull;

public class SafeAreaViewManager extends ViewGroupManager<SafeAreaView> {
  @Override
  @NonNull
  public String getName() {
    return "RNCSafeAreaView";
  }

  @Override
  @NonNull
  public SafeAreaView createViewInstance(@NonNull ThemedReactContext context) {
    return new SafeAreaView(context);
  }

  @Override
  protected void addEventEmitters(@NonNull ThemedReactContext reactContext, @NonNull final SafeAreaView view) {
    final EventDispatcher dispatcher =
        reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
    view.setOnInsetsChangeListener(new SafeAreaView.OnInsetsChangeListener() {
      @Override
      public void onInsetsChange(SafeAreaView view, EdgeInsets insets) {
        dispatcher.dispatchEvent(new InsetsChangeEvent(view.getId(), insets));
      }
    });
  }

  @Override
  public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.<String, Object>builder()
        .put(InsetsChangeEvent.EVENT_NAME, MapBuilder.of("registrationName", "onInsetsChange"))
        .build();
  }
}
