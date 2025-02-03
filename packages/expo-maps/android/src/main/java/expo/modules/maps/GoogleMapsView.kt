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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
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
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.sharedobjects.SharedRef
import expo.modules.kotlin.types.toKClass
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import kotlinx.coroutines.launch

data class GoogleMapsViewProps(
  val userLocation: MutableState<UserLocationRecord> = mutableStateOf(UserLocationRecord()),
  val cameraPosition: MutableState<CameraPositionRecord> = mutableStateOf(CameraPositionRecord()),
  val markers: MutableState<List<MarkerRecord>> = mutableStateOf(listOf()),
  val uiSettings: MutableState<MapUiSettingsRecord> = mutableStateOf(MapUiSettingsRecord()),
  val properties: MutableState<MapPropertiesRecord> = mutableStateOf(MapPropertiesRecord()),
  val colorScheme: MutableState<MapColorSchemeEnum> = mutableStateOf(MapColorSchemeEnum.FOLLOW_SYSTEM)
) : ComposeProps

@SuppressLint("ViewConstructor")
class GoogleMapsView(context: Context, appContext: AppContext) : ExpoComposeView<GoogleMapsViewProps>(context, appContext) {
  override val props = GoogleMapsViewProps()

  private val onMapLoaded by EventDispatcher<Unit>()

  private val onMapClick by EventDispatcher<Coordinates>()
  private val onMapLongClick by EventDispatcher<Coordinates>()
  private val onPOIClick by EventDispatcher<POIRecord>()
  private val onMarkerClick by EventDispatcher<MarkerRecord>()

  private val onCameraMove by EventDispatcher<CameraMoveEvent>()

  private var wasLoaded = mutableStateOf(false)

  private lateinit var cameraState: CameraPositionState
  private var manualCameraControl = false

  init {
    setContent {
      cameraState = updateCameraState()
      val markerState = markerStateFromProps()
      val locationSource = locationSourceFromProps(cameraState)

      GoogleMap(
        modifier = Modifier.fillMaxSize(),
        cameraPositionState = cameraState,
        uiSettings = props.uiSettings.value.toMapUiSettings(),
        properties = props.properties.value.toMapProperties(),
        onMapLoaded = {
          onMapLoaded(Unit)
          wasLoaded.value = true
        },
        onMapClick = { latLng ->
          onMapClick(
            Coordinates(latLng.latitude, latLng.longitude)
          )
        },
        onMapLongClick = { latLng ->
          onMapLongClick(
            Coordinates(latLng.latitude, latLng.longitude)
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
        for ((marker, state) in markerState.value) {
          val icon = getIconDescriptor(marker)

          Marker(
            state = state,
            title = marker.title,
            snippet = marker.snippet,
            draggable = marker.draggable,
            icon = icon,
            onClick = {
              onMarkerClick(
                // We can't send icon to js, because it's not serializable
                // So we need to remove it from the marker record
                MarkerRecord(
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
    cameraState = remember {
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
  private fun locationSourceFromProps(cameraState: CameraPositionState): LocationSource? {
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
