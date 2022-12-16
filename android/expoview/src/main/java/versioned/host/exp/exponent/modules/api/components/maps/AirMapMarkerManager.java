package versioned.host.exp.exponent.modules.api.components.maps;

import android.graphics.Bitmap;
import android.graphics.Color;
import android.view.View;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.BitmapDescriptor;
import com.google.android.gms.maps.model.LatLng;

import java.util.HashMap;
import java.util.Map;
import java.util.WeakHashMap;
import java.util.concurrent.ConcurrentHashMap;

public class AirMapMarkerManager extends ViewGroupManager<AirMapMarker> {

  public static class AirMapMarkerSharedIcon {
    private BitmapDescriptor iconBitmapDescriptor;
    private Bitmap bitmap;
    private final Map<AirMapMarker, Boolean> markers;
    private boolean loadImageStarted;

    public AirMapMarkerSharedIcon(){
      this.markers = new WeakHashMap<>();
      this.loadImageStarted = false;
    }

    /**
     * check whether the load image process started.
     * caller AirMapMarker will only need to load it when this returns true.
     *
     * @return true if it is not started, false otherwise.
     */
    public synchronized boolean shouldLoadImage(){
      if (!this.loadImageStarted) {
        this.loadImageStarted = true;
        return true;
      }
      return false;
    }

    /**
     * subscribe icon update for given marker.
     *
     * The marker is wrapped in weakReference, so no need to remove it explicitly.
     *
     * @param marker
     */
    public synchronized void addMarker(AirMapMarker marker) {
      this.markers.put(marker, true);
      if (this.iconBitmapDescriptor != null) {
        marker.setIconBitmapDescriptor(this.iconBitmapDescriptor, this.bitmap);
      }
    }

    /**
     * Remove marker from this shared icon.
     *
     * Marker will only need to call it when the marker receives a different marker image uri.
     *
     * @param marker
     */
    public synchronized void removeMarker(AirMapMarker marker) {
      this.markers.remove(marker);
    }

    /**
     * check if there is markers still listening on this icon.
     * when there are not markers listen on it, we can remove it.
     *
     * @return true if there is, false otherwise
     */
    public synchronized boolean hasMarker(){
      return this.markers.isEmpty();
    }

    /**
     * Update the bitmap descriptor and bitmap for the image uri.
     * And notify all subscribers about the update.
     *
     * @param bitmapDescriptor
     * @param bitmap
     */
    public synchronized void updateIcon(BitmapDescriptor bitmapDescriptor, Bitmap bitmap) {

      this.iconBitmapDescriptor = bitmapDescriptor;
      this.bitmap = bitmap.copy(Bitmap.Config.ARGB_8888, true);

      if (this.markers.isEmpty()) {
        return;
      }

      for (Map.Entry<AirMapMarker, Boolean> markerEntry: markers.entrySet()) {
        if (markerEntry.getKey() != null) {
          markerEntry.getKey().setIconBitmapDescriptor(bitmapDescriptor, bitmap);
        }
      }
    }
  }

  private final Map<String, AirMapMarkerSharedIcon> sharedIcons = new ConcurrentHashMap<>();

  /**
   * get the shared icon object, if not existed, create a new one and store it.
   *
   * @param uri
   * @return the icon object for the given uri.
   */
  public AirMapMarkerSharedIcon getSharedIcon(String uri) {
    AirMapMarkerSharedIcon icon = this.sharedIcons.get(uri);
    if (icon == null) {
      synchronized (this) {
        if((icon = this.sharedIcons.get(uri)) == null) {
          icon = new AirMapMarkerSharedIcon();
          this.sharedIcons.put(uri, icon);
        }
      }
    }
    return icon;
  }

  /**
   * Remove the share icon object from our sharedIcons map when no markers are listening for it.
   *
   * @param uri
   */
  public void removeSharedIconIfEmpty(String uri) {
    AirMapMarkerSharedIcon icon = this.sharedIcons.get(uri);
    if (icon == null) {return;}
    if (!icon.hasMarker()) {
      synchronized (this) {
        if((icon = this.sharedIcons.get(uri)) != null && !icon.hasMarker()) {
          this.sharedIcons.remove(uri);
        }
      }
    }
  }

  public AirMapMarkerManager() {
  }

  @Override
  public String getName() {
    return "AIRMapMarker";
  }

  @Override
  public AirMapMarker createViewInstance(ThemedReactContext context) {
    return new AirMapMarker(context, this);
  }

  @ReactProp(name = "coordinate")
  public void setCoordinate(AirMapMarker view, ReadableMap map) {
    view.setCoordinate(map);
  }

  @ReactProp(name = "title")
  public void setTitle(AirMapMarker view, String title) {
    view.setTitle(title);
  }

  @ReactProp(name = "identifier")
  public void setIdentifier(AirMapMarker view, String identifier) {
    view.setIdentifier(identifier);
  }

  @ReactProp(name = "description")
  public void setDescription(AirMapMarker view, String description) {
    view.setSnippet(description);
  }

  // NOTE(lmr):
  // android uses normalized coordinate systems for this, and is provided through the
  // `anchor` property  and `calloutAnchor` instead.  Perhaps some work could be done
  // to normalize iOS and android to use just one of the systems.
//    @ReactProp(name = "centerOffset")
//    public void setCenterOffset(AirMapMarker view, ReadableMap map) {
//
//    }
//
//    @ReactProp(name = "calloutOffset")
//    public void setCalloutOffset(AirMapMarker view, ReadableMap map) {
//
//    }

