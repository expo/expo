package abi47_0_0.host.exp.exponent.modules.api.components.maps;

import android.content.Context;
import android.util.DisplayMetrics;
import android.view.WindowManager;

import androidx.annotation.Nullable;

import abi47_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi47_0_0.com.facebook.react.bridge.ReadableArray;
import abi47_0_0.com.facebook.react.common.MapBuilder;
import abi47_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi47_0_0.com.facebook.react.uimanager.ViewGroupManager;
import abi47_0_0.com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

public class AirMapOverlayManager extends ViewGroupManager<AirMapOverlay> {

  public AirMapOverlayManager(ReactApplicationContext reactContext) {
    super();
    DisplayMetrics metrics = new DisplayMetrics();
    ((WindowManager) reactContext.getSystemService(Context.WINDOW_SERVICE))
        .getDefaultDisplay()
        .getRealMetrics(metrics);
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
