package abi48_0_0.host.exp.exponent.modules.api.components.maps;

import android.content.Context;
import android.content.res.ColorStateList;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Point;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.PermissionChecker;
import androidx.core.view.GestureDetectorCompat;
import androidx.core.view.MotionEventCompat;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;
import android.location.Location;

import abi48_0_0.com.facebook.react.bridge.LifecycleEventListener;
import abi48_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi48_0_0.com.facebook.react.bridge.ReadableArray;
import abi48_0_0.com.facebook.react.bridge.ReadableMap;
import abi48_0_0.com.facebook.react.bridge.WritableArray;
import abi48_0_0.com.facebook.react.bridge.WritableMap;
import abi48_0_0.com.facebook.react.bridge.WritableNativeArray;
import abi48_0_0.com.facebook.react.bridge.WritableNativeMap;
import abi48_0_0.com.facebook.react.bridge.Arguments;
import abi48_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi48_0_0.com.facebook.react.uimanager.UIManagerModule;
import abi48_0_0.com.facebook.react.uimanager.events.EventDispatcher;
import com.google.android.gms.maps.CameraUpdate;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.GoogleMapOptions;
import com.google.android.gms.maps.MapView;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.Projection;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.CameraPosition;
import com.google.android.gms.maps.model.GroundOverlay;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.LatLngBounds;
import com.google.android.gms.maps.model.MapStyleOptions;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.gms.maps.model.PointOfInterest;
import com.google.android.gms.maps.model.Polygon;
import com.google.android.gms.maps.model.Polyline;
import com.google.android.gms.maps.model.TileOverlay;
import com.google.android.gms.maps.model.IndoorBuilding;
import com.google.android.gms.maps.model.IndoorLevel;
import com.google.maps.android.data.kml.KmlContainer;
import com.google.maps.android.data.kml.KmlLayer;
import com.google.maps.android.data.kml.KmlPlacemark;
import com.google.maps.android.data.kml.KmlStyle;

import org.xmlpull.v1.XmlPullParserException;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import static androidx.core.content.PermissionChecker.checkSelfPermission;

