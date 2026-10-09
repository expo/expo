package expo.modules.maps

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Point
import android.graphics.drawable.Drawable
import android.view.MotionEvent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.core.graphics.drawable.toBitmap
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.State
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.LocationSource
import com.google.android.gms.maps.model.BitmapDescriptor
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.CameraMoveStartedReason
import com.google.maps.android.compose.CameraPositionState
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.Polygon
import com.google.maps.android.compose.Circle
import com.google.maps.android.compose.Polyline
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedRef
import expo.modules.kotlin.types.toKClass
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.viewevent.ViewEventCallback
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import kotlinx.coroutines.launch
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.ui.unit.dp
import com.google.android.gms.maps.GoogleMapOptions
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedComposeProps
data class GoogleMapsViewProps(
  val userLocation: MutableState<UserLocationRecord> = mutableStateOf(UserLocationRecord()),
  val cameraPosition: MutableState<CameraPositionRecord> = mutableStateOf(CameraPositionRecord()),
  val markers: MutableState<List<MarkerRecord>> = mutableStateOf(listOf()),
  val polylines: MutableState<List<PolylineRecord>> = mutableStateOf(listOf()),
  val polygons: MutableState<List<PolygonRecord>> = mutableStateOf(listOf()),
  val circles: MutableState<List<CircleRecord>> = mutableStateOf(listOf()),
  val uiSettings: MutableState<MapUiSettingsRecord> = mutableStateOf(MapUiSettingsRecord()),
  val properties: MutableState<MapPropertiesRecord> = mutableStateOf(MapPropertiesRecord()),
  val colorScheme: MutableState<MapColorSchemeEnum> = mutableStateOf(MapColorSchemeEnum.FOLLOW_SYSTEM),
  val contentPadding: MutableState<MapContentPaddingRecord> = mutableStateOf(MapContentPaddingRecord()),
  val mapOptions: MutableState<MapOptionsRecord> = mutableStateOf(MapOptionsRecord())
) : ComposeProps

