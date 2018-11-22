package abi30_0_0.host.exp.exponent.modules.api.components.maps;

import android.content.Context;

import abi30_0_0.com.facebook.react.bridge.ReadableArray;
import abi30_0_0.com.facebook.react.bridge.ReadableMap;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.Polygon;
import com.google.android.gms.maps.model.PolygonOptions;

import java.util.ArrayList;
import java.util.List;

public class AirMapPolygon extends AirMapFeature {

  private PolygonOptions polygonOptions;
  private Polygon polygon;

  private List<LatLng> coordinates;
  private List<List<LatLng>> holes;
  private int strokeColor;
  private int fillColor;
  private float strokeWidth;
  private boolean geodesic;
  private float zIndex;

  public AirMapPolygon(Context context) {
    super(context);
  }

  public void setCoordinates(ReadableArray coordinates) {
    // it's kind of a bummer that we can't run map() or anything on the ReadableArray
    this.coordinates = new ArrayList<>(coordinates.size());
    for (int i = 0; i < coordinates.size(); i++) {
      ReadableMap coordinate = coordinates.getMap(i);
      this.coordinates.add(i,
          new LatLng(coordinate.getDouble("latitude"), coordinate.getDouble("longitude")));
    }
    if (polygon != null) {
      polygon.setPoints(this.coordinates);
    }
  }

  public void setHoles(ReadableArray holes) {
    if (holes == null) { return; }

    this.holes = new ArrayList<>(holes.size());

    for (int i = 0; i < holes.size(); i++) {
      ReadableArray hole = holes.getArray(i);

      if (hole.size() < 3) { continue; }

      List<LatLng> coordinates = new ArrayList<>();
      for (int j = 0; j < hole.size(); j++) {
        ReadableMap coordinate = hole.getMap(j);
        coordinates.add(new LatLng(
            coordinate.getDouble("latitude"),
            coordinate.getDouble("longitude")));
      }

      // If hole is triangle
      if (coordinates.size() == 3) {
        coordinates.add(coordinates.get(0));
      }

      this.holes.add(coordinates);
    }

    if (polygon != null) {
      polygon.setHoles(this.holes);
    }
  }


  public void setFillColor(int color) {
    this.fillColor = color;
    if (polygon != null) {
      polygon.setFillColor(color);
    }
  }

  public void setStrokeColor(int color) {
    this.strokeColor = color;
    if (polygon != null) {
      polygon.setStrokeColor(color);
    }
  }

  public void setStrokeWidth(float width) {
    this.strokeWidth = width;
    if (polygon != null) {
      polygon.setStrokeWidth(width);
    }
  }

  public void setGeodesic(boolean geodesic) {
    this.geodesic = geodesic;
    if (polygon != null) {
      polygon.setGeodesic(geodesic);
    }
  }

  public void setZIndex(float zIndex) {
    this.zIndex = zIndex;
    if (polygon != null) {
      polygon.setZIndex(zIndex);
    }
  }

  public PolygonOptions getPolygonOptions() {
    if (polygonOptions == null) {
      polygonOptions = createPolygonOptions();
    }
    return polygonOptions;
  }

  private PolygonOptions createPolygonOptions() {
    PolygonOptions options = new PolygonOptions();
    options.addAll(coordinates);
    options.fillColor(fillColor);
    options.strokeColor(strokeColor);
    options.strokeWidth(strokeWidth);
    options.geodesic(geodesic);
    options.zIndex(zIndex);

    if (this.holes != null) {
      for (int i = 0; i < holes.size(); i++) {
        options.addHole(holes.get(i));
      }
    }

    return options;
  }

  @Override
  public Object getFeature() {
    return polygon;
  }

  @Override
  public void addToMap(GoogleMap map) {
    polygon = map.addPolygon(getPolygonOptions());
    polygon.setClickable(true);
  }

  @Override
  public void removeFromMap(GoogleMap map) {
    polygon.remove();
  }
}