  @ReactProp(name = "anchor")
  public void setAnchor(AirMapMarker view, ReadableMap map) {
    // should default to (0.5, 1) (bottom middle)
    double x = map != null && map.hasKey("x") ? map.getDouble("x") : 0.5;
    double y = map != null && map.hasKey("y") ? map.getDouble("y") : 1.0;
    view.setAnchor(x, y);
  }

  @ReactProp(name = "calloutAnchor")
  public void setCalloutAnchor(AirMapMarker view, ReadableMap map) {
    // should default to (0.5, 0) (top middle)
    double x = map != null && map.hasKey("x") ? map.getDouble("x") : 0.5;
    double y = map != null && map.hasKey("y") ? map.getDouble("y") : 0.0;
    view.setCalloutAnchor(x, y);
  }

  @ReactProp(name = "image")
  public void setImage(AirMapMarker view, @Nullable String source) {
    view.setImage(source);
  }
//    public void setImage(AirMapMarker view, ReadableMap image) {
//        view.setImage(image);
//    }

  @ReactProp(name = "icon")
  public void setIcon(AirMapMarker view, @Nullable String source) {
    view.setImage(source);
  }

  @ReactProp(name = "pinColor", defaultInt = Color.RED, customType = "Color")
  public void setPinColor(AirMapMarker view, int pinColor) {
    float[] hsv = new float[3];
    Color.colorToHSV(pinColor, hsv);
    // NOTE: android only supports a hue
    view.setMarkerHue(hsv[0]);
  }

  @ReactProp(name = "rotation", defaultFloat = 0.0f)
  public void setMarkerRotation(AirMapMarker view, float rotation) {
    view.setRotation(rotation);
  }

  @ReactProp(name = "flat", defaultBoolean = false)
  public void setFlat(AirMapMarker view, boolean flat) {
    view.setFlat(flat);
  }

  @ReactProp(name = "draggable", defaultBoolean = false)
  public void setDraggable(AirMapMarker view, boolean draggable) {
    view.setDraggable(draggable);
  }

  @Override
  @ReactProp(name = "zIndex", defaultFloat = 0.0f)
  public void setZIndex(AirMapMarker view, float zIndex) {
    super.setZIndex(view, zIndex);
    int integerZIndex = Math.round(zIndex);
    view.setZIndex(integerZIndex);
  }

  @Override
  @ReactProp(name = "opacity", defaultFloat = 1.0f)
  public void setOpacity(AirMapMarker view, float opacity) {
    super.setOpacity(view, opacity);
    view.setOpacity(opacity);
  }

  @ReactProp(name = "tracksViewChanges", defaultBoolean = true)
  public void setTracksViewChanges(AirMapMarker view, boolean tracksViewChanges) {
    view.setTracksViewChanges(tracksViewChanges);
  }

  @Override
  public void addView(AirMapMarker parent, View child, int index) {
    // if an <Callout /> component is a child, then it is a callout view, NOT part of the
    // marker.
    if (child instanceof AirMapCallout) {
      parent.setCalloutView((AirMapCallout) child);
    } else {
      super.addView(parent, child, index);
      parent.update(true);
    }
  }

  @Override
  public void removeViewAt(AirMapMarker parent, int index) {
    super.removeViewAt(parent, index);
    parent.update(true);
  }

  @Override
  public void receiveCommand(@NonNull AirMapMarker view, String commandId, @Nullable ReadableArray args) {
    int duration;
    double lat;
    double lng;
    ReadableMap region;

    switch (commandId) {
      case "showCallout":
        ((Marker) view.getFeature()).showInfoWindow();
        break;

      case "hideCallout":
        ((Marker) view.getFeature()).hideInfoWindow();
        break;

      case "animateMarkerToCoordinate":
        if(args == null) {
          break;
        }
        region = args.getMap(0);
        duration = args.getInt(1);

        lng = region.getDouble("longitude");
        lat = region.getDouble("latitude");
        view.animateToCoodinate(new LatLng(lat, lng), duration);
        break;

      case "redraw":
        view.updateMarkerIcon();
        break;
    }
  }

  @Override
  @Nullable
  public Map getExportedCustomDirectEventTypeConstants() {
    Map<String, Map<String, String>> map = MapBuilder.of(
        "onPress", MapBuilder.of("registrationName", "onPress"),
        "onCalloutPress", MapBuilder.of("registrationName", "onCalloutPress"),
        "onDragStart", MapBuilder.of("registrationName", "onDragStart"),
        "onDrag", MapBuilder.of("registrationName", "onDrag"),
        "onDragEnd", MapBuilder.of("registrationName", "onDragEnd")
    );

    map.putAll(MapBuilder.of(
        "onDragStart", MapBuilder.of("registrationName", "onDragStart"),
        "onDrag", MapBuilder.of("registrationName", "onDrag"),
        "onDragEnd", MapBuilder.of("registrationName", "onDragEnd")
    ));

    return map;
  }

  @Override
  public LayoutShadowNode createShadowNodeInstance() {
    // we use a custom shadow node that emits the width/height of the view
    // after layout with the updateExtraData method. Without this, we can't generate
    // a bitmap of the appropriate width/height of the rendered view.
    return new SizeReportingShadowNode();
  }

  @Override
  public void updateExtraData(AirMapMarker view, Object extraData) {
    // This method is called from the shadow node with the width/height of the rendered
    // marker view.
    HashMap<String, Float> data = (HashMap<String, Float>) extraData;
    float width = data.get("width");
    float height = data.get("height");
    view.update((int) width, (int) height);
  }
}
