package abi49_0_0.host.exp.exponent.modules.api.components.maps;

import android.view.View;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import abi49_0_0.com.facebook.react.bridge.Arguments;
import abi49_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi49_0_0.com.facebook.react.bridge.ReadableArray;
import abi49_0_0.com.facebook.react.bridge.ReadableMap;
import abi49_0_0.com.facebook.react.bridge.WritableMap;
import abi49_0_0.com.facebook.react.common.MapBuilder;
import abi49_0_0.com.facebook.react.modules.core.DeviceEventManagerModule;
import abi49_0_0.com.facebook.react.uimanager.LayoutShadowNode;
import abi49_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi49_0_0.com.facebook.react.uimanager.ViewGroupManager;
import abi49_0_0.com.facebook.react.uimanager.annotations.ReactProp;
import abi49_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;
import com.google.android.gms.location.Priority;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.GoogleMapOptions;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.LatLngBounds;

import java.util.Map;

public class MapManager extends ViewGroupManager<MapView> {

  private static final String REACT_CLASS = "AIRMap";

  private final Map<String, Integer> MAP_TYPES = MapBuilder.of(
      "standard", GoogleMap.MAP_TYPE_NORMAL,
      "satellite", GoogleMap.MAP_TYPE_SATELLITE,
      "hybrid", GoogleMap.MAP_TYPE_HYBRID,
      "terrain", GoogleMap.MAP_TYPE_TERRAIN,
      "none", GoogleMap.MAP_TYPE_NONE
  );

  private final Map<String, Integer> MY_LOCATION_PRIORITY = MapBuilder.of(
          "balanced", Priority.PRIORITY_BALANCED_POWER_ACCURACY,
          "high", Priority.PRIORITY_HIGH_ACCURACY,
          "low", Priority.PRIORITY_LOW_POWER,
          "passive", Priority.PRIORITY_PASSIVE
  );

  private final ReactApplicationContext appContext;
  private MapMarkerManager markerManager;

  protected GoogleMapOptions googleMapOptions;

  public MapManager(ReactApplicationContext context) {
    this.appContext = context;
    this.googleMapOptions = new GoogleMapOptions();
  }

