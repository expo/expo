package abi30_0_0.host.exp.exponent.modules.api.components.maps;

import android.content.Context;
import android.graphics.Color;
import android.os.Build;
import android.util.DisplayMetrics;
import android.view.WindowManager;

import abi30_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi30_0_0.com.facebook.react.bridge.ReadableArray;
import abi30_0_0.com.facebook.react.common.MapBuilder;
import abi30_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi30_0_0.com.facebook.react.uimanager.ViewGroupManager;
import abi30_0_0.com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

import javax.annotation.Nullable;

public class AirMapPolylineManager extends ViewGroupManager<AirMapPolyline> {
  private final DisplayMetrics metrics;

  public AirMapPolylineManager(ReactApplicationContext reactContext) {
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
    return "AIRMapPolyline";
  }

  @Override
  public AirMapPolyline createViewInstance(ThemedReactContext context) {
    return new AirMapPolyline(context);
  }

  @ReactProp(name = "coordinates")
  public void setCoordinate(AirMapPolyline view, ReadableArray coordinates) {
    view.setCoordinates(coordinates);
  }

  @ReactProp(name = "strokeWidth", defaultFloat = 1f)
  public void setStrokeWidth(AirMapPolyline view, float widthInPoints) {
    float widthInScreenPx = metrics.density * widthInPoints; // done for parity with iOS
    view.setWidth(widthInScreenPx);
  }

  @ReactProp(name = "strokeColor", defaultInt = Color.RED, customType = "Color")
  public void setStrokeColor(AirMapPolyline view, int color) {
    view.setColor(color);
  }

  @ReactProp(name = "geodesic", defaultBoolean = false)
  public void setGeodesic(AirMapPolyline view, boolean geodesic) {
    view.setGeodesic(geodesic);
  }

  @ReactProp(name = "zIndex", defaultFloat = 1.0f)
  public void setZIndex(AirMapPolyline view, float zIndex) {
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
