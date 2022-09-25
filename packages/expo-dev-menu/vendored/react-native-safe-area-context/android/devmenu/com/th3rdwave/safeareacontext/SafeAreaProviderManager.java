package devmenu.com.th3rdwave.safeareacontext;

import android.app.Activity;
import android.view.View;
import android.view.ViewGroup;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.events.EventDispatcher;

import java.util.Map;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class SafeAreaProviderManager extends ViewGroupManager<SafeAreaProvider> {
  private final ReactApplicationContext mContext;

  public SafeAreaProviderManager(ReactApplicationContext context) {
    super();

    mContext = context;
  }

  @Override
  @NonNull
  public String getName() {
    return "RNCSafeAreaProvider";
  }

  @Override
  @NonNull
  public SafeAreaProvider createViewInstance(@NonNull ThemedReactContext context) {
    return new SafeAreaProvider(context);
  }

  @Override
  protected void addEventEmitters(@NonNull ThemedReactContext reactContext, @NonNull final SafeAreaProvider view) {
    final EventDispatcher dispatcher =
        reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
    view.setOnInsetsChangeListener(new SafeAreaProvider.OnInsetsChangeListener() {
      @Override
      public void onInsetsChange(SafeAreaProvider view, EdgeInsets insets, Rect frame) {
        dispatcher.dispatchEvent(new InsetsChangeEvent(view.getId(), insets, frame));
      }
    });
  }

  @Override
  public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.<String, Object>builder()
        .put(InsetsChangeEvent.EVENT_NAME, MapBuilder.of("registrationName", "onInsetsChange"))
        .build();
  }

  private @Nullable Map<String, Object> getInitialWindowMetrics() {
    Activity activity = mContext.getCurrentActivity();
    if (activity == null) {
      return null;
    }

    ViewGroup decorView = (ViewGroup) activity.getWindow().getDecorView();
    if (decorView == null) {
      return null;
    }

    View contentView = decorView.findViewById(android.R.id.content);
    if (contentView == null) {
      return null;
    }
    EdgeInsets insets = SafeAreaUtils.getSafeAreaInsets(decorView);
    Rect frame = SafeAreaUtils.getFrame(decorView, contentView);
    if (insets == null || frame == null) {
      return null;
    }
    return MapBuilder.<String, Object>of(
        "insets",
        SerializationUtils.edgeInsetsToJavaMap(insets),
        "frame",
        SerializationUtils.rectToJavaMap(frame));
  }

  @Nullable
  @Override
  public Map<String, Object> getExportedViewConstants() {
    return MapBuilder.<String, Object>of(
        "initialWindowMetrics",
        getInitialWindowMetrics());

  }
}