@SuppressLint("ViewConstructor")
class GoogleMapsView(context: Context, appContext: AppContext) :
  ExpoComposeView<GoogleMapsViewProps>(context, appContext, withHostingView = true) {
  override val props = GoogleMapsViewProps()

  private val onMapLoaded by EventDispatcher<Unit>()

  private val onMapClick by EventDispatcher<MapClickEvent>()
  private val onMapLongClick by EventDispatcher<MapClickEvent>()
  private val onPOIClick by EventDispatcher<POIRecord>()
  private val onMarkerClick by EventDispatcher<MarkerRecord>()
  private val onPolylineClick by EventDispatcher<PolylineRecord>()
  private val onPolygonClick by EventDispatcher<PolygonRecord>()
  private val onCircleClick by EventDispatcher<CircleRecord>()

  private val onCameraMove by EventDispatcher<CameraMoveEvent>()

  private var wasLoaded = mutableStateOf(false)

  private lateinit var cameraState: CameraPositionState
  private var manualCameraControl = false
  private var pendingCameraPosition: CameraPosition? = null

  private var lastTouchPoint: Point? = null

  // Selection state management
  private lateinit var markerState: State<List<Pair<MarkerRecord, MarkerState>>>

  override fun dispatchTouchEvent(event: MotionEvent): Boolean {
    if (event.action == MotionEvent.ACTION_DOWN) {
      lastTouchPoint = Point(event.x.toInt(), event.y.toInt())
    }
    return super.dispatchTouchEvent(event)
  }

  @Composable
  override fun ComposableScope.Content() {
    cameraState = updateCameraState()
    markerState = markerStateFromProps()
    val locationSource = locationSourceFromProps()
    val polylineState by polylineStateFromProps()
    val polygonState by polygonStateFromProps()
    val circleState by circleStateFromProps()
    val mapOptions = props.mapOptions.value.mapId?.let { GoogleMapOptions().mapId(it) } ?: GoogleMapOptions()

    GoogleMap(
      googleMapOptionsFactory = { mapOptions },
      modifier = Modifier.fillMaxSize(),
      cameraPositionState = cameraState,
      uiSettings = props.uiSettings.value.toMapUiSettings(),
      properties = props.properties.value.toMapProperties(),
      contentPadding = props.contentPadding.value.let {
        PaddingValues(start = it.start.dp, end = it.end.dp, top = it.top.dp, bottom = it.bottom.dp)
      },
      onMapLoaded = {
        onMapLoaded(Unit)
        wasLoaded.value = true
      },
      onMapClick = { latLng ->
        onMapClick(
          MapClickEvent(
            Coordinates(latLng.latitude, latLng.longitude)
          )
        )
      },
      onMapLongClick = { latLng ->
        onMapLongClick(
          MapClickEvent(
            Coordinates(latLng.latitude, latLng.longitude)
          )
        )
      },
      onPOIClick = { poi ->
        onPOIClick(
          POIRecord(
            poi.name,
            Coordinates(poi.latLng.latitude, poi.latLng.longitude)
          )
        )
      },
      onMyLocationButtonClick = props.userLocation.value.coordinates?.let { coordinates ->
        {
          // Override onMyLocationButtonClick with default behavior to update manualCameraControl
          appContext.mainQueue.launch {
            cameraState.animate(CameraUpdateFactory.newLatLng(coordinates.toLatLng()))
            manualCameraControl = false
          }
          true
        }
      },
      mapColorScheme = props.colorScheme.value.toComposeMapColorScheme(),
      locationSource = locationSource
    ) {
      polylineState.forEach { (polyline, coordinates) ->
        Polyline(
          points = coordinates,
          color = Color(polyline.color),
          geodesic = polyline.geodesic,
          width = polyline.width,
          clickable = true,
          onClick = {
            onPolylineClick(
              PolylineRecord(
                id = polyline.id,
                coordinates.map { Coordinates(it.latitude, it.longitude) },
                polyline.geodesic,
                polyline.color,
                polyline.width
              )
            )
          }
        )
      }

      MapPolygons(
        polygonState = polygonState,
        onPolygonClick = onPolygonClick
      )

      MapCircles(
        circleState = circleState,
        onCircleClick = onCircleClick,
        getClickCoordinates = {
          lastTouchPoint?.let { point ->
            cameraState.projection?.fromScreenLocation(point)?.let { latLng ->
              Coordinates(latLng.latitude, latLng.longitude)
            }
          }
        }
      )

      for ((marker, state) in markerState.value) {
        key(marker.id) {
          val icon = remember(marker.icon) { getIconDescriptor(marker) }

          Marker(
            state = state,
            title = marker.title.takeIf { it.isNotEmpty() },
            snippet = marker.snippet.takeIf { it.isNotEmpty() },
            draggable = marker.draggable,
            anchor = marker.anchor.toOffset(),
            zIndex = marker.zIndex,
            icon = icon,
            onClick = {
              onMarkerClick(
                // We can't send icon to js, because it's not serializable
                // So we need to remove it from the marker record
                MarkerRecord(
                  id = marker.id,
                  title = marker.title,
                  snippet = marker.snippet,
                  coordinates = marker.coordinates
                )
              )
              !marker.showCallout
            }
          )
        }
      }
    }
  }

  @Composable
  private fun updateCameraState(): CameraPositionState {
    val cameraPosition = props.cameraPosition.value
    cameraState = remember(cameraPosition) {
      pendingCameraPosition = null
      CameraPositionState(
        position = CameraPosition.Builder()
          .target(cameraPosition.coordinates.toLatLng())
          .zoom(cameraPosition.zoom)
          .tilt(cameraPosition.tilt.takeIf { it.isFinite() }?.coerceIn(0f, 90f) ?: 0f)
          .bearing(cameraPosition.bearing.takeIf { it.isFinite() } ?: 0f)
          .build()
      )
    }

    LaunchedEffect(cameraState.cameraMoveStartedReason) {
      // We should stop following the user's location when camera is moved manually.
      if (cameraState.cameraMoveStartedReason == CameraMoveStartedReason.GESTURE || cameraState.cameraMoveStartedReason == CameraMoveStartedReason.API_ANIMATION) {
        manualCameraControl = true
        pendingCameraPosition = null
      }
    }

    LaunchedEffect(cameraState.position, wasLoaded.value) {
      // We don't want to send the event when the map is not loaded yet
      if (!wasLoaded.value) {
        return@LaunchedEffect
      }

      val position = cameraState.position
      val bounds = cameraState.projection?.visibleRegion?.latLngBounds ?: return@LaunchedEffect
      val latitudeDelta = bounds.northeast.latitude - bounds.southwest.latitude
      val rawLongitudeDelta = bounds.northeast.longitude - bounds.southwest.longitude
      // We need to subtract 360 from longitude delta when crossing the antimeridian to get the correct value
      val longitudeDelta = if (rawLongitudeDelta < 0) {
        rawLongitudeDelta + 360.0
      } else {
        rawLongitudeDelta
      }

      onCameraMove(
        CameraMoveEvent(
          Coordinates(position.target.latitude, position.target.longitude),
          position.zoom,
          position.tilt,
          position.bearing,
          latitudeDelta,
          longitudeDelta
        )
      )
    }
    return cameraState
  }

  @Composable
  private fun locationSourceFromProps(): LocationSource? {
    val coordinates = props.userLocation.value.coordinates
    val followUserLocation = props.userLocation.value.followUserLocation

    val locationSource = remember(coordinates) {
      CustomLocationSource()
    }
    LaunchedEffect(coordinates) {
      if (coordinates == null) {
        return@LaunchedEffect
      }
      locationSource.onLocationChanged(coordinates.toLocation())
      if (followUserLocation && !manualCameraControl) {
        // Update camera position when location changes and manualCameraControl is disabled.
        cameraState.animate(CameraUpdateFactory.newLatLng(coordinates.toLatLng()))
      }
    }
    return coordinates?.let {
      locationSource.apply {
        onLocationChanged(coordinates.toLocation())
      }
    }
  }

  @Composable
  private fun markerStateFromProps() =
    remember {
      derivedStateOf {
        props.markers.value.map { marker ->
          marker to MarkerState(position = marker.coordinates.toLatLng())
        }
      }
    }

  @Composable
  private fun circleStateFromProps() =
    remember {
      derivedStateOf {
        props.circles.value.map { circle ->
          circle to circle.center.toLatLng()
        }
      }
    }

  @Composable
  private fun polylineStateFromProps() =
    remember {
      derivedStateOf {
        props.polylines.value.map { polyline ->
          polyline to polyline.coordinates.map { it.toLatLng() }
        }
      }
    }

  @Composable
  private fun polygonStateFromProps() =
    remember {
      derivedStateOf {
        props.polygons.value.map { polygon ->
          polygon to polygon.coordinates.map { it.toLatLng() }
        }
      }
    }

  @Composable
  private fun MapPolygons(
    polygonState: List<Pair<PolygonRecord, List<LatLng>>>,
    onPolygonClick: ViewEventCallback<PolygonRecord>
  ) {
    polygonState.forEach { (polygon, coordinates) ->
      Polygon(
        points = coordinates,
        fillColor = Color(polygon.color),
        strokeColor = Color(polygon.lineColor),
        strokeWidth = polygon.lineWidth,
        clickable = true,
        onClick = {
          onPolygonClick(
            PolygonRecord(
              id = polygon.id,
              coordinates.map { Coordinates(it.latitude, it.longitude) },
              color = polygon.color,
              lineColor = polygon.lineColor,
              lineWidth = polygon.lineWidth
            )
          )
        }
      )
    }
  }

  suspend fun setCameraPosition(config: SetCameraPositionConfig?) {
    val duration = config?.duration ?: Int.MAX_VALUE
    require(duration >= 0) { "duration must be nonnegative" }
    require(config?.tilt?.isFinite() != false && config?.bearing?.isFinite() != false) {
      "tilt and bearing must be finite"
    }

    // Stop following location, preserving the existing no-location call behavior.
    manualCameraControl = true
    // Merge partial orientation requests with the latest target, not an intermediate frame.
    val changesOrientation = config?.tilt != null || config?.bearing != null
    val currentCamera = if (changesOrientation) pendingCameraPosition ?: cameraState.position else cameraState.position
    val centerOnUser = config?.coordinates == null && !changesOrientation
    val coordinates = config?.coordinates?.toLatLng()
      ?: (if (centerOnUser) props.userLocation.value.coordinates?.toLatLng() else currentCamera.target)
      ?: return

    val targetCamera = CameraPosition.Builder(currentCamera)
      .target(coordinates)
      .apply {
        config?.zoom?.let { zoom(it) }
        config?.tilt?.let { tilt(it.coerceIn(0f, 90f)) }
        config?.bearing?.let { bearing(it) }
      }
      .build()
    pendingCameraPosition = targetCamera
    try {
      val cameraUpdate = CameraUpdateFactory.newCameraPosition(targetCamera)
      // When Int.MAX_VALUE is provided as durationMs, the default animation duration will be used.
      if (duration == 0) {
        cameraState.move(cameraUpdate)
      } else {
        cameraState.animate(cameraUpdate, duration)
      }
      if (centerOnUser && pendingCameraPosition === targetCamera) {
        manualCameraControl = false
      }
    } finally {
      // A superseded animation must not clear the newer request's target.
      if (pendingCameraPosition === targetCamera) {
        pendingCameraPosition = null
      }
    }
  }

  /**
   * Programmatically select a marker by its ID.
   * Shows the info window and optionally animates the camera to the marker.
   */
  suspend fun selectMarker(id: String?, options: SelectOptionsRecord?) {
    if (id == null) {
      markerState.value.forEach { it.second.hideInfoWindow() }
      val cameraUpdate = CameraUpdateFactory.newCameraPosition(cameraState.position)
      cameraState.move(cameraUpdate)
      return
    }
    val (marker, state) = markerState.value.find { it.first.id == id } ?: return
    state.showInfoWindow()
    onMarkerClick(
      MarkerRecord(
        id = marker.id,
        title = marker.title,
        snippet = marker.snippet,
        coordinates = marker.coordinates
      )
    )
    val moveCamera = options?.moveCamera ?: true
    if (moveCamera) {
      val zoom = options?.zoom
      val cameraUpdate = if (zoom != null) {
        CameraUpdateFactory.newLatLngZoom(state.position, zoom)
      } else {
        CameraUpdateFactory.newLatLng(state.position)
      }
      cameraState.animate(cameraUpdate)
    }
  }

  private fun getIconDescriptor(marker: MarkerRecord): BitmapDescriptor? {
    return marker.icon?.let { icon ->
      val bitmap = if (icon.`is`(toKClass<SharedRef<Drawable>>())) {
        icon.get(toKClass<SharedRef<Drawable>>()).ref.toBitmap()
      } else {
        icon.get(toKClass<SharedRef<Bitmap>>()).ref
      }

      BitmapDescriptorFactory.fromBitmap(bitmap)
    }
  }
}

@Composable
private fun MapCircles(
  circleState: List<Pair<CircleRecord, LatLng>>,
  onCircleClick: ViewEventCallback<CircleRecord>,
  getClickCoordinates: () -> Coordinates?
) {
  circleState.forEach { (circle, center) ->
    Circle(
      center = center,
      radius = circle.radius,
      fillColor = Color(circle.color),
      strokeColor = circle.lineColor?.let { Color(it) } ?: Color.Transparent,
      strokeWidth = circle.lineWidth ?: 0f,
      clickable = true,
      onClick = {
        onCircleClick(
          CircleRecord(
            id = circle.id,
            center = Coordinates(center.latitude, center.longitude),
            radius = circle.radius,
            color = circle.color,
            lineColor = circle.lineColor,
            lineWidth = circle.lineWidth,
            clickCoordinates = getClickCoordinates()
          )
        )
      }
    )
  }
}
