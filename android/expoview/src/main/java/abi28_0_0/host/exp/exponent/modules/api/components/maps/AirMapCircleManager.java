package abi28_0_0.host.exp.exponent.modules.api.components.maps;

import android.content.Context;
import android.graphics.Color;
import android.os.Build;
import android.util.DisplayMetrics;
import android.view.WindowManager;

import abi28_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi28_0_0.com.facebook.react.bridge.ReadableMap;
import abi28_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi28_0_0.com.facebook.react.uimanager.ViewGroupManager;
import abi28_0_0.com.facebook.react.uimanager.annotations.ReactProp;
import com.google.android.gms.maps.model.LatLng;

public class AirMapCircleManager extends ViewGroupManager<AirMapCircle> {
  private final DisplayMetrics metrics;

  public AirMapCircleManager(ReactApplicationContext reactContext) {
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
    return "AIRMapCircle";
  }

  @Override
  public AirMapCircle createViewInstance(ThemedReactContext context) {
    return new AirMapCircle(context);
  }

  @ReactProp(name = "center")
  public void setCenter(AirMapCircle view, ReadableMap center) {
    view.setCenter(new LatLng(center.getDouble("latitude"), center.getDouble("longitude")));
  }

  @ReactProp(name = "radius", defaultDouble = 0)
  public void setRadius(AirMapCircle view, double radius) {
    view.setRadius(radius);
  }

  @ReactProp(name = "strokeWidth", defaultFloat = 1f)
  public void setStrokeWidth(AirMapCircle view, float widthInPoints) {
    float widthInScreenPx = metrics.density * widthInPoints; // done for parity with iOS
    view.setStrokeWidth(widthInScreenPx);
  }

  @ReactProp(name = "fillColor", defaultInt = Color.RED, customType = "Color")
  public void setFillColor(AirMapCircle view, int color) {
    view.setFillColor(color);
  }

  @ReactProp(name = "strokeColor", defaultInt = Color.RED, customType = "Color")
  public void setStrokeColor(AirMapCircle view, int color) {
    view.setStrokeColor(color);
  }

  @ReactProp(name = "zIndex", defaultFloat = 1.0f)
  public void setZIndex(AirMapCircle view, float zIndex) {
    view.setZIndex(zIndex);
  }

}
