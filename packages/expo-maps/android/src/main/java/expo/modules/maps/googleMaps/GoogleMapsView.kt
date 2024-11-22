package expo.modules.maps.googleMaps

import android.content.Context
import android.widget.LinearLayout
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.MapView
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.model.MapStyleOptions
import com.google.maps.android.collections.MarkerManager
import expo.modules.core.interfaces.services.UIManager
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.maps.*
import expo.modules.maps.interfaces.ExpoMapView
import expo.modules.maps.records.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.collectLatest

class GoogleMapsView(context: Context, appContext: AppContext) : LinearLayout(context), OnMapReadyCallback, ExpoMapView {

  private val mapView: MapView = MapView(context)
  private lateinit var googleMap: GoogleMap
  private lateinit var controls: GoogleMapsControls
  private lateinit var gestures: GoogleMapsGestures
  private lateinit var markers: GoogleMapsMarkers
  private lateinit var clusters: GoogleMapsClusters
  private lateinit var polygons: GoogleMapsPolygons
  private lateinit var polylines: GoogleMapsPolylines
  private lateinit var circles: GoogleMapsCircles
  private lateinit var kmls: GoogleMapsKMLs
  private lateinit var geojsons: GoogleMapsGeoJsons
  private lateinit var markerManager: MarkerManager
  private lateinit var overlays: GoogleMapsOverlays
  private lateinit var heatmaps: GoogleMapsHeatmaps
  private lateinit var places: GoogleMapsPlaces
  private lateinit var callbacks: GoogleMapsCallbacks
  private lateinit var cameraAnimations: GoogleMapsCameraAnimations

  private val mapReady = MutableStateFlow(false)
  private var wasInitialCameraPositionSet = false

  private val onMapLoaded by EventDispatcher<Unit>()
  private val onMapPress by EventDispatcher<LatLngRecord>()
  private val onLongPress by EventDispatcher<LatLngRecord>()
  private val onRegionChange by EventDispatcher<CameraPositionRecord>()
  private val onRegionChangeStarted by EventDispatcher<CameraPositionRecord>()
  private val onRegionChangeComplete by EventDispatcher<CameraPositionRecord>()
  private val onPoiClick by EventDispatcher<PointOfInterestRecord>()
  private val onMarkerPress by EventDispatcher<MarkerRecord>()
  private val onMarkerDrag by EventDispatcher<MarkerRecord>()
  private val onMarkerDragStarted by EventDispatcher<MarkerRecord>()
  private val onMarkerDragComplete by EventDispatcher<MarkerRecord>()
  private val onClusterPress by EventDispatcher<ClusterRecord>()
  private val onLocationButtonPress by EventDispatcher<UserLocationRecord>()
  private val onLocationDotPress by EventDispatcher<UserLocationRecord>()
  private val onLocationChange by EventDispatcher<UserLocationRecord>()

  val lifecycleEventListener = MapViewLifecycleEventListener(mapView)

  init {
    mapView.onCreate(null)
    mapView.getMapAsync(this)
    mapView.onStart()
    mapView.onResume()
    addView(mapView)

    appContext.legacyModule<UIManager>()
      ?.registerLifecycleEventListener(lifecycleEventListener)
  }

  override fun onMapReady(googleMap: GoogleMap) {
    this.googleMap = googleMap
    markerManager = MarkerManager(googleMap)
    controls = GoogleMapsControls(googleMap)
    gestures = GoogleMapsGestures(googleMap)
    markers = GoogleMapsMarkers(googleMap, markerManager)
    clusters = GoogleMapsClusters(context, googleMap, markerManager, onClusterPress, onMarkerPress)
    polygons = GoogleMapsPolygons(googleMap)
    polylines = GoogleMapsPolylines(googleMap)
    circles = GoogleMapsCircles(googleMap)
    kmls = GoogleMapsKMLs(context, googleMap)
    geojsons = GoogleMapsGeoJsons(googleMap)
    overlays = GoogleMapsOverlays(googleMap)
    heatmaps = GoogleMapsHeatmaps(googleMap)
    places = GoogleMapsPlaces(context, googleMap, markers)
    callbacks = GoogleMapsCallbacks(googleMap, context)
    cameraAnimations = GoogleMapsCameraAnimations(googleMap)

    CoroutineScope(Dispatchers.Default).launch {
      mapReady.emit(true)
    }

    setupCallbacks()
  }

  fun onViewDestroyed() {
    callbacks.removeLocationRequests()
  }

  fun setShowZoomControl(enable: Boolean) {
    updateMap {
      controls.setShowZoomControl(enable)
    }
  }

  fun setShowCompass(enable: Boolean) {
    updateMap {
      controls.setShowCompass(enable)
    }
  }

  fun setShowMapToolbar(enable: Boolean) {
    updateMap {
      controls.setShowMapToolbar(enable)
    }
  }

  fun setShowMyLocationButton(enable: Boolean) {
    updateMap {
      controls.setShowMyLocationButton(enable)
    }
  }

  fun setShowLevelPicker(enable: Boolean) {
    updateMap {
      controls.setShowLevelPicker(enable)
    }
  }

  fun setEnabledRotateGestures(enabled: Boolean) {
    updateMap {
      gestures.setEnabledRotateGesture(enabled)
    }
  }

  fun setEnabledScrollGestures(enabled: Boolean) {
    updateMap {
      gestures.setEnabledScrollGesture(enabled)
    }
  }

