package abi30_0_0.host.exp.exponent.modules.api.components.maps;

import android.content.Context;
import android.content.pm.PackageManager;
import android.content.res.ColorStateList;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Point;
import android.graphics.PorterDuff;
import android.os.Build;
import android.support.v4.view.GestureDetectorCompat;
import android.support.v4.view.MotionEventCompat;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;
import android.location.Location;

import abi30_0_0.com.facebook.react.bridge.LifecycleEventListener;
import abi30_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi30_0_0.com.facebook.react.bridge.ReadableArray;
import abi30_0_0.com.facebook.react.bridge.ReadableMap;
import abi30_0_0.com.facebook.react.bridge.WritableArray;
import abi30_0_0.com.facebook.react.bridge.WritableMap;
import abi30_0_0.com.facebook.react.bridge.WritableNativeArray;
import abi30_0_0.com.facebook.react.bridge.WritableNativeMap;
import abi30_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi30_0_0.com.facebook.react.uimanager.UIManagerModule;
import abi30_0_0.com.facebook.react.uimanager.events.EventDispatcher;
import com.google.android.gms.maps.CameraUpdate;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.GoogleMapOptions;
import com.google.android.gms.maps.MapView;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.Projection;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.CameraPosition;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.LatLngBounds;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.gms.maps.model.PointOfInterest;
import com.google.android.gms.maps.model.Polygon;
import com.google.android.gms.maps.model.Polyline;
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

import static android.support.v4.content.PermissionChecker.checkSelfPermission;

