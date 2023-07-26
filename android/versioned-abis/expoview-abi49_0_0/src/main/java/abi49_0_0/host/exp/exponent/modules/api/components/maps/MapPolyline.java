package abi49_0_0.host.exp.exponent.modules.api.components.maps;

import android.content.Context;

import abi49_0_0.com.facebook.react.bridge.ReadableArray;
import abi49_0_0.com.facebook.react.bridge.ReadableMap;
import com.google.android.gms.maps.model.Cap;
import com.google.android.gms.maps.model.Dash;
import com.google.android.gms.maps.model.Dot;
import com.google.android.gms.maps.model.Gap;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.PatternItem;
import com.google.android.gms.maps.model.Polyline;
import com.google.android.gms.maps.model.PolylineOptions;
import com.google.android.gms.maps.model.RoundCap;
import com.google.maps.android.collections.PolylineManager;

import java.util.ArrayList;
import java.util.List;

public class MapPolyline extends MapFeature {

  private PolylineOptions polylineOptions;
  private Polyline polyline;

  private List<LatLng> coordinates;
  private int color;
  private float width;
  private boolean tappable;
  private boolean geodesic;
  private float zIndex;
  private Cap lineCap = new RoundCap();
  private ReadableArray patternValues;
  private List<PatternItem> pattern;

  public MapPolyline(Context context) {
    super(context);
  }

  public void setCoordinates(ReadableArray coordinates) {
    this.coordinates = new ArrayList<>(coordinates.size());
    for (int i = 0; i < coordinates.size(); i++) {
      ReadableMap coordinate = coordinates.getMap(i);
      this.coordinates.add(i,
          new LatLng(coordinate.getDouble("latitude"), coordinate.getDouble("longitude")));
    }
    if (polyline != null) {
      polyline.setPoints(this.coordinates);
    }
  }

  public void setColor(int color) {
    this.color = color;
    if (polyline != null) {
      polyline.setColor(color);
    }
  }

  public void setWidth(float width) {
    this.width = width;
    if (polyline != null) {
      polyline.setWidth(width);
    }
  }

  public void setZIndex(float zIndex) {
    this.zIndex = zIndex;
    if (polyline != null) {
      polyline.setZIndex(zIndex);
    }
  }

  public void setTappable(boolean tapabble) {
    this.tappable = tapabble;
    if (polyline != null) {
      polyline.setClickable(tappable);
    }
  }

  public void setGeodesic(boolean geodesic) {
    this.geodesic = geodesic;
    if (polyline != null) {
      polyline.setGeodesic(geodesic);
    }
  }

  public void setLineCap(Cap cap) {
    this.lineCap = cap;
    if (polyline != null) {
      polyline.setStartCap(cap);
      polyline.setEndCap(cap);
    }
    this.applyPattern();
  }

  public void setLineDashPattern(ReadableArray patternValues) {
    this.patternValues = patternValues;
    this.applyPattern();
  }

  private void applyPattern() {
    if(patternValues == null) {
      return;
    }
    this.pattern = new ArrayList<>(patternValues.size());
    for (int i = 0; i < patternValues.size(); i++) {
      float patternValue = (float) patternValues.getDouble(i);
      boolean isGap = i % 2 != 0;
      if(isGap) {
        this.pattern.add(new Gap(patternValue));
      }else {
        PatternItem patternItem;
        boolean isLineCapRound = this.lineCap instanceof RoundCap;
        if(isLineCapRound) {
          patternItem = new Dot();
        }else {
          patternItem = new Dash(patternValue);
        }
        this.pattern.add(patternItem);
      }
    }
    if(polyline != null) {
      polyline.setPattern(this.pattern);
    }
  }

  public PolylineOptions getPolylineOptions() {
    if (polylineOptions == null) {
      polylineOptions = createPolylineOptions();
    }
    return polylineOptions;
  }

  private PolylineOptions createPolylineOptions() {
    PolylineOptions options = new PolylineOptions();
    options.addAll(coordinates);
    options.color(color);
    options.width(width);
    options.geodesic(geodesic);
    options.zIndex(zIndex);
    options.startCap(lineCap);
    options.endCap(lineCap);
    options.pattern(this.pattern);
    return options;
  }

  @Override
  public Object getFeature() {
    return polyline;
  }

  @Override
  public void addToMap(Object collection) {
    PolylineManager.Collection polylineCollection = (PolylineManager.Collection) collection;
    polyline = polylineCollection.addPolyline(getPolylineOptions());
    polyline.setClickable(this.tappable);
  }

  @Override
  public void removeFromMap(Object collection) {
    PolylineManager.Collection polylineCollection = (PolylineManager.Collection) collection;
    polylineCollection.remove(polyline);
  }
}
