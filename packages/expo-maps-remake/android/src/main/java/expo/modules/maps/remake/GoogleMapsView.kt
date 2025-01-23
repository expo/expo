@file:OptIn(EitherType::class)

package expo.modules.maps.remake

import android.content.Context
import android.graphics.Bitmap
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.State
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import com.google.android.gms.maps.model.BitmapDescriptor
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.CameraPosition
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

data class GoogleMapsViewProps(
  val cameraPosition: MutableState<CameraPositionRecord> = mutableStateOf(CameraPositionRecord()),
  val markers: MutableState<List<MarkerRecord>> = mutableStateOf(listOf()),
  val uiSettings: MutableState<MapUiSettingsRecord> = mutableStateOf(MapUiSettingsRecord()),
  val properties: MutableState<MapPropertiesRecord> = mutableStateOf(MapPropertiesRecord()),
  val colorScheme: MutableState<MapColorSchemeEnum> = mutableStateOf(MapColorSchemeEnum.FOLLOW_SYSTEM)
) : ComposeProps

class GoogleMapsView(context: Context, appContext: AppContext) : ExpoComposeView<GoogleMapsViewProps>(context, appContext) {
  override val props = GoogleMapsViewProps()

  private val onMapClick by EventDispatcher<Coordinates>()
  private val onPOIClick by EventDispatcher<POIRecord>()
  private val onMarkerClick by EventDispatcher<MarkerRecord>()
  private val onCameraMove by EventDispatcher<CameraMoveEvent>()

  init {
    setContent {
      val cameraState = cameraStateFromProps()
      val markerState = markerStateFromProps()

      GoogleMap(
        modifier = Modifier.fillMaxSize(),
        cameraPositionState = cameraState.value,
        uiSettings = props.uiSettings.value.toMapUiSettings(),
        properties = props.properties.value.toMapProperties(),
        onMapClick = { latLng ->
          onMapClick(
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
        mapColorScheme = props.colorScheme.value.toComposeMapColorScheme()
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
  private fun cameraStateFromProps(): State<CameraPositionState> {
    val cameraState = remember {
      derivedStateOf {
        CameraPositionState(
          position = CameraPosition.fromLatLngZoom(
            props.cameraPosition.value.coordinates.toLatLng(),
            props.cameraPosition.value.zoom
          )
        )
      }
    }

    LaunchedEffect(cameraState.value.position) {
      val position = cameraState.value.position
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
  private fun markerStateFromProps() =
    remember {
      derivedStateOf {
        props.markers.value.map { marker ->
          marker to MarkerState(position = marker.coordinates.toLatLng())
        }
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
