@file:OptIn(EitherType::class)

package expo.modules.maps

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
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
import expo.modules.kotlin.apifeatures.EitherType
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

  @Composable
  override fun Content(modifier: Modifier) {
    cameraState = updateCameraState()
    val markerState = markerStateFromProps()
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
        onCircleClick = onCircleClick
      )

      for ((marker, state) in markerState.value) {
        val icon = getIconDescriptor(marker)

        Marker(
          state = state,
          title = marker.title,
          snippet = marker.snippet,
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

  @Composable
  private fun updateCameraState(): CameraPositionState {
    val cameraPosition = props.cameraPosition.value
    cameraState = remember(cameraPosition) {
      CameraPositionState(
        position = CameraPosition.fromLatLngZoom(
          cameraPosition.coordinates.toLatLng(),
          cameraPosition.zoom
        )
      )
    }

    LaunchedEffect(cameraState.cameraMoveStartedReason) {
      // We should stop following the user's location when camera is moved manually.
      if (cameraState.cameraMoveStartedReason == CameraMoveStartedReason.GESTURE || cameraState.cameraMoveStartedReason == CameraMoveStartedReason.API_ANIMATION) {
        manualCameraControl = true
      }
    }

    LaunchedEffect(cameraState.position) {
      // We don't want to send the event when the map is not loaded yet
      if (!wasLoaded.value) {
        return@LaunchedEffect
      }

      val position = cameraState.position
      onCameraMove(
        CameraMoveEvent(
          Coordinates(position.target.latitude, position.target.longitude),
          position.zoom,
          position.tilt,
          position.bearing
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
    // Stop updating the camera position based on user location.
    manualCameraControl = true
    // If no coordinates are provided, the camera will be centered on the user's location.
    val coordinates: LatLng = config?.coordinates?.toLatLng()
      ?: props.userLocation.value.coordinates?.toLatLng()
      ?: return

    val cameraUpdate = config?.zoom?.let { CameraUpdateFactory.newLatLngZoom(coordinates, it) }
      ?: CameraUpdateFactory.newLatLng(coordinates)

    // When Int.MAX_VALUE is provided as durationMs, the default animation duration will be used.
    cameraState.animate(cameraUpdate, config?.duration ?: Int.MAX_VALUE)

    // If centering on the user's location, stop manual camera control.
    if (config?.coordinates == null) {
      manualCameraControl = false
    }
  }

  private fun getIconDescriptor(marker: MarkerRecord): BitmapDescriptor? {
    return marker.icon?.let { icon ->
      val bitmap = if (icon.`is`(toKClass<SharedRef<Drawable>>())) {
        (icon.get(toKClass<SharedRef<Drawable>>()).ref as? BitmapDrawable)?.bitmap
      } else {
        icon.get(toKClass<SharedRef<Bitmap>>()).ref
      }

      bitmap?.let { BitmapDescriptorFactory.fromBitmap(it) }
    }
  }
}

@Composable
private fun MapCircles(
  circleState: List<Pair<CircleRecord, LatLng>>,
  onCircleClick: ViewEventCallback<CircleRecord>
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
            lineWidth = circle.lineWidth
          )
        )
      }
    )
  }
}