  fun setEnabledTiltGestures(enabled: Boolean) {
    updateMap {
      gestures.setEnabledTiltGesture(enabled)
    }
  }

  fun setEnabledZoomGestures(enabled: Boolean) {
    updateMap {
      gestures.setEnabledZoomGesture(enabled)
    }
  }

  fun fetchPlacesSearchCompletions(searchQueryFragment: String, promise: Promise) {
    updateMap {
      places.fetchSearchCompletions(searchQueryFragment, promise)
    }
  }

  fun createPlaceSearchRequest(place: String) {
    updateMap {
      places.createSearchRequest(place)
    }
  }

  fun setClickablePOIs(arePOIClickable: Boolean) {
    updateMap {
      places.setClickablePOIs(arePOIClickable)
    }
  }

  fun setLocationCallbackPriority(priority: Int) {
    updateMap {
      callbacks.setLocationCallbackPriority(priority)
    }
  }

  fun setLocationCallbackInterval(interval: Long) {
    updateMap {
      callbacks.setLocationCallbackInterval(interval)
    }
  }

  override fun moveCamera(cameraMove: CameraMoveRecord, promise: Promise?) {
    updateMap {
      cameraAnimations.moveCamera(cameraMove, promise)
    }
  }

  override fun setMapType(mapType: MapType) {
    val googleMapType = when (mapType) {
      MapType.Normal -> GoogleMap.MAP_TYPE_NORMAL
      MapType.Terrain -> GoogleMap.MAP_TYPE_TERRAIN
      MapType.Satellite -> GoogleMap.MAP_TYPE_SATELLITE
      MapType.Hybrid -> GoogleMap.MAP_TYPE_HYBRID
    }

    updateMap {
      googleMap.mapType = googleMapType
    }
  }

  fun setMapStyle(jsonStyleString: String) {
    if (jsonStyleString.isNotEmpty()) {
      updateMap {
        googleMap.setMapStyle(MapStyleOptions(jsonStyleString))
      }
    } else {
      updateMap {
        googleMap.setMapStyle(null)
      }
    }
  }

  override fun setMarkers(markerObjects: Array<MarkerObject>) {
    updateMap {
      markers.setMarkers(markerObjects)
    }
  }

  override fun setPolygons(polygonObjects: Array<PolygonObject>) {
    updateMap {
      polygons.setPolygons(polygonObjects)
    }
  }

  override fun setPolylines(polylineObjects: Array<PolylineObject>) {
    updateMap {
      polylines.setPolylines(polylineObjects)
    }
  }

  override fun setCircles(circleObjects: Array<CircleObject>) {
    updateMap {
      circles.setCircles(circleObjects)
    }
  }

  override fun setInitialCameraPosition(initialCameraPosition: CameraMoveRecord) {
    if (!wasInitialCameraPositionSet) {
      updateMap {
        moveCamera(initialCameraPosition, null)
      }
      wasInitialCameraPositionSet = true
    }
  }

  override fun setClusters(clusterObjects: Array<ClusterObject>) {
    updateMap {
      clusters.setClusters(clusterObjects)
    }
  }

  override fun setEnabledTraffic(enableTraffic: Boolean) {
    updateMap {
      googleMap.isTrafficEnabled = enableTraffic
    }
  }

  override fun setKMLs(kmlObjects: Array<KMLObject>) {
    updateMap {
      kmls.setKMLs(kmlObjects)
    }
  }

  override fun setGeoJsons(geoJsonObjects: Array<GeoJsonObject>) {
    updateMap {
      geojsons.setGeoJsons(geoJsonObjects)
    }
  }

  override fun setHeatmaps(heatmapObjects: Array<HeatmapObject>) {
    updateMap {
      heatmaps.setHeatmaps(heatmapObjects)
    }
  }

  override fun setOverlays(overlayObjects: Array<OverlayObject>) {
    updateMap {
      overlays.setOverlays(overlayObjects)
    }
  }

  private fun setupCallbacks() {
    callbacks.setupOnMapPress(onMapPress)
    callbacks.setupOnMapLoaded(onMapLoaded)
    callbacks.setupOnRegionChange(onRegionChange)
    callbacks.setupOnRegionChangeStarted(onRegionChangeStarted)
    callbacks.setupOnRegionChangeComplete(onRegionChangeComplete, clusters)
    callbacks.setupOnPoiClick(onPoiClick)
    callbacks.setupOnLongPress(onLongPress)
    callbacks.setupOnLocationButtonButtonPress(onLocationButtonPress)
    callbacks.setupOnLocationDotPress(onLocationDotPress)
    callbacks.setupOnLocationChange(onLocationChange)

    markers.setOnMarkerPressListener(onMarkerPress)
    markers.setOnMarkerDragListeners(onMarkerDrag, onMarkerDragStarted, onMarkerDragComplete)
  }

  /*
      Calls function provided as an argument when OnMapReadyCallback fires,
      subscribes to StateFlow in a background but calls lambda on a main thread.
      After calling lambda the subscription is canceled.
      StateFlow holds the latest value so even if updateMap is called after
      OnMapReadyCallback, StateFlow emits the latest value letting provided lambda to be executed.
   */
  private fun updateMap(update: () -> Unit) {
    CoroutineScope(Dispatchers.IO).launch {
      mapReady.collectLatest {
        if (it) {
          withContext(Dispatchers.Main) {
            update()
          }
          cancel()
        }
      }
    }
  }
}
