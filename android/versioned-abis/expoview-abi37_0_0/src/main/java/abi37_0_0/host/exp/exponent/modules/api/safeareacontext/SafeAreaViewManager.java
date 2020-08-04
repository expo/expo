package abi37_0_0.host.exp.exponent.modules.api.safeareacontext;

import android.app.Activity;
import android.content.Context;
import android.view.View;
import android.view.WindowManager;

import abi37_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi37_0_0.com.facebook.react.common.MapBuilder;
import abi37_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi37_0_0.com.facebook.react.uimanager.UIManagerModule;
import abi37_0_0.com.facebook.react.uimanager.ViewGroupManager;
import abi37_0_0.com.facebook.react.uimanager.events.EventDispatcher;

import java.util.Map;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class SafeAreaViewManager extends ViewGroupManager<SafeAreaView> {
  private final ReactApplicationContext mContext;
  private final WindowManager mWindowManager;

  public SafeAreaViewManager(ReactApplicationContext context) {
    super();

    mContext = context;
    mWindowManager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
  }

  @Override
  @NonNull
  public String getName() {
    return "RNCSafeAreaView";
  }

  @Override
  @NonNull
  public SafeAreaView createViewInstance(@NonNull ThemedReactContext context) {
    return new SafeAreaView(context, mWindowManager);
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

  @Nullable
  @Override
  public Map<String, Object> getExportedViewConstants() {
    Activity activity = mContext.getCurrentActivity();
    if (activity == null) {
      return null;
    }

    View decorView = activity.getWindow().getDecorView();
    if (decorView == null) {
      return null;
    }

    EdgeInsets insets = SafeAreaUtils.getSafeAreaInsets(mWindowManager, decorView);
    if (insets == null) {
      return null;
    }
    return MapBuilder.<String, Object>of(
        "initialWindowSafeAreaInsets",
        SafeAreaUtils.edgeInsetsToJavaMap(insets));

  }
}