  public MapMarkerManager getMarkerManager() {
    return this.markerManager;
  }
  public void setMarkerManager(MapMarkerManager markerManager) {
    this.markerManager = markerManager;
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected MapView createViewInstance(ThemedReactContext context) {
    return new MapView(context, this.appContext, this, googleMapOptions);
  }

  private void emitMapError(ThemedReactContext context, String message, String type) {
    WritableMap error = Arguments.createMap();
    error.putString("message", message);
    error.putString("type", type);

    context
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit("onError", error);
  }

  @ReactProp(name = "region")
  public void setRegion(MapView view, ReadableMap region) {
    view.setRegion(region);
  }

  @ReactProp(name = "initialRegion")
  public void setInitialRegion(MapView view, ReadableMap initialRegion) {
    view.setInitialRegion(initialRegion);
  }

  @ReactProp(name = "camera")
  public void setCamera(MapView view, ReadableMap camera) {
    view.setCamera(camera);
  }

  @ReactProp(name = "initialCamera")
  public void setInitialCamera(MapView view, ReadableMap initialCamera) {
    view.setInitialCamera(initialCamera);
  }

  @ReactProp(name = "mapType")
  public void setMapType(MapView view, @Nullable String mapType) {
    int typeId = MAP_TYPES.get(mapType);
    view.map.setMapType(typeId);
  }

  @ReactProp(name = "customMapStyleString")
  public void setMapStyle(MapView view, @Nullable String customMapStyleString) {
    view.setMapStyle(customMapStyleString);
  }

  @ReactProp(name = "mapPadding")
  public void setMapPadding(MapView view, @Nullable ReadableMap padding) {
    int left = 0;
    int top = 0;
    int right = 0;
    int bottom = 0;
    double density = (double) view.getResources().getDisplayMetrics().density;

    if (padding != null) {
      if (padding.hasKey("left")) {
        left = (int) (padding.getDouble("left") * density);
      }

      if (padding.hasKey("top")) {
        top = (int) (padding.getDouble("top") * density);
      }

      if (padding.hasKey("right")) {
        right = (int) (padding.getDouble("right") * density);
      }

      if (padding.hasKey("bottom")) {
        bottom = (int) (padding.getDouble("bottom") * density);
      }
    }

    view.applyBaseMapPadding(left, top, right, bottom);
    view.map.setPadding(left, top, right, bottom);
  }

  @ReactProp(name = "showsUserLocation", defaultBoolean = false)
  public void setShowsUserLocation(MapView view, boolean showUserLocation) {
    view.setShowsUserLocation(showUserLocation);
  }

  @ReactProp(name = "userLocationPriority")
  public void setUserLocationPriority(MapView view, @Nullable String accuracy) {
    view.setUserLocationPriority(MY_LOCATION_PRIORITY.get(accuracy));
  }

  @ReactProp(name = "userLocationUpdateInterval", defaultInt = 5000)
  public void setUserLocationUpdateInterval(MapView view, int updateInterval) {
    view.setUserLocationUpdateInterval(updateInterval);
  }

  @ReactProp(name = "userLocationFastestInterval", defaultInt = 5000)
  public void setUserLocationFastestInterval(MapView view, int fastestInterval) {
    view.setUserLocationFastestInterval(fastestInterval);
  }

  @ReactProp(name = "showsMyLocationButton", defaultBoolean = true)
  public void setShowsMyLocationButton(MapView view, boolean showMyLocationButton) {
    view.setShowsMyLocationButton(showMyLocationButton);
  }

  @ReactProp(name = "toolbarEnabled", defaultBoolean = true)
  public void setToolbarEnabled(MapView view, boolean toolbarEnabled) {
    view.setToolbarEnabled(toolbarEnabled);
  }

  // This is a private prop to improve performance of panDrag by disabling it when the callback
  // is not set
  @ReactProp(name = "handlePanDrag", defaultBoolean = false)
  public void setHandlePanDrag(MapView view, boolean handlePanDrag) {
    view.setHandlePanDrag(handlePanDrag);
  }

  @ReactProp(name = "showsTraffic", defaultBoolean = false)
  public void setShowTraffic(MapView view, boolean showTraffic) {
    view.map.setTrafficEnabled(showTraffic);
  }

  @ReactProp(name = "showsBuildings", defaultBoolean = false)
  public void setShowBuildings(MapView view, boolean showBuildings) {
    view.map.setBuildingsEnabled(showBuildings);
  }

  @ReactProp(name = "showsIndoors", defaultBoolean = false)
  public void setShowIndoors(MapView view, boolean showIndoors) {
    view.map.setIndoorEnabled(showIndoors);
  }

  @ReactProp(name = "showsIndoorLevelPicker", defaultBoolean = false)
  public void setShowsIndoorLevelPicker(MapView view, boolean showsIndoorLevelPicker) {
    view.map.getUiSettings().setIndoorLevelPickerEnabled(showsIndoorLevelPicker);
  }

  @ReactProp(name = "showsCompass", defaultBoolean = false)
  public void setShowsCompass(MapView view, boolean showsCompass) {
    view.map.getUiSettings().setCompassEnabled(showsCompass);
  }

  @ReactProp(name = "scrollEnabled", defaultBoolean = false)
  public void setScrollEnabled(MapView view, boolean scrollEnabled) {
    view.map.getUiSettings().setScrollGesturesEnabled(scrollEnabled);
  }

  @ReactProp(name = "zoomEnabled", defaultBoolean = false)
  public void setZoomEnabled(MapView view, boolean zoomEnabled) {
    view.map.getUiSettings().setZoomGesturesEnabled(zoomEnabled);
  }

  @ReactProp(name = "zoomControlEnabled", defaultBoolean = true)
  public void setZoomControlEnabled(MapView view, boolean zoomControlEnabled) {
    view.map.getUiSettings().setZoomControlsEnabled(zoomControlEnabled);
  }

  @ReactProp(name = "rotateEnabled", defaultBoolean = false)
  public void setRotateEnabled(MapView view, boolean rotateEnabled) {
    view.map.getUiSettings().setRotateGesturesEnabled(rotateEnabled);
  }

  @ReactProp(name = "scrollDuringRotateOrZoomEnabled", defaultBoolean = true)
  public void setScrollDuringRotateOrZoomEnabled(MapView view, boolean scrollDuringRotateOrZoomEnabled) {
    view.map.getUiSettings().setScrollGesturesEnabledDuringRotateOrZoom(scrollDuringRotateOrZoomEnabled);
  }

  @ReactProp(name = "cacheEnabled", defaultBoolean = false)
  public void setCacheEnabled(MapView view, boolean cacheEnabled) {
    view.setCacheEnabled(cacheEnabled);
  }

  @ReactProp(name = "loadingEnabled", defaultBoolean = false)
  public void setLoadingEnabled(MapView view, boolean loadingEnabled) {
    view.enableMapLoading(loadingEnabled);
  }

  @ReactProp(name = "moveOnMarkerPress", defaultBoolean = true)
  public void setMoveOnMarkerPress(MapView view, boolean moveOnPress) {
    view.setMoveOnMarkerPress(moveOnPress);
  }

  @ReactProp(name = "loadingBackgroundColor", customType = "Color")
  public void setLoadingBackgroundColor(MapView view, @Nullable Integer loadingBackgroundColor) {
    view.setLoadingBackgroundColor(loadingBackgroundColor);
  }

  @ReactProp(name = "loadingIndicatorColor", customType = "Color")
  public void setLoadingIndicatorColor(MapView view, @Nullable Integer loadingIndicatorColor) {
    view.setLoadingIndicatorColor(loadingIndicatorColor);
  }

  @ReactProp(name = "pitchEnabled", defaultBoolean = false)
  public void setPitchEnabled(MapView view, boolean pitchEnabled) {
    view.map.getUiSettings().setTiltGesturesEnabled(pitchEnabled);
  }

  @ReactProp(name = "minZoomLevel")
  public void setMinZoomLevel(MapView view, float minZoomLevel) {
    view.map.setMinZoomPreference(minZoomLevel);
  }

  @ReactProp(name = "maxZoomLevel")
  public void setMaxZoomLevel(MapView view, float maxZoomLevel) {
    view.map.setMaxZoomPreference(maxZoomLevel);
  }

  @ReactProp(name = "kmlSrc")
  public void setKmlSrc(MapView view, String kmlUrl) {
    if (kmlUrl != null) {
      view.setKmlSrc(kmlUrl);
    }
  }

  @Override
  public void receiveCommand(@NonNull MapView view, String commandId, @Nullable ReadableArray args) {
    int duration;
    double lat;
    double lng;
    double lngDelta;
    double latDelta;
    ReadableMap region;
    ReadableMap camera;

    switch (commandId) {
      case "setCamera":
        if(args == null) {
          break;
        }
        camera = args.getMap(0);
        view.animateToCamera(camera, 0);
        break;

      case "animateCamera":
        if(args == null) {
          break;
        }
        camera = args.getMap(0);
        duration = args.getInt(1);
        view.animateToCamera(camera, duration);
        break;

      case "animateToRegion":
        if(args == null) {
          break;
        }
        region = args.getMap(0);
        duration = args.getInt(1);
        lng = region.getDouble("longitude");
        lat = region.getDouble("latitude");
        lngDelta = region.getDouble("longitudeDelta");
        latDelta = region.getDouble("latitudeDelta");
        LatLngBounds bounds = new LatLngBounds(
            new LatLng(lat - latDelta / 2, lng - lngDelta / 2), // southwest
            new LatLng(lat + latDelta / 2, lng + lngDelta / 2)  // northeast
        );
        view.animateToRegion(bounds, duration);
        break;

      case "fitToElements":
        if(args == null) {
          break;
        }
        view.fitToElements(args.getMap(0), args.getBoolean(1));
        break;

      case "fitToSuppliedMarkers":
        if(args == null) {
          break;
        }
        view.fitToSuppliedMarkers(args.getArray(0), args.getMap(1), args.getBoolean(2));
        break;

      case "fitToCoordinates":
        if(args == null) {
          break;
        }
        view.fitToCoordinates(args.getArray(0), args.getMap(1), args.getBoolean(2));
        break;

      case "setMapBoundaries":
        if(args == null) {
          break;
        }
        view.setMapBoundaries(args.getMap(0), args.getMap(1));
        break;

      case "setIndoorActiveLevelIndex":
        if(args == null) {
          break;
        }
        view.setIndoorActiveLevelIndex(args.getInt(0));
        break;
    }
  }

  @Override
  @Nullable
  public Map getExportedCustomDirectEventTypeConstants() {
    Map<String, Map<String, String>> map = MapBuilder.of(
        "onMapReady", MapBuilder.of("registrationName", "onMapReady"),
        "onPress", MapBuilder.of("registrationName", "onPress"),
        "onLongPress", MapBuilder.of("registrationName", "onLongPress"),
        "onMarkerPress", MapBuilder.of("registrationName", "onMarkerPress"),
        "onMarkerSelect", MapBuilder.of("registrationName", "onMarkerSelect"),
        "onMarkerDeselect", MapBuilder.of("registrationName", "onMarkerDeselect"),
        "onCalloutPress", MapBuilder.of("registrationName", "onCalloutPress")
    );

    map.putAll(MapBuilder.of(
        "onUserLocationChange", MapBuilder.of("registrationName", "onUserLocationChange"),
        "onMarkerDragStart", MapBuilder.of("registrationName", "onMarkerDragStart"),
        "onMarkerDrag", MapBuilder.of("registrationName", "onMarkerDrag"),
        "onMarkerDragEnd", MapBuilder.of("registrationName", "onMarkerDragEnd"),
        "onPanDrag", MapBuilder.of("registrationName", "onPanDrag"),
        "onKmlReady", MapBuilder.of("registrationName", "onKmlReady"),
        "onPoiClick", MapBuilder.of("registrationName", "onPoiClick")
    ));

    map.putAll(MapBuilder.of(
        "onIndoorLevelActivated", MapBuilder.of("registrationName", "onIndoorLevelActivated"),
        "onIndoorBuildingFocused", MapBuilder.of("registrationName", "onIndoorBuildingFocused"),
        "onDoublePress", MapBuilder.of("registrationName", "onDoublePress"),
        "onMapLoaded", MapBuilder.of("registrationName", "onMapLoaded")
    ));

    return map;
  }

  @Override
  public LayoutShadowNode createShadowNodeInstance() {
    // A custom shadow node is needed in order to pass back the width/height of the map to the
    // view manager so that it can start applying camera moves with bounds.
    return new SizeReportingShadowNode();
  }

  @Override
  public void addView(MapView parent, View child, int index) {
    parent.addFeature(child, index);
  }

  @Override
  public int getChildCount(MapView view) {
    return view.getFeatureCount();
  }

  @Override
  public View getChildAt(MapView view, int index) {
    return view.getFeatureAt(index);
  }

  @Override
  public void removeViewAt(MapView parent, int index) {
    parent.removeFeatureAt(index);
  }

  @Override
  public void updateExtraData(MapView view, Object extraData) {
    view.updateExtraData(extraData);
  }

  void pushEvent(ThemedReactContext context, View view, String name, WritableMap data) {
    context.getJSModule(RCTEventEmitter.class)
        .receiveEvent(view.getId(), name, data);
  }

  @Override
  public void onDropViewInstance(MapView view) {
    view.doDestroy();
    super.onDropViewInstance(view);
  }

}
