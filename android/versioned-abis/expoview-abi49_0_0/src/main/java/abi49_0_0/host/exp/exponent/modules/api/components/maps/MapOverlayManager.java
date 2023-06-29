package abi49_0_0.host.exp.exponent.modules.api.components.maps;

import android.content.Context;
import android.util.DisplayMetrics;
import android.view.WindowManager;

import androidx.annotation.Nullable;

import abi49_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi49_0_0.com.facebook.react.bridge.ReadableArray;
import abi49_0_0.com.facebook.react.common.MapBuilder;
import abi49_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi49_0_0.com.facebook.react.uimanager.ViewGroupManager;
import abi49_0_0.com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

public class MapOverlayManager extends ViewGroupManager<MapOverlay> {

  public MapOverlayManager(ReactApplicationContext reactContext) {
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
  public MapOverlay createViewInstance(ThemedReactContext context) {
    return new MapOverlay(context);
  }

  @ReactProp(name = "bounds")
  public void setBounds(MapOverlay view, ReadableArray bounds) {
    view.setBounds(bounds);
  }

  @ReactProp(name = "bearing")
  public void setBearing(MapOverlay view, float bearing){
    view.setBearing(bearing);
  }

  @ReactProp(name = "zIndex", defaultFloat = 1.0f)
  public void setZIndex(MapOverlay view, float zIndex) {
    view.setZIndex(zIndex);
  }

  @ReactProp(name = "opacity", defaultFloat = 1.0f)
  public void setOpacity(MapOverlay view, float opacity) {
    view.setTransparency(1 - opacity);
  }

  @ReactProp(name = "image")
  public void setImage(MapOverlay view, @Nullable String source) {
    view.setImage(source);
  }

  @ReactProp(name = "tappable", defaultBoolean = false)
  public void setTappable(MapOverlay view, boolean tapabble) {
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
