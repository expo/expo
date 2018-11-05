package abi28_0_0.host.exp.exponent.modules.api.components.maps;

import android.content.Context;

import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.model.Circle;
import com.google.android.gms.maps.model.CircleOptions;
import com.google.android.gms.maps.model.LatLng;

public class AirMapCircle extends AirMapFeature {

  private CircleOptions circleOptions;
  private Circle circle;

  private LatLng center;
  private double radius;
  private int strokeColor;
  private int fillColor;
  private float strokeWidth;
  private float zIndex;

  public AirMapCircle(Context context) {
    super(context);
  }

  public void setCenter(LatLng center) {
    this.center = center;
    if (circle != null) {
      circle.setCenter(this.center);
    }
  }

  public void setRadius(double radius) {
    this.radius = radius;
    if (circle != null) {
      circle.setRadius(this.radius);
    }
  }

  public void setFillColor(int color) {
    this.fillColor = color;
    if (circle != null) {
      circle.setFillColor(color);
    }
  }

  public void setStrokeColor(int color) {
    this.strokeColor = color;
    if (circle != null) {
      circle.setStrokeColor(color);
    }
  }

  public void setStrokeWidth(float width) {
    this.strokeWidth = width;
    if (circle != null) {
      circle.setStrokeWidth(width);
    }
  }

  public void setZIndex(float zIndex) {
    this.zIndex = zIndex;
    if (circle != null) {
      circle.setZIndex(zIndex);
    }
  }

  public CircleOptions getCircleOptions() {
    if (circleOptions == null) {
      circleOptions = createCircleOptions();
    }
    return circleOptions;
  }

  private CircleOptions createCircleOptions() {
    CircleOptions options = new CircleOptions();
    options.center(center);
    options.radius(radius);
    options.fillColor(fillColor);
    options.strokeColor(strokeColor);
    options.strokeWidth(strokeWidth);
    options.zIndex(zIndex);
    return options;
  }

  @Override
  public Object getFeature() {
    return circle;
  }

  @Override
  public void addToMap(GoogleMap map) {
    circle = map.addCircle(getCircleOptions());
  }

  @Override
  public void removeFromMap(GoogleMap map) {
    circle.remove();
  }
}