public class AirMapView extends MapView implements GoogleMap.InfoWindowAdapter,
    GoogleMap.OnMarkerDragListener, OnMapReadyCallback, GoogleMap.OnPoiClickListener, GoogleMap.OnIndoorStateChangeListener {
  public GoogleMap map;
  private ProgressBar mapLoadingProgressBar;
  private RelativeLayout mapLoadingLayout;
  private ImageView cacheImageView;
  private Boolean isMapLoaded = false;
  private Integer loadingBackgroundColor = null;
  private Integer loadingIndicatorColor = null;
  private final int baseMapPadding = 50;

  private LatLngBounds boundsToMove;
  private CameraUpdate cameraToSet;
  private boolean showUserLocation = false;
  private boolean handlePanDrag = false;
  private boolean moveOnMarkerPress = true;
  private boolean cacheEnabled = false;
  private ReadableMap initialRegion;
  private ReadableMap initialCamera;
  private ReadableMap region;
  private ReadableMap camera;
  private String customMapStyleString;
  private boolean initialRegionSet = false;
  private boolean initialCameraSet = false;
  private LatLngBounds cameraLastIdleBounds;
  private int cameraMoveReason = 0;

  private static final String[] PERMISSIONS = new String[]{
      "android.permission.ACCESS_FINE_LOCATION", "android.permission.ACCESS_COARSE_LOCATION"};

  private final List<AirMapFeature> features = new ArrayList<>();
  private final Map<Marker, AirMapMarker> markerMap = new HashMap<>();
  private final Map<Polyline, AirMapPolyline> polylineMap = new HashMap<>();
  private final Map<Polygon, AirMapPolygon> polygonMap = new HashMap<>();
  private final Map<GroundOverlay, AirMapOverlay> overlayMap = new HashMap<>();
  private final Map<TileOverlay, AirMapHeatmap> heatmapMap = new HashMap<>();
  private final Map<TileOverlay, AirMapGradientPolyline> gradientPolylineMap = new HashMap<>();
  private final GestureDetectorCompat gestureDetector;
  private final AirMapManager manager;
  private LifecycleEventListener lifecycleListener;
  private boolean paused = false;
  private boolean destroyed = false;
  private final ThemedReactContext context;
  private final EventDispatcher eventDispatcher;
  private final FusedLocationSource fusedLocationSource;

  private final ViewAttacherGroup attacherGroup;
  private LatLng tapLocation;

  private static boolean contextHasBug(Context context) {
    return context == null ||
        context.getResources() == null ||
        context.getResources().getConfiguration() == null;
  }

  // We do this to fix this bug:
  // https://github.com/react-native-maps/react-native-maps/issues/271
  //
  // which conflicts with another bug regarding the passed in context:
  // https://github.com/react-native-maps/react-native-maps/issues/1147
  //
  // Doing this allows us to avoid both bugs.
  private static Context getNonBuggyContext(ThemedReactContext reactContext,
      ReactApplicationContext appContext) {
    Context superContext = reactContext;
    if (!contextHasBug(appContext.getCurrentActivity())) {
      superContext = appContext.getCurrentActivity();
    } else if (contextHasBug(superContext)) {
      // we have the bug! let's try to find a better context to use
      if (!contextHasBug(reactContext.getCurrentActivity())) {
        superContext = reactContext.getCurrentActivity();
      } else if (!contextHasBug(reactContext.getApplicationContext())) {
        superContext = reactContext.getApplicationContext();
      }

    }
    return superContext;
  }

  public AirMapView(ThemedReactContext reactContext, ReactApplicationContext appContext,
      AirMapManager manager,
      GoogleMapOptions googleMapOptions) {
    super(getNonBuggyContext(reactContext, appContext), googleMapOptions);

    this.manager = manager;
    this.context = reactContext;

    super.onCreate(null);
    // TODO(lmr): what about onStart????
    super.onResume();
    super.getMapAsync(this);

    final AirMapView view = this;

    fusedLocationSource = new FusedLocationSource(context);

    gestureDetector =
        new GestureDetectorCompat(reactContext, new GestureDetector.SimpleOnGestureListener() {

          @Override
          public boolean onScroll(MotionEvent e1, MotionEvent e2, float distanceX,
              float distanceY) {
            if (handlePanDrag) {
              onPanDrag(e2);
            }
            return false;
          }

          @Override
          public boolean onDoubleTap(MotionEvent ev) {
            onDoublePress(ev);
            return false;
          }
        });

    this.addOnLayoutChangeListener(new OnLayoutChangeListener() {
      @Override public void onLayoutChange(View v, int left, int top, int right, int bottom,
          int oldLeft, int oldTop, int oldRight, int oldBottom) {
        if (!paused) {
          AirMapView.this.cacheView();
        }
      }
    });

    eventDispatcher = reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();

    // Set up a parent view for triggering visibility in subviews that depend on it.
    // Mainly ReactImageView depends on Fresco which depends on onVisibilityChanged() event
    attacherGroup = new ViewAttacherGroup(context);
    LayoutParams attacherLayoutParams = new LayoutParams(0, 0);
    attacherLayoutParams.width = 0;
    attacherLayoutParams.height = 0;
    attacherLayoutParams.leftMargin = 99999999;
    attacherLayoutParams.topMargin = 99999999;
    attacherGroup.setLayoutParams(attacherLayoutParams);
    addView(attacherGroup);
  }

  @Override
  public void onMapReady(@NonNull final GoogleMap map) {
    if (destroyed) {
      return;
    }
    this.map = map;
    this.map.setInfoWindowAdapter(this);
    this.map.setOnMarkerDragListener(this);
    this.map.setOnPoiClickListener(this);
    this.map.setOnIndoorStateChangeListener(this);

    applyBridgedProps();

    manager.pushEvent(context, this, "onMapReady", new WritableNativeMap());

    final AirMapView view = this;

    map.setOnMyLocationChangeListener(new GoogleMap.OnMyLocationChangeListener() {
      @Override
      public void onMyLocationChange(Location location){
        WritableMap event = new WritableNativeMap();

        WritableMap coordinate = new WritableNativeMap();
        coordinate.putDouble("latitude", location.getLatitude());
        coordinate.putDouble("longitude", location.getLongitude());
        coordinate.putDouble("altitude", location.getAltitude());
        coordinate.putDouble("timestamp", location.getTime());
        coordinate.putDouble("accuracy", location.getAccuracy());
        coordinate.putDouble("speed", location.getSpeed());
        coordinate.putDouble("heading", location.getBearing());
        coordinate.putBoolean("isFromMockProvider", location.isFromMockProvider());

        event.putMap("coordinate", coordinate);

        manager.pushEvent(context, view, "onUserLocationChange", event);
      }
    });

    map.setOnMarkerClickListener(new GoogleMap.OnMarkerClickListener() {
      @Override
      public boolean onMarkerClick(Marker marker) {
        WritableMap event;
        AirMapMarker airMapMarker = getMarkerMap(marker);

        event = makeClickEventData(marker.getPosition());
        event.putString("action", "marker-press");
        event.putString("id", airMapMarker.getIdentifier());
        manager.pushEvent(context, view, "onMarkerPress", event);

        event = makeClickEventData(marker.getPosition());
        event.putString("action", "marker-press");
        event.putString("id", airMapMarker.getIdentifier());
        manager.pushEvent(context, airMapMarker, "onPress", event);

        // Return false to open the callout info window and center on the marker
        // https://developers.google.com/android/reference/com/google/android/gms/maps/GoogleMap
        // .OnMarkerClickListener
        if (view.moveOnMarkerPress) {
          return false;
        } else {
          marker.showInfoWindow();
          return true;
        }
      }
    });

    map.setOnPolygonClickListener(new GoogleMap.OnPolygonClickListener() {
      @Override
      public void onPolygonClick(Polygon polygon) {
        WritableMap event = makeClickEventData(tapLocation);
        event.putString("action", "polygon-press");
        manager.pushEvent(context, polygonMap.get(polygon), "onPress", event);
      }
    });

    map.setOnPolylineClickListener(new GoogleMap.OnPolylineClickListener() {
      @Override
      public void onPolylineClick(Polyline polyline) {
        WritableMap event = makeClickEventData(tapLocation);
        event.putString("action", "polyline-press");
        manager.pushEvent(context, polylineMap.get(polyline), "onPress", event);
      }
    });

    map.setOnInfoWindowClickListener(new GoogleMap.OnInfoWindowClickListener() {
      @Override
      public void onInfoWindowClick(Marker marker) {
        WritableMap event;

        event = makeClickEventData(marker.getPosition());
        event.putString("action", "callout-press");
        manager.pushEvent(context, view, "onCalloutPress", event);

        event = makeClickEventData(marker.getPosition());
        event.putString("action", "callout-press");
        AirMapMarker markerView = getMarkerMap(marker);
        manager.pushEvent(context, markerView, "onCalloutPress", event);

        event = makeClickEventData(marker.getPosition());
        event.putString("action", "callout-press");
        AirMapCallout infoWindow = markerView.getCalloutView();
        if (infoWindow != null) manager.pushEvent(context, infoWindow, "onPress", event);
      }
    });

    map.setOnMapClickListener(new GoogleMap.OnMapClickListener() {
      @Override
      public void onMapClick(LatLng point) {
        WritableMap event = makeClickEventData(point);
        event.putString("action", "press");
        manager.pushEvent(context, view, "onPress", event);
      }
    });

    map.setOnMapLongClickListener(new GoogleMap.OnMapLongClickListener() {
      @Override
      public void onMapLongClick(LatLng point) {
        WritableMap event = makeClickEventData(point);
        event.putString("action", "long-press");
        manager.pushEvent(context, view, "onLongPress", makeClickEventData(point));
      }
    });

    map.setOnGroundOverlayClickListener(new GoogleMap.OnGroundOverlayClickListener() {
      @Override
      public void onGroundOverlayClick(GroundOverlay groundOverlay) {
        WritableMap event = makeClickEventData(groundOverlay.getPosition());
        event.putString("action", "overlay-press");
        manager.pushEvent(context, overlayMap.get(groundOverlay), "onPress", event);
      }
    });

    map.setOnCameraMoveStartedListener(new GoogleMap.OnCameraMoveStartedListener() {
      @Override
      public void onCameraMoveStarted(int reason) {
        cameraMoveReason = reason;
      }
    });

    map.setOnCameraMoveListener(new GoogleMap.OnCameraMoveListener() {
      @Override
      public void onCameraMove() {
        LatLngBounds bounds = map.getProjection().getVisibleRegion().latLngBounds;

        cameraLastIdleBounds = null;
        boolean isGesture = GoogleMap.OnCameraMoveStartedListener.REASON_GESTURE == cameraMoveReason;

        RegionChangeEvent event = new RegionChangeEvent(getId(), bounds, true, isGesture);
        eventDispatcher.dispatchEvent(event);
      }
    });

    map.setOnCameraIdleListener(new GoogleMap.OnCameraIdleListener() {
      @Override
      public void onCameraIdle() {
        LatLngBounds bounds = map.getProjection().getVisibleRegion().latLngBounds;
        if ((cameraMoveReason != 0) &&
          ((cameraLastIdleBounds == null) ||
            LatLngBoundsUtils.BoundsAreDifferent(bounds, cameraLastIdleBounds))) {

          cameraLastIdleBounds = bounds;
          boolean isGesture = GoogleMap.OnCameraMoveStartedListener.REASON_GESTURE == cameraMoveReason;

          RegionChangeEvent event = new RegionChangeEvent(getId(), bounds, false, isGesture);
          eventDispatcher.dispatchEvent(event);
        }
      }
    });

    map.setOnMapLoadedCallback(new GoogleMap.OnMapLoadedCallback() {
      @Override public void onMapLoaded() {
        isMapLoaded = true;
        manager.pushEvent(context, view, "onMapLoaded", new WritableNativeMap());
        AirMapView.this.cacheView();
      }
    });

    // We need to be sure to disable location-tracking when app enters background, in-case some
    // other module
    // has acquired a wake-lock and is controlling location-updates, otherwise, location-manager
    // will be left
    // updating location constantly, killing the battery, even though some other location-mgmt
    // module may
    // desire to shut-down location-services.
    lifecycleListener = new LifecycleEventListener() {
      @Override
      public void onHostResume() {
        if (hasPermissions() && map != null) {
          //noinspection MissingPermission
          map.setMyLocationEnabled(showUserLocation);
          map.setLocationSource(fusedLocationSource);
        }
        synchronized (AirMapView.this) {
          if (!destroyed) {
            AirMapView.this.onResume();
          }
          paused = false;
        }
      }

      @Override
      public void onHostPause() {
        if (hasPermissions() && map != null) {
          //noinspection MissingPermission
          map.setMyLocationEnabled(false);
        }
        synchronized (AirMapView.this) {
          if (!destroyed) {
            AirMapView.this.onPause();
          }
          paused = true;
        }
      }

      @Override
      public void onHostDestroy() {
        AirMapView.this.doDestroy();
      }
    };

    context.addLifecycleEventListener(lifecycleListener);
  }

  private boolean hasPermissions() {
    return checkSelfPermission(getContext(), PERMISSIONS[0]) == PermissionChecker.PERMISSION_GRANTED ||
        checkSelfPermission(getContext(), PERMISSIONS[1]) == PermissionChecker.PERMISSION_GRANTED;
  }


  /*
  onDestroy is final method so I can't override it.
   */
  public synchronized void doDestroy() {
    if (destroyed) {
      return;
    }
    destroyed = true;

    if (lifecycleListener != null && context != null) {
      context.removeLifecycleEventListener(lifecycleListener);
      lifecycleListener = null;
    }
    if (!paused) {
      onPause();
      paused = true;
    }
    onDestroy();
  }

  public void setInitialRegion(ReadableMap initialRegion) {
    this.initialRegion = initialRegion;
    // Theoretically onMapReady might be called before setInitialRegion
    // In that case, trigger moveToRegion manually
    if (!initialRegionSet && map != null) {
      moveToRegion(initialRegion);
      initialRegionSet = true;
    }
  }

  public void setInitialCamera(ReadableMap initialCamera) {
    this.initialCamera = initialCamera;
    // Theoretically onMapReady might be called before setInitialCamera
    // In that case, trigger moveToCamera manually
    if (!initialCameraSet && map != null) {
      moveToCamera(initialCamera);
      initialCameraSet = true;
    }
  }

  private void applyBridgedProps() {
    if(initialRegion != null) {
      moveToRegion(initialRegion);
      initialRegionSet = true;
    } else if(initialCamera != null) {
      moveToCamera(initialCamera);
      initialCameraSet = true;
    } else if(region != null) {
      moveToRegion(region);
    } else {
      moveToCamera(camera);
    }
    if(customMapStyleString != null) {
      map.setMapStyle(new MapStyleOptions(customMapStyleString));
    }
  }

  private void moveToRegion(ReadableMap region) {
    if (region == null) return;

    double lng = region.getDouble("longitude");
    double lat = region.getDouble("latitude");
    double lngDelta = region.getDouble("longitudeDelta");
    double latDelta = region.getDouble("latitudeDelta");
    LatLngBounds bounds = new LatLngBounds(
            new LatLng(lat - latDelta / 2, lng - lngDelta / 2), // southwest
            new LatLng(lat + latDelta / 2, lng + lngDelta / 2)  // northeast
    );
    if (super.getHeight() <= 0 || super.getWidth() <= 0) {
      // in this case, our map has not been laid out yet, so we save the bounds in a local
      // variable, and make a guess of zoomLevel 10. Not to worry, though: as soon as layout
      // occurs, we will move the camera to the saved bounds. Note that if we tried to move
      // to the bounds now, it would trigger an exception.
      map.moveCamera(CameraUpdateFactory.newLatLngZoom(new LatLng(lat, lng), 10));
      boundsToMove = bounds;
    } else {
      map.moveCamera(CameraUpdateFactory.newLatLngBounds(bounds, 0));
      boundsToMove = null;
    }
  }

  public void setRegion(ReadableMap region) {
    this.region = region;
    if(region != null && map != null) {
      moveToRegion(region);
    }
  }

  public void setCamera(ReadableMap camera) {
    this.camera = camera;
    if(camera != null && map != null) {
      moveToCamera(camera);
    }
  }

  public void moveToCamera(ReadableMap camera) {
    if (camera == null) return;

    CameraPosition.Builder builder = new CameraPosition.Builder();

    ReadableMap center = camera.getMap("center");
    if (center != null) {
      double lng = center.getDouble("longitude");
      double lat = center.getDouble("latitude");
      builder.target(new LatLng(lat, lng));
    }

    builder.tilt((float)camera.getDouble("pitch"));
    builder.bearing((float)camera.getDouble("heading"));
    builder.zoom((float)camera.getDouble("zoom"));

    CameraUpdate update = CameraUpdateFactory.newCameraPosition(builder.build());

    if (super.getHeight() <= 0 || super.getWidth() <= 0) {
      // in this case, our map has not been laid out yet, so we save the camera update in a
      // local variable. As soon as layout occurs, we will move the camera to the saved update.
      // Note that if we tried to move to the camera now, it would trigger an exception.
      cameraToSet = update;
    } else {
      map.moveCamera(update);
      cameraToSet = null;
    }
  }

  public void setMapStyle(@Nullable String customMapStyleString) {
    this.customMapStyleString = customMapStyleString;
    if(map != null && customMapStyleString != null) {
      map.setMapStyle(new MapStyleOptions(customMapStyleString));
    }
  }

  public void setShowsUserLocation(boolean showUserLocation) {
    this.showUserLocation = showUserLocation; // hold onto this for lifecycle handling
    if (hasPermissions()) {
      map.setLocationSource(fusedLocationSource);
      //noinspection MissingPermission
      map.setMyLocationEnabled(showUserLocation);
    }
  }

  public void setUserLocationPriority(int priority){
    fusedLocationSource.setPriority(priority);
  }

  public void setUserLocationUpdateInterval(int interval){
    fusedLocationSource.setInterval(interval);
  }

  public void setUserLocationFastestInterval(int interval){
    fusedLocationSource.setFastestInterval(interval);
  }

  public void setShowsMyLocationButton(boolean showMyLocationButton) {
    if (hasPermissions() || !showMyLocationButton) {
      map.getUiSettings().setMyLocationButtonEnabled(showMyLocationButton);
    }
  }

  public void setToolbarEnabled(boolean toolbarEnabled) {
    if (hasPermissions() || !toolbarEnabled) {
      map.getUiSettings().setMapToolbarEnabled(toolbarEnabled);
    }
  }

  public void setCacheEnabled(boolean cacheEnabled) {
    this.cacheEnabled = cacheEnabled;
    this.cacheView();
  }

  public void enableMapLoading(boolean loadingEnabled) {
    if (loadingEnabled && !this.isMapLoaded) {
      this.getMapLoadingLayoutView().setVisibility(View.VISIBLE);
    }
  }

  public void setMoveOnMarkerPress(boolean moveOnPress) {
    this.moveOnMarkerPress = moveOnPress;
  }

  public void setLoadingBackgroundColor(Integer loadingBackgroundColor) {
    this.loadingBackgroundColor = loadingBackgroundColor;

    if (this.mapLoadingLayout != null) {
      if (loadingBackgroundColor == null) {
        this.mapLoadingLayout.setBackgroundColor(Color.WHITE);
      } else {
        this.mapLoadingLayout.setBackgroundColor(this.loadingBackgroundColor);
      }
    }
  }

  public void setLoadingIndicatorColor(Integer loadingIndicatorColor) {
    this.loadingIndicatorColor = loadingIndicatorColor;
    if (this.mapLoadingProgressBar != null) {
      Integer color = loadingIndicatorColor;
      if (color == null) {
        color = Color.parseColor("#606060");
      }

      ColorStateList progressTintList = ColorStateList.valueOf(loadingIndicatorColor);
      ColorStateList secondaryProgressTintList = ColorStateList.valueOf(loadingIndicatorColor);
      ColorStateList indeterminateTintList = ColorStateList.valueOf(loadingIndicatorColor);

      this.mapLoadingProgressBar.setProgressTintList(progressTintList);
      this.mapLoadingProgressBar.setSecondaryProgressTintList(secondaryProgressTintList);
      this.mapLoadingProgressBar.setIndeterminateTintList(indeterminateTintList);
    }
  }

  public void setHandlePanDrag(boolean handlePanDrag) {
    this.handlePanDrag = handlePanDrag;
  }

  public void addFeature(View child, int index) {
    // Our desired API is to pass up annotations/overlays as children to the mapview component.
    // This is where we intercept them and do the appropriate underlying mapview action.
    if (child instanceof AirMapMarker) {
      AirMapMarker annotation = (AirMapMarker) child;
      annotation.addToMap(map);
      features.add(index, annotation);

      // Allow visibility event to be triggered later
      int visibility = annotation.getVisibility();
      annotation.setVisibility(INVISIBLE);

      // Remove from a view group if already present, prevent "specified child
      // already had a parent" error.
      ViewGroup annotationParent = (ViewGroup)annotation.getParent();
      if (annotationParent != null) {
        annotationParent.removeView(annotation);
      }

      // Add to the parent group
      attacherGroup.addView(annotation);

      // Trigger visibility event if necessary.
      // With some testing, seems like it is not always
      //   triggered just by being added to a parent view.
      annotation.setVisibility(visibility);

      Marker marker = (Marker) annotation.getFeature();
      markerMap.put(marker, annotation);
    } else if (child instanceof AirMapPolyline) {
      AirMapPolyline polylineView = (AirMapPolyline) child;
      polylineView.addToMap(map);
      features.add(index, polylineView);
      Polyline polyline = (Polyline) polylineView.getFeature();
      polylineMap.put(polyline, polylineView);
    } else if (child instanceof AirMapGradientPolyline) {
      AirMapGradientPolyline polylineView = (AirMapGradientPolyline) child;
      polylineView.addToMap(map);
      features.add(index, polylineView);
      TileOverlay tileOverlay = (TileOverlay) polylineView.getFeature();
      gradientPolylineMap.put(tileOverlay, polylineView);
    } else if (child instanceof AirMapPolygon) {
      AirMapPolygon polygonView = (AirMapPolygon) child;
      polygonView.addToMap(map);
      features.add(index, polygonView);
      Polygon polygon = (Polygon) polygonView.getFeature();
      polygonMap.put(polygon, polygonView);
    } else if (child instanceof AirMapCircle) {
      AirMapCircle circleView = (AirMapCircle) child;
      circleView.addToMap(map);
      features.add(index, circleView);
    } else if (child instanceof AirMapUrlTile) {
      AirMapUrlTile urlTileView = (AirMapUrlTile) child;
      urlTileView.addToMap(map);
      features.add(index, urlTileView);
    } else if (child instanceof AirMapWMSTile) {
      AirMapWMSTile urlTileView = (AirMapWMSTile) child;
      urlTileView.addToMap(map);
      features.add(index, urlTileView);
    } else if (child instanceof AirMapLocalTile) {
      AirMapLocalTile localTileView = (AirMapLocalTile) child;
      localTileView.addToMap(map);
      features.add(index, localTileView);
    } else if (child instanceof AirMapOverlay) {
      AirMapOverlay overlayView = (AirMapOverlay) child;
      overlayView.addToMap(map);
      features.add(index, overlayView);
      GroundOverlay overlay = (GroundOverlay) overlayView.getFeature();
      overlayMap.put(overlay, overlayView);
    } else if (child instanceof AirMapHeatmap) {
      AirMapHeatmap heatmapView = (AirMapHeatmap) child;
      heatmapView.addToMap(map);
      features.add(index, heatmapView);
      TileOverlay heatmap = (TileOverlay)heatmapView.getFeature();
      heatmapMap.put(heatmap, heatmapView);
    } else if (child instanceof ViewGroup) {
      ViewGroup children = (ViewGroup) child;
      for (int i = 0; i < children.getChildCount(); i++) {
        addFeature(children.getChildAt(i), index);
      }
    } else {
      addView(child, index);
    }
  }

  public int getFeatureCount() {
    return features.size();
  }

  public View getFeatureAt(int index) {
    return features.get(index);
  }

  public void removeFeatureAt(int index) {
    AirMapFeature feature = features.remove(index);
    if (feature instanceof AirMapMarker) {
      markerMap.remove(feature.getFeature());
    } else if (feature instanceof AirMapHeatmap) {
      heatmapMap.remove(feature.getFeature());
    }
    feature.removeFromMap(map);
  }

  public WritableMap makeClickEventData(LatLng point) {
    WritableMap event = new WritableNativeMap();

    WritableMap coordinate = new WritableNativeMap();
    coordinate.putDouble("latitude", point.latitude);
    coordinate.putDouble("longitude", point.longitude);
    event.putMap("coordinate", coordinate);

    Projection projection = map.getProjection();
    Point screenPoint = projection.toScreenLocation(point);

    WritableMap position = new WritableNativeMap();
    position.putDouble("x", screenPoint.x);
    position.putDouble("y", screenPoint.y);
    event.putMap("position", position);

    return event;
  }

  public void updateExtraData(Object extraData) {
    // if boundsToMove is not null, we now have the MapView's width/height, so we can apply
    // a proper camera move
    if (boundsToMove != null) {
      HashMap<String, Float> data = (HashMap<String, Float>) extraData;
      int width = data.get("width") == null ? 0 : data.get("width").intValue();
      int height = data.get("height") == null ? 0 : data.get("height").intValue();

      //fix for https://github.com/react-native-maps/react-native-maps/issues/245,
      //it's not guaranteed the passed-in height and width would be greater than 0.
      if (width <= 0 || height <= 0) {
        map.moveCamera(CameraUpdateFactory.newLatLngBounds(boundsToMove, 0));
      } else {
        map.moveCamera(CameraUpdateFactory.newLatLngBounds(boundsToMove, width, height, 0));
      }

      boundsToMove = null;
      cameraToSet = null;
    }
    else if (cameraToSet != null) {
      map.moveCamera(cameraToSet);
      cameraToSet = null;
    }
  }

  public void animateToCamera(ReadableMap camera, int duration) {
    if (map == null) return;
    CameraPosition.Builder builder = new CameraPosition.Builder(map.getCameraPosition());
    if (camera.hasKey("zoom")) {
      builder.zoom((float)camera.getDouble("zoom"));
    }
    if (camera.hasKey("heading")) {
      builder.bearing((float)camera.getDouble("heading"));
    }
    if (camera.hasKey("pitch")) {
      builder.tilt((float)camera.getDouble("pitch"));
    }
    if (camera.hasKey("center")) {
      ReadableMap center = camera.getMap("center");
      builder.target(new LatLng(center.getDouble("latitude"), center.getDouble("longitude")));
    }

    CameraUpdate update = CameraUpdateFactory.newCameraPosition(builder.build());

    if (duration <= 0) {
      map.moveCamera(update);
    }
    else {
      map.animateCamera(update, duration, null);
    }
  }

  public void animateToRegion(LatLngBounds bounds, int duration) {
    if (map == null) return;
    if(duration <= 0) {
      map.moveCamera(CameraUpdateFactory.newLatLngBounds(bounds, 0));
    } else {
      map.animateCamera(CameraUpdateFactory.newLatLngBounds(bounds, 0), duration, null);
    }
  }

  public void fitToElements(ReadableMap edgePadding, boolean animated) {
    if (map == null) return;

    LatLngBounds.Builder builder = new LatLngBounds.Builder();

    boolean addedPosition = false;

    for (AirMapFeature feature : features) {
      if (feature instanceof AirMapMarker) {
        Marker marker = (Marker) feature.getFeature();
        builder.include(marker.getPosition());
        addedPosition = true;
      }
      // TODO(lmr): may want to include shapes / etc.
    }
    if (addedPosition) {
      LatLngBounds bounds = builder.build();
      CameraUpdate cu = CameraUpdateFactory.newLatLngBounds(bounds, baseMapPadding);

      if (edgePadding != null) {
        map.setPadding(edgePadding.getInt("left"), edgePadding.getInt("top"),
          edgePadding.getInt("right"), edgePadding.getInt("bottom"));
      }

      if (animated) {
        map.animateCamera(cu);
      } else {
        map.moveCamera(cu);
      }
    }
  }

  public void fitToSuppliedMarkers(ReadableArray markerIDsArray, ReadableMap edgePadding, boolean animated) {
    if (map == null) return;

    LatLngBounds.Builder builder = new LatLngBounds.Builder();

    String[] markerIDs = new String[markerIDsArray.size()];
    for (int i = 0; i < markerIDsArray.size(); i++) {
      markerIDs[i] = markerIDsArray.getString(i);
    }

    boolean addedPosition = false;

    List<String> markerIDList = Arrays.asList(markerIDs);

    for (AirMapFeature feature : features) {
      if (feature instanceof AirMapMarker) {
        String identifier = ((AirMapMarker) feature).getIdentifier();
        Marker marker = (Marker) feature.getFeature();
        if (markerIDList.contains(identifier)) {
          builder.include(marker.getPosition());
          addedPosition = true;
        }
      }
    }

    if (addedPosition) {
      LatLngBounds bounds = builder.build();
      CameraUpdate cu = CameraUpdateFactory.newLatLngBounds(bounds, baseMapPadding);

      if (edgePadding != null) {
        map.setPadding(edgePadding.getInt("left"), edgePadding.getInt("top"),
          edgePadding.getInt("right"), edgePadding.getInt("bottom"));
      }

      if (animated) {
        map.animateCamera(cu);
      } else {
        map.moveCamera(cu);
      }
    }
  }

  int baseLeftMapPadding;
  int baseRightMapPadding;
  int baseTopMapPadding;
  int baseBottomMapPadding;

  public void applyBaseMapPadding(int left, int top, int right, int bottom){
    this.map.setPadding(left, top, right, bottom);
    baseLeftMapPadding = left;
    baseRightMapPadding = right;
    baseTopMapPadding = top;
    baseBottomMapPadding = bottom;
  }

  public void fitToCoordinates(ReadableArray coordinatesArray, ReadableMap edgePadding,
      boolean animated) {
    if (map == null) return;

    LatLngBounds.Builder builder = new LatLngBounds.Builder();

    for (int i = 0; i < coordinatesArray.size(); i++) {
      ReadableMap latLng = coordinatesArray.getMap(i);
      double lat = latLng.getDouble("latitude");
      double lng = latLng.getDouble("longitude");
      builder.include(new LatLng(lat, lng));
    }

    LatLngBounds bounds = builder.build();
    CameraUpdate cu = CameraUpdateFactory.newLatLngBounds(bounds, baseMapPadding);

    if (edgePadding != null) {
      appendMapPadding(edgePadding.getInt("left"), edgePadding.getInt("top"), edgePadding.getInt("right"), edgePadding.getInt("bottom"));
    }

    if (animated) {
      map.animateCamera(cu);
    } else {
      map.moveCamera(cu);
    }
    // Move the google logo to the default base padding value.
    map.setPadding(baseLeftMapPadding, baseTopMapPadding, baseRightMapPadding, baseBottomMapPadding);
  }

  private void appendMapPadding(int iLeft,int iTop, int iRight, int iBottom) {
    int left;
    int top;
    int right;
    int bottom;
    double density = getResources().getDisplayMetrics().density;

    left = (int) (iLeft * density);
    top = (int) (iTop * density);
    right = (int) (iRight * density);
    bottom = (int) (iBottom * density);

    map.setPadding(left + baseLeftMapPadding,
            top + baseTopMapPadding,
            right + baseRightMapPadding,
            bottom + baseBottomMapPadding);
  }

  public double[][] getMapBoundaries() {
    LatLngBounds bounds = map.getProjection().getVisibleRegion().latLngBounds;
    LatLng northEast = bounds.northeast;
    LatLng southWest = bounds.southwest;

    return new double[][] {
      {northEast.longitude, northEast.latitude},
      {southWest.longitude, southWest.latitude}
    };
  }

  public void setMapBoundaries(ReadableMap northEast, ReadableMap southWest) {
    if (map == null) return;

    LatLngBounds.Builder builder = new LatLngBounds.Builder();

    double latNE = northEast.getDouble("latitude");
    double lngNE = northEast.getDouble("longitude");
    builder.include(new LatLng(latNE, lngNE));

    double latSW = southWest.getDouble("latitude");
    double lngSW = southWest.getDouble("longitude");
    builder.include(new LatLng(latSW, lngSW));

    LatLngBounds bounds = builder.build();

    map.setLatLngBoundsForCameraTarget(bounds);
  }

  // InfoWindowAdapter interface

  @Override
  public View getInfoWindow(Marker marker) {
    AirMapMarker markerView = getMarkerMap(marker);
    return markerView.getCallout();
  }

  @Override
  public View getInfoContents(Marker marker) {
    AirMapMarker markerView = getMarkerMap(marker);
    return markerView.getInfoContents();
  }

  @Override
  public boolean dispatchTouchEvent(MotionEvent ev) {
    gestureDetector.onTouchEvent(ev);

    int X = (int)ev.getX();          
    int Y = (int)ev.getY();
    if(map != null) {
      tapLocation = map.getProjection().fromScreenLocation(new Point(X,Y));
    }

    int action = MotionEventCompat.getActionMasked(ev);

    switch (action) {
      case (MotionEvent.ACTION_DOWN):
        this.getParent().requestDisallowInterceptTouchEvent(
            map != null && map.getUiSettings().isScrollGesturesEnabled());
        break;
      case (MotionEvent.ACTION_UP):
        // Clear this regardless, since isScrollGesturesEnabled() may have been updated
        this.getParent().requestDisallowInterceptTouchEvent(false);
        break;
    }
    super.dispatchTouchEvent(ev);
    return true;
  }

  @Override
  public void onMarkerDragStart(Marker marker) {
    WritableMap event = makeClickEventData(marker.getPosition());
    manager.pushEvent(context, this, "onMarkerDragStart", event);

    AirMapMarker markerView = getMarkerMap(marker);
    event = makeClickEventData(marker.getPosition());
    manager.pushEvent(context, markerView, "onDragStart", event);
  }

  @Override
  public void onMarkerDrag(Marker marker) {
    WritableMap event = makeClickEventData(marker.getPosition());
    manager.pushEvent(context, this, "onMarkerDrag", event);

    AirMapMarker markerView = getMarkerMap(marker);
    event = makeClickEventData(marker.getPosition());
    manager.pushEvent(context, markerView, "onDrag", event);
  }

  @Override
  public void onMarkerDragEnd(Marker marker) {
    WritableMap event = makeClickEventData(marker.getPosition());
    manager.pushEvent(context, this, "onMarkerDragEnd", event);

    AirMapMarker markerView = getMarkerMap(marker);
    event = makeClickEventData(marker.getPosition());
    manager.pushEvent(context, markerView, "onDragEnd", event);
  }

  @Override
  public void onPoiClick(PointOfInterest poi) {
    WritableMap event = makeClickEventData(poi.latLng);

    event.putString("placeId", poi.placeId);
    event.putString("name", poi.name);

    manager.pushEvent(context, this, "onPoiClick", event);
  }

  private ProgressBar getMapLoadingProgressBar() {
    if (this.mapLoadingProgressBar == null) {
      this.mapLoadingProgressBar = new ProgressBar(getContext());
      this.mapLoadingProgressBar.setIndeterminate(true);
    }
    if (this.loadingIndicatorColor != null) {
      this.setLoadingIndicatorColor(this.loadingIndicatorColor);
    }
    return this.mapLoadingProgressBar;
  }

  private RelativeLayout getMapLoadingLayoutView() {
    if (this.mapLoadingLayout == null) {
      this.mapLoadingLayout = new RelativeLayout(getContext());
      this.mapLoadingLayout.setBackgroundColor(Color.LTGRAY);
      this.addView(this.mapLoadingLayout,
          new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
              ViewGroup.LayoutParams.MATCH_PARENT));

      RelativeLayout.LayoutParams params = new RelativeLayout.LayoutParams(
          RelativeLayout.LayoutParams.WRAP_CONTENT, RelativeLayout.LayoutParams.WRAP_CONTENT);
      params.addRule(RelativeLayout.CENTER_IN_PARENT);
      this.mapLoadingLayout.addView(this.getMapLoadingProgressBar(), params);

      this.mapLoadingLayout.setVisibility(View.INVISIBLE);
    }
    this.setLoadingBackgroundColor(this.loadingBackgroundColor);
    return this.mapLoadingLayout;
  }

  private ImageView getCacheImageView() {
    if (this.cacheImageView == null) {
      this.cacheImageView = new ImageView(getContext());
      this.addView(this.cacheImageView,
          new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
              ViewGroup.LayoutParams.MATCH_PARENT));
      this.cacheImageView.setVisibility(View.INVISIBLE);
    }
    return this.cacheImageView;
  }

  private void removeCacheImageView() {
    if (this.cacheImageView != null) {
      ((ViewGroup) this.cacheImageView.getParent()).removeView(this.cacheImageView);
      this.cacheImageView = null;
    }
  }

  private void removeMapLoadingProgressBar() {
    if (this.mapLoadingProgressBar != null) {
      ((ViewGroup) this.mapLoadingProgressBar.getParent()).removeView(this.mapLoadingProgressBar);
      this.mapLoadingProgressBar = null;
    }
  }

  private void removeMapLoadingLayoutView() {
    this.removeMapLoadingProgressBar();
    if (this.mapLoadingLayout != null) {
      ((ViewGroup) this.mapLoadingLayout.getParent()).removeView(this.mapLoadingLayout);
      this.mapLoadingLayout = null;
    }
  }

  private void cacheView() {
    if (this.cacheEnabled) {
      final ImageView cacheImageView = this.getCacheImageView();
      final RelativeLayout mapLoadingLayout = this.getMapLoadingLayoutView();
      cacheImageView.setVisibility(View.INVISIBLE);
      mapLoadingLayout.setVisibility(View.VISIBLE);
      if (this.isMapLoaded) {
        this.map.snapshot(new GoogleMap.SnapshotReadyCallback() {
          @Override public void onSnapshotReady(Bitmap bitmap) {
            cacheImageView.setImageBitmap(bitmap);
            cacheImageView.setVisibility(View.VISIBLE);
            mapLoadingLayout.setVisibility(View.INVISIBLE);
          }
        });
      }
    } else {
      this.removeCacheImageView();
      if (this.isMapLoaded) {
        this.removeMapLoadingLayoutView();
      }
    }
  }

  public void onPanDrag(MotionEvent ev) {
    Point point = new Point((int) ev.getX(), (int) ev.getY());
    LatLng coords = this.map.getProjection().fromScreenLocation(point);
    WritableMap event = makeClickEventData(coords);
    manager.pushEvent(context, this, "onPanDrag", event);
  }

  public void onDoublePress(MotionEvent ev) {
    if (this.map == null) return;
    Point point = new Point((int) ev.getX(), (int) ev.getY());
    LatLng coords = this.map.getProjection().fromScreenLocation(point);
    WritableMap event = makeClickEventData(coords);
    manager.pushEvent(context, this, "onDoublePress", event);
  }

  public void setKmlSrc(String kmlSrc) {
    try {
      InputStream kmlStream =  new FileUtil(context).execute(kmlSrc).get();

      if (kmlStream == null) {
        return;
      }

      KmlLayer kmlLayer = new KmlLayer(map, kmlStream, context);
      kmlLayer.addLayerToMap();

      WritableMap pointers = new WritableNativeMap();
      WritableArray markers = new WritableNativeArray();

      if (kmlLayer.getContainers() == null) {
        manager.pushEvent(context, this, "onKmlReady", pointers);
        return;
      }

      //Retrieve a nested container within the first container
      KmlContainer container = kmlLayer.getContainers().iterator().next();
      if (container == null || container.getContainers() == null) {
        manager.pushEvent(context, this, "onKmlReady", pointers);
        return;
      }


      if (container.getContainers().iterator().hasNext()) {
        container = container.getContainers().iterator().next();
      }

      int index = 0;
      for (KmlPlacemark placemark : container.getPlacemarks()) {
        MarkerOptions options = new MarkerOptions();

        if (placemark.getInlineStyle() != null) {
          options = placemark.getMarkerOptions();
        } else {
          options.icon(BitmapDescriptorFactory.defaultMarker());
        }

        LatLng latLng = ((LatLng) placemark.getGeometry().getGeometryObject());
        String title = "";
        String snippet = "";

        if (placemark.hasProperty("name")) {
          title = placemark.getProperty("name");
        }

        if (placemark.hasProperty("description")) {
          snippet = placemark.getProperty("description");
        }

        options.position(latLng);
        options.title(title);
        options.snippet(snippet);

        AirMapMarker marker = new AirMapMarker(context, options, this.manager.getMarkerManager());

        if (placemark.getInlineStyle() != null
            && placemark.getInlineStyle().getIconUrl() != null) {
          marker.setImage(placemark.getInlineStyle().getIconUrl());
        } else if (container.getStyle(placemark.getStyleId()) != null) {
          KmlStyle style = container.getStyle(placemark.getStyleId());
          marker.setImage(style.getIconUrl());
        }

        String identifier = title + " - " + index;

        marker.setIdentifier(identifier);

        addFeature(marker, index++);

        WritableMap loadedMarker = makeClickEventData(latLng);
        loadedMarker.putString("id", identifier);
        loadedMarker.putString("title", title);
        loadedMarker.putString("description", snippet);

        markers.pushMap(loadedMarker);
      }

      pointers.putArray("markers", markers);

      manager.pushEvent(context, this, "onKmlReady", pointers);

    } catch (XmlPullParserException | IOException | InterruptedException | ExecutionException e) {
      e.printStackTrace();
    }
  }

  @Override
  public void onIndoorBuildingFocused() {
    IndoorBuilding building = this.map.getFocusedBuilding();
    if (building != null) {
      List<IndoorLevel> levels = building.getLevels();
      int index = 0;
      WritableArray levelsArray = Arguments.createArray();
      for (IndoorLevel level : levels) {
        WritableMap levelMap = Arguments.createMap();
        levelMap.putInt("index", index);
        levelMap.putString("name", level.getName());
        levelMap.putString("shortName", level.getShortName());
        levelsArray.pushMap(levelMap);
        index++;
      }
      WritableMap event = Arguments.createMap();
      WritableMap indoorBuilding = Arguments.createMap();
      indoorBuilding.putArray("levels", levelsArray);
      indoorBuilding.putInt("activeLevelIndex", building.getActiveLevelIndex());
      indoorBuilding.putBoolean("underground", building.isUnderground());

      event.putMap("IndoorBuilding", indoorBuilding);

      manager.pushEvent(context, this, "onIndoorBuildingFocused", event);
    } else {
      WritableMap event = Arguments.createMap();
      WritableArray levelsArray = Arguments.createArray();
      WritableMap indoorBuilding = Arguments.createMap();
      indoorBuilding.putArray("levels", levelsArray);
      indoorBuilding.putInt("activeLevelIndex", 0);
      indoorBuilding.putBoolean("underground", false);

      event.putMap("IndoorBuilding", indoorBuilding);

      manager.pushEvent(context, this, "onIndoorBuildingFocused", event);
    }
  }

  @Override
  public void onIndoorLevelActivated(IndoorBuilding building) {
    if (building == null) {
      return;
    }
    int activeLevelIndex = building.getActiveLevelIndex();
    if (activeLevelIndex < 0 || activeLevelIndex >= building.getLevels().size()) {
      return;
    }
    IndoorLevel level = building.getLevels().get(activeLevelIndex);

    WritableMap event = Arguments.createMap();
    WritableMap indoorlevel = Arguments.createMap();

    indoorlevel.putInt("activeLevelIndex", activeLevelIndex);
    indoorlevel.putString("name", level.getName());
    indoorlevel.putString("shortName", level.getShortName());

    event.putMap("IndoorLevel", indoorlevel);

    manager.pushEvent(context, this, "onIndoorLevelActivated", event);
  }

  public void setIndoorActiveLevelIndex(int activeLevelIndex) {
    IndoorBuilding building = this.map.getFocusedBuilding();
    if (building != null) {
      if (activeLevelIndex >= 0 && activeLevelIndex < building.getLevels().size()) {
        IndoorLevel level = building.getLevels().get(activeLevelIndex);
        if (level != null) {
          level.activate();
        }
      }
    }
  }

  private AirMapMarker getMarkerMap(Marker marker) {
    AirMapMarker airMarker = markerMap.get(marker);

    if (airMarker != null) {
      return airMarker;
    }

    for (Map.Entry<Marker, AirMapMarker> entryMarker : markerMap.entrySet()) {
      if (entryMarker.getKey().getPosition().equals(marker.getPosition())
          && entryMarker.getKey().getTitle().equals(marker.getTitle())) {
        airMarker = entryMarker.getValue();
        break;
      }
    }

    return airMarker;
  }

  @Override
  public void requestLayout() {
    super.requestLayout();
    post(measureAndLayout);
  }

  private final Runnable measureAndLayout = new Runnable() {
    @Override
    public void run() {
      measure(MeasureSpec.makeMeasureSpec(getWidth(), MeasureSpec.EXACTLY),
              MeasureSpec.makeMeasureSpec(getHeight(), MeasureSpec.EXACTLY));
      layout(getLeft(), getTop(), getRight(), getBottom());
    }
  };
}
