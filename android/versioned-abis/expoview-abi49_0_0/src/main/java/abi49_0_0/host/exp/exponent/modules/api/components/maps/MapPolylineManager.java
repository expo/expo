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
import com.google.android.gms.maps.model.ButtCap;
import com.google.android.gms.maps.model.Cap;
import com.google.android.gms.maps.model.RoundCap;
import com.google.android.gms.maps.model.SquareCap;

import java.util.Map;

public class MapPolylineManager extends ViewGroupManager<MapPolyline> {
  private final DisplayMetrics metrics;

  public MapPolylineManager(ReactApplicationContext reactContext) {
    super();
    metrics = new DisplayMetrics();
    ((WindowManager) reactContext.getSystemService(Context.WINDOW_SERVICE))
        .getDefaultDisplay()
        .getRealMetrics(metrics);
  }

  @Override
  public String getName() {
    return "AIRMapPolyline";
  }

  @Override
  public MapPolyline createViewInstance(ThemedReactContext context) {
    return new MapPolyline(context);
  }

  @ReactProp(name = "coordinates")
  public void setCoordinate(MapPolyline view, ReadableArray coordinates) {
    view.setCoordinates(coordinates);
  }

  @ReactProp(name = "strokeWidth", defaultFloat = 1f)
  public void setStrokeWidth(MapPolyline view, float widthInPoints) {
    float widthInScreenPx = metrics.density * widthInPoints; // done for parity with iOS
    view.setWidth(widthInScreenPx);
  }

  @ReactProp(name = "strokeColor", defaultInt = Color.RED, customType = "Color")
  public void setStrokeColor(MapPolyline view, int color) {
    view.setColor(color);
  }

  @ReactProp(name = "tappable", defaultBoolean = false)
  public void setTappable(MapPolyline view, boolean tapabble) {
    view.setTappable(tapabble);
  }

  @ReactProp(name = "geodesic", defaultBoolean = false)
  public void setGeodesic(MapPolyline view, boolean geodesic) {
    view.setGeodesic(geodesic);
  }

  @ReactProp(name = "zIndex", defaultFloat = 1.0f)
  public void setZIndex(MapPolyline view, float zIndex) {
    view.setZIndex(zIndex);
  }

  @ReactProp(name = "lineCap")
  public void setlineCap(MapPolyline view, String lineCap) {
    Cap cap = null;
    switch (lineCap) {
      case "butt":
        cap = new ButtCap();
        break;
      case "round":
        cap = new RoundCap();
        break;
      case "square":
        cap = new SquareCap();
        break;
      default:
        cap = new RoundCap();
        break;
    }
    view.setLineCap(cap);
  }

  @ReactProp(name = "lineDashPattern")
  public void setLineDashPattern(MapPolyline view, ReadableArray patternValues) {
      view.setLineDashPattern(patternValues);
  }

  @Override
  @Nullable
  public Map getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.of(
        "onPress", MapBuilder.of("registrationName", "onPress")
    );
  }
}
