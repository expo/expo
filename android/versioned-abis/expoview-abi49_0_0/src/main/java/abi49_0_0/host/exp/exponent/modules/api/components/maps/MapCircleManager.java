package abi49_0_0.host.exp.exponent.modules.api.components.maps;

import android.content.Context;
import android.graphics.Color;
import android.util.DisplayMetrics;
import android.view.WindowManager;

import abi49_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi49_0_0.com.facebook.react.bridge.ReadableMap;
import abi49_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi49_0_0.com.facebook.react.uimanager.ViewGroupManager;
import abi49_0_0.com.facebook.react.uimanager.annotations.ReactProp;
import com.google.android.gms.maps.model.LatLng;

public class MapCircleManager extends ViewGroupManager<MapCircle> {
  private final DisplayMetrics metrics;

  public MapCircleManager(ReactApplicationContext reactContext) {
    super();
    metrics = new DisplayMetrics();
    ((WindowManager) reactContext.getSystemService(Context.WINDOW_SERVICE))
        .getDefaultDisplay()
        .getRealMetrics(metrics);
  }

  @Override
  public String getName() {
    return "AIRMapCircle";
  }

  @Override
  public MapCircle createViewInstance(ThemedReactContext context) {
    return new MapCircle(context);
  }

  @ReactProp(name = "center")
  public void setCenter(MapCircle view, ReadableMap center) {
    view.setCenter(new LatLng(center.getDouble("latitude"), center.getDouble("longitude")));
  }

  @ReactProp(name = "radius", defaultDouble = 0)
  public void setRadius(MapCircle view, double radius) {
    view.setRadius(radius);
  }

  @ReactProp(name = "strokeWidth", defaultFloat = 1f)
  public void setStrokeWidth(MapCircle view, float widthInPoints) {
    float widthInScreenPx = metrics.density * widthInPoints; // done for parity with iOS
    view.setStrokeWidth(widthInScreenPx);
  }

  @ReactProp(name = "fillColor", defaultInt = Color.RED, customType = "Color")
  public void setFillColor(MapCircle view, int color) {
    view.setFillColor(color);
  }

  @ReactProp(name = "strokeColor", defaultInt = Color.RED, customType = "Color")
  public void setStrokeColor(MapCircle view, int color) {
    view.setStrokeColor(color);
  }

  @ReactProp(name = "zIndex", defaultFloat = 1.0f)
  public void setZIndex(MapCircle view, float zIndex) {
    view.setZIndex(zIndex);
  }

}
