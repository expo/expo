package abi44_0_0.host.exp.exponent.modules.api.components.maps;

import android.content.Context;
import android.os.Build;
import android.util.DisplayMetrics;
import android.view.WindowManager;

import abi44_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi44_0_0.com.facebook.react.bridge.ReadableArray;
import abi44_0_0.com.facebook.react.common.MapBuilder;
import abi44_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi44_0_0.com.facebook.react.uimanager.ViewGroupManager;
import abi44_0_0.com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

import javax.annotation.Nullable;

public class AirMapOverlayManager extends ViewGroupManager<AirMapOverlay> {
  private final DisplayMetrics metrics;

  public AirMapOverlayManager(ReactApplicationContext reactContext) {
    super();
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
      metrics = new DisplayMetrics();
      ((WindowManager) reactContext.getSystemService(Context.WINDOW_SERVICE))
          .getDefaultDisplay()
          .getRealMetrics(metrics);
    } else {
      metrics = reactContext.getResources().getDisplayMetrics();
    }
  }

  @Override
  public String getName() {
    return "AIRMapOverlay";
  }

  @Override
  public AirMapOverlay createViewInstance(ThemedReactContext context) {
    return new AirMapOverlay(context);
  }

  @ReactProp(name = "bounds")
  public void setBounds(AirMapOverlay view, ReadableArray bounds) {
    view.setBounds(bounds);
  }

  @ReactProp(name = "bearing")
  public void setBearing(AirMapOverlay view, float bearing){
    view.setBearing(bearing);
  }

  @ReactProp(name = "zIndex", defaultFloat = 1.0f)
  public void setZIndex(AirMapOverlay view, float zIndex) {
    view.setZIndex(zIndex);
  }

  @ReactProp(name = "opacity", defaultFloat = 1.0f)
  public void setOpacity(AirMapOverlay view, float opacity) {
    view.setTransparency(1 - opacity);
  }

  @ReactProp(name = "image")
  public void setImage(AirMapOverlay view, @Nullable String source) {
    view.setImage(source);
  }

  @ReactProp(name = "tappable", defaultBoolean = false)
  public void setTappable(AirMapOverlay view, boolean tapabble) {
    view.setTappable(tapabble);
  }

  @Override
  @Nullable
  public Map getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.of(
        "onPress", MapBuilder.of("registrationName", "onPress")
    );
  }
}