public class AirMapView extends MapView implements GoogleMap.InfoWindowAdapter,
    GoogleMap.OnMarkerDragListener, OnMapReadyCallback, GoogleMap.OnPoiClickListener {
  public GoogleMap map;
  private KmlLayer kmlLayer;
  private ProgressBar mapLoadingProgressBar;
  private RelativeLayout mapLoadingLayout;
  private ImageView cacheImageView;
  private Boolean isMapLoaded = false;
  private Integer loadingBackgroundColor = null;
  private Integer loadingIndicatorColor = null;
  private final int baseMapPadding = 50;

  private LatLngBounds boundsToMove;
  private boolean showUserLocation = false;
  private boolean handlePanDrag = false;
  private boolean moveOnMarkerPress = true;
  private boolean cacheEnabled = false;
  private boolean initialRegionSet = false;
  private LatLngBounds cameraLastIdleBounds;
  private int cameraMoveReason = 0;

  private static final String[] PERMISSIONS = new String[]{
      "android.permission.ACCESS_FINE_LOCATION", "android.permission.ACCESS_COARSE_LOCATION"};

  private final List<AirMapFeature> features = new ArrayList<>();
  private final Map<Marker, AirMapMarker> markerMap = new HashMap<>();
  private final Map<Polyline, AirMapPolyline> polylineMap = new HashMap<>();
  private final Map<Polygon, AirMapPolygon> polygonMap = new HashMap<>();
  private final GestureDetectorCompat gestureDetector;
  private final AirMapManager manager;
  private LifecycleEventListener lifecycleListener;
  private boolean paused = false;
  private boolean destroyed = false;
  private final ThemedReactContext context;
  private final EventDispatcher eventDispatcher;

  private static boolean contextHasBug(Context context) {
    return context == null ||
        context.getResources() == null ||
        context.getResources().getConfiguration() == null;
  }

  // We do this to fix this bug:
  // https://github.com/airbnb/react-native-maps/issues/271
  //
  // which conflicts with another bug regarding the passed in context:
  // https://github.com/airbnb/react-native-maps/issues/1147
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
      } else {
        // ¯\_(ツ)_/¯
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
  }

  @Override
  public void onMapReady(final GoogleMap map) {
    if (destroyed) {
      return;
    }
    this.map = map;
    this.map.setInfoWindowAdapter(this);
    this.map.setOnMarkerDragListener(this);
    this.map.setOnPoiClickListener(this);

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
        coordinate.putDouble("accuracy", location.getAccuracy());
        coordinate.putDouble("speed", location.getSpeed());
        if(android.os.Build.VERSION.SDK_INT >= 18){
        coordinate.putBoolean("isFromMockProvider", location.isFromMockProvider());
        }         

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
        WritableMap event = makeClickEventData(polygon.getPoints().get(0));
        event.putString("action", "polygon-press");
        manager.pushEvent(context, polygonMap.get(polygon), "onPress", event);
      }
    });

    map.setOnPolylineClickListener(new GoogleMap.OnPolylineClickListener() {
      @Override
      public void onPolylineClick(Polyline polyline) {
        WritableMap event = makeClickEventData(polyline.getPoints().get(0));
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
        eventDispatcher.dispatchEvent(new RegionChangeEvent(getId(), bounds, true));
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
          eventDispatcher.dispatchEvent(new RegionChangeEvent(getId(), bounds, false));
        }
      }
    });

    map.setOnMapLoadedCallback(new GoogleMap.OnMapLoadedCallback() {
      @Override public void onMapLoaded() {
        isMapLoaded = true;
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
        if (hasPermissions()) {
          //noinspection MissingPermission
          map.setMyLocationEnabled(showUserLocation);
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
        if (hasPermissions()) {
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
    return checkSelfPermission(getContext(), PERMISSIONS[0]) == PackageManager.PERMISSION_GRANTED ||
        checkSelfPermission(getContext(), PERMISSIONS[1]) == PackageManager.PERMISSION_GRANTED;
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
    if (!initialRegionSet && initialRegion != null) {
      setRegion(initialRegion);
      initialRegionSet = true;
    }
  }

  public void setRegion(ReadableMap region) {
    if (region == null) return;

    Double lng = region.getDouble("longitude");
    Double lat = region.getDouble("latitude");
    Double lngDelta = region.getDouble("longitudeDelta");
    Double latDelta = region.getDouble("latitudeDelta");
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

  public void setShowsUserLocation(boolean showUserLocation) {
    this.showUserLocation = showUserLocation; // hold onto this for lifecycle handling
    if (hasPermissions()) {
      //noinspection MissingPermission
      map.setMyLocationEnabled(showUserLocation);
    }
  }

  public void setShowsMyLocationButton(boolean showMyLocationButton) {
    if (hasPermissions()) {
      map.getUiSettings().setMyLocationButtonEnabled(showMyLocationButton);
    }
  }

  public void setToolbarEnabled(boolean toolbarEnabled) {
    if (hasPermissions()) {
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

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        ColorStateList progressTintList = ColorStateList.valueOf(loadingIndicatorColor);
        ColorStateList secondaryProgressTintList = ColorStateList.valueOf(loadingIndicatorColor);
        ColorStateList indeterminateTintList = ColorStateList.valueOf(loadingIndicatorColor);

        this.mapLoadingProgressBar.setProgressTintList(progressTintList);
        this.mapLoadingProgressBar.setSecondaryProgressTintList(secondaryProgressTintList);
        this.mapLoadingProgressBar.setIndeterminateTintList(indeterminateTintList);
      } else {
        PorterDuff.Mode mode = PorterDuff.Mode.SRC_IN;
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.GINGERBREAD_MR1) {
          mode = PorterDuff.Mode.MULTIPLY;
        }
        if (this.mapLoadingProgressBar.getIndeterminateDrawable() != null)
          this.mapLoadingProgressBar.getIndeterminateDrawable().setColorFilter(color, mode);
        if (this.mapLoadingProgressBar.getProgressDrawable() != null)
          this.mapLoadingProgressBar.getProgressDrawable().setColorFilter(color, mode);
      }
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
      Marker marker = (Marker) annotation.getFeature();
      markerMap.put(marker, annotation);
    } else if (child instanceof AirMapPolyline) {
      AirMapPolyline polylineView = (AirMapPolyline) child;
      polylineView.addToMap(map);
      features.add(index, polylineView);
      Polyline polyline = (Polyline) polylineView.getFeature();
      polylineMap.put(polyline, polylineView);
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
    } else if (child instanceof AirMapLocalTile) {
      AirMapLocalTile localTileView = (AirMapLocalTile) child;
      localTileView.addToMap(map);
      features.add(index, localTileView);
    } else if (child instanceof AirMapOverlay) {
      AirMapOverlay overlayView = (AirMapOverlay) child;
      overlayView.addToMap(map);
      features.add(index, overlayView);
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

      //fix for https://github.com/airbnb/react-native-maps/issues/245,
      //it's not guaranteed the passed-in height and width would be greater than 0.
      if (width <= 0 || height <= 0) {
        map.moveCamera(CameraUpdateFactory.newLatLngBounds(boundsToMove, 0));
      } else {
        map.moveCamera(CameraUpdateFactory.newLatLngBounds(boundsToMove, width, height, 0));
      }

      boundsToMove = null;
    }
  }

  public void animateToRegion(LatLngBounds bounds, int duration) {
    if (map == null) return;
    map.animateCamera(CameraUpdateFactory.newLatLngBounds(bounds, 0), duration, null);
  }

  public void animateToViewingAngle(float angle, int duration) {
    if (map == null) return;

    CameraPosition cameraPosition = new CameraPosition.Builder(map.getCameraPosition())
      .tilt(angle)
      .build();
    map.animateCamera(CameraUpdateFactory.newCameraPosition(cameraPosition), duration, null);
  }

  public void animateToBearing(float bearing, int duration) {
    if (map == null) return;
    CameraPosition cameraPosition = new CameraPosition.Builder(map.getCameraPosition())
        .bearing(bearing)
        .build();
    map.animateCamera(CameraUpdateFactory.newCameraPosition(cameraPosition), duration, null);
  }

  public void animateToCoordinate(LatLng coordinate, int duration) {
    if (map == null) return;
    map.animateCamera(CameraUpdateFactory.newLatLng(coordinate), duration, null);
  }

  public void fitToElements(boolean animated) {
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
      if (animated) {
        map.animateCamera(cu);
      } else {
        map.moveCamera(cu);
      }
    }
  }

  public void fitToSuppliedMarkers(ReadableArray markerIDsArray, boolean animated) {
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
      if (animated) {
        map.animateCamera(cu);
      } else {
        map.moveCamera(cu);
      }
    }
  }

  public void fitToCoordinates(ReadableArray coordinatesArray, ReadableMap edgePadding,
      boolean animated) {
    if (map == null) return;

    LatLngBounds.Builder builder = new LatLngBounds.Builder();

    for (int i = 0; i < coordinatesArray.size(); i++) {
      ReadableMap latLng = coordinatesArray.getMap(i);
      Double lat = latLng.getDouble("latitude");
      Double lng = latLng.getDouble("longitude");
      builder.include(new LatLng(lat, lng));
    }

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
    map.setPadding(0, 0, 0,
        0); // Without this, the Google logo is moved up by the value of edgePadding.bottom
  }

  public void setMapBoundaries(ReadableMap northEast, ReadableMap southWest) {
    if (map == null) return;

    LatLngBounds.Builder builder = new LatLngBounds.Builder();

    Double latNE = northEast.getDouble("latitude");
    Double lngNE = northEast.getDouble("longitude");
    builder.include(new LatLng(latNE, lngNE));

    Double latSW = southWest.getDouble("latitude");
    Double lngSW = southWest.getDouble("longitude");
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

  public void setKmlSrc(String kmlSrc) {
    try {
      InputStream kmlStream =  new FileUtil(context).execute(kmlSrc).get();

      if (kmlStream == null) {
        return;
      }

      kmlLayer = new KmlLayer(map, kmlStream, context);
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

      Integer index = 0;
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

        AirMapMarker marker = new AirMapMarker(context, options);

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

    } catch (XmlPullParserException e) {
      e.printStackTrace();
    } catch (IOException e) {
      e.printStackTrace();
    } catch (InterruptedException e) {
      e.printStackTrace();
    } catch (ExecutionException e) {
      e.printStackTrace();
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
}
