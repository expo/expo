package expo.modules.maps.remake

import android.content.Context
import android.util.Log
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import com.google.android.gms.maps.model.CameraPosition
import com.google.maps.android.compose.CameraPositionState
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView

data class GoogleMapsViewProps(
  val cameraPosition: MutableState<CameraPositionRecord> = mutableStateOf(CameraPositionRecord()),
  val markers: MutableState<List<Marker>> = mutableStateOf(listOf()),
  val uiSettings: MutableState<MapUiSettingsRecord> = mutableStateOf(MapUiSettingsRecord()),
  val properties: MutableState<MapPropertiesRecord> = mutableStateOf(MapPropertiesRecord())
) : ComposeProps

class GoogleMapsView(context: Context, appContext: AppContext) : ExpoComposeView<GoogleMapsViewProps>(context, appContext) {
  override val props = GoogleMapsViewProps()

  init {
    setContent {
      val cameraState = remember {
        derivedStateOf {
          CameraPositionState(position = CameraPosition.fromLatLngZoom(
            props.cameraPosition.value.coordinates.toLatLng(),
            props.cameraPosition.value.zoom
          ))
        }
      }

      val markerState = remember {
        derivedStateOf {
          props.markers.value.map { marker ->
            marker to MarkerState(position = marker.coordinates.toLatLng())
          }
        }
      }

      val uiSettings = remember {
        derivedStateOf {
          props.uiSettings.value.toMapUiSettings()
        }
      }

      val properties = remember {
        derivedStateOf {
          props.properties.value.toMapProperties()
        }
      }

      Log.e("GoogleMapsView", "${properties.value.minZoomPreference}")

      GoogleMap(
        modifier = Modifier.fillMaxSize(),
        cameraPositionState = cameraState.value,
        uiSettings = uiSettings.value,
        properties = properties.value
      ) {
        for ((marker, state) in markerState.value) {
          Marker(
            state = state,
            title = marker.title,
            snippet = marker.snippet
          )
        }
      }
    }
  }
}
