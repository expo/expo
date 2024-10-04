package abi47_0_0.host.exp.exponent.modules.api.components.maps;

import android.content.Context;
import android.graphics.Color;
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

public class AirMapPolygonManager extends ViewGroupManager<AirMapPolygon> {
  private final DisplayMetrics metrics;

  public AirMapPolygonManager(ReactApplicationContext reactContext) {
    super();
    metrics = new DisplayMetrics();
    ((WindowManager) reactContext.getSystemService(Context.WINDOW_SERVICE))
        .getDefaultDisplay()
        .getRealMetrics(metrics);
  }

  @Override
  public String getName() {
    return "AIRMapPolygon";
  }

  @Override
  public AirMapPolygon createViewInstance(ThemedReactContext context) {
    return new AirMapPolygon(context);
  }

  @ReactProp(name = "coordinates")
  public void setCoordinate(AirMapPolygon view, ReadableArray coordinates) {
    view.setCoordinates(coordinates);
  }

  @ReactProp(name = "holes")
  public  void setHoles(AirMapPolygon view, ReadableArray holes) {
    view.setHoles(holes);
  }

  @ReactProp(name = "strokeWidth", defaultFloat = 1f)
  public void setStrokeWidth(AirMapPolygon view, float widthInPoints) {
    float widthInScreenPx = metrics.density * widthInPoints; // done for parity with iOS
    view.setStrokeWidth(widthInScreenPx);
  }

  @ReactProp(name = "fillColor", defaultInt = Color.RED, customType = "Color")
  public void setFillColor(AirMapPolygon view, int color) {
    view.setFillColor(color);
  }

  @ReactProp(name = "strokeColor", defaultInt = Color.RED, customType = "Color")
  public void setStrokeColor(AirMapPolygon view, int color) {
    view.setStrokeColor(color);
  }

  @ReactProp(name = "tappable", defaultBoolean = false)
  public void setTappable(AirMapPolygon view, boolean tapabble) {
    view.setTappable(tapabble);
  }

  @ReactProp(name = "geodesic", defaultBoolean = false)
  public void setGeodesic(AirMapPolygon view, boolean geodesic) {
    view.setGeodesic(geodesic);
  }

  @ReactProp(name = "zIndex", defaultFloat = 1.0f)
  public void setZIndex(AirMapPolygon view, float zIndex) {
    view.setZIndex(zIndex);
  }

  @Override
  @Nullable
  public Map getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.of(
        "onPress", MapBuilder.of("registrationName", "onPress")
    );
  }
}
