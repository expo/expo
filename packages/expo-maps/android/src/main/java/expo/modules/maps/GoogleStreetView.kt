package expo.modules.maps

import android.content.Context
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import com.google.android.gms.maps.StreetViewPanoramaOptions
import com.google.android.gms.maps.model.StreetViewPanoramaCamera
import com.google.maps.android.compose.streetview.StreetView
import com.google.maps.android.ktx.MapsExperimentalFeature
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView

data class GoogleStreetViewProps(
  val position: MutableState<CameraPositionStreetViewRecord> = mutableStateOf(CameraPositionStreetViewRecord()),
  val isPanningGesturesEnabled: MutableState<Boolean> = mutableStateOf(true),
  val isStreetNamesEnabled: MutableState<Boolean> = mutableStateOf(true),
  val isUserNavigationEnabled: MutableState<Boolean> = mutableStateOf(true),
  val isZoomGesturesEnabled: MutableState<Boolean> = mutableStateOf(true)
) : ComposeProps

@OptIn(MapsExperimentalFeature::class)
class GoogleStreetView(
  context: Context,
  appContext: AppContext
) : ExpoComposeView<GoogleStreetViewProps>(context, appContext) {
  override val props = GoogleStreetViewProps()

  init {
    setContent {
      key(props.position.value.coordinates.toString()) {
        StreetView(
          streetViewPanoramaOptionsFactory = {
            props.position.value.let { camera ->
              StreetViewPanoramaOptions()
                .position(camera.coordinates.toLatLng())
                .panoramaCamera(StreetViewPanoramaCamera(camera.zoom, camera.tilt, camera.bearing))
            }
          },
          isPanningGesturesEnabled = props.isPanningGesturesEnabled.value,
          isStreetNamesEnabled = props.isStreetNamesEnabled.value,
          isUserNavigationEnabled = props.isUserNavigationEnabled.value,
          isZoomGesturesEnabled = props.isZoomGesturesEnabled.value
        )
      }
    }
  }
}
