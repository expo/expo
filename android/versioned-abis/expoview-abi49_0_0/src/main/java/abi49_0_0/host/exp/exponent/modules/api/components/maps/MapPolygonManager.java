package abi49_0_0.host.exp.exponent.modules.api.components.maps;

import android.content.Context;
import android.graphics.Color;
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

public class MapPolygonManager extends ViewGroupManager<MapPolygon> {
  private final DisplayMetrics metrics;

  public MapPolygonManager(ReactApplicationContext reactContext) {
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
  public MapPolygon createViewInstance(ThemedReactContext context) {
    return new MapPolygon(context);
  }

  @ReactProp(name = "coordinates")
  public void setCoordinate(MapPolygon view, ReadableArray coordinates) {
    view.setCoordinates(coordinates);
  }

  @ReactProp(name = "holes")
  public  void setHoles(MapPolygon view, ReadableArray holes) {
    view.setHoles(holes);
  }

  @ReactProp(name = "strokeWidth", defaultFloat = 1f)
  public void setStrokeWidth(MapPolygon view, float widthInPoints) {
    float widthInScreenPx = metrics.density * widthInPoints; // done for parity with iOS
    view.setStrokeWidth(widthInScreenPx);
  }

  @ReactProp(name = "fillColor", defaultInt = Color.RED, customType = "Color")
  public void setFillColor(MapPolygon view, int color) {
    view.setFillColor(color);
  }

  @ReactProp(name = "strokeColor", defaultInt = Color.RED, customType = "Color")
  public void setStrokeColor(MapPolygon view, int color) {
    view.setStrokeColor(color);
  }

  @ReactProp(name = "tappable", defaultBoolean = false)
  public void setTappable(MapPolygon view, boolean tapabble) {
    view.setTappable(tapabble);
  }

  @ReactProp(name = "geodesic", defaultBoolean = false)
  public void setGeodesic(MapPolygon view, boolean geodesic) {
    view.setGeodesic(geodesic);
  }

  @ReactProp(name = "zIndex", defaultFloat = 1.0f)
  public void setZIndex(MapPolygon view, float zIndex) {
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
