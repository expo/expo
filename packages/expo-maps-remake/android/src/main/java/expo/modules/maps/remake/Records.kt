package expo.modules.maps.remake

import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.MapProperties
import com.google.maps.android.compose.MapType
import com.google.maps.android.compose.MapUiSettings
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable

data class Coordinates(
  @Field
  val latitude: Double = 0.0,

  @Field
  val longitude: Double = 0.0
) : Record {
  fun toLatLng(): LatLng {
    return LatLng(latitude, longitude)
  }
}

data class Marker(
  @Field
  val coordinates: Coordinates = Coordinates(),

  @Field
  val title: String = "",

  @Field
  val snippet: String = "",

  @Field
  val draggable: Boolean = false
) : Record


data class CameraPositionRecord(
  @Field
  val coordinates: Coordinates = Coordinates(),

  @Field
  val zoom: Float = 10f
) : Record

data class MapUiSettingsRecord(
  @Field
  val compassEnabled: Boolean = true,
  @Field
  val indoorLevelPickerEnabled: Boolean = true,
  @Field
  val mapToolbarEnabled: Boolean = true,
  @Field
  val myLocationButtonEnabled: Boolean = true,
  @Field
  val rotationGesturesEnabled: Boolean = true,
  @Field
  val scrollGesturesEnabled: Boolean = true,
  @Field
  val scrollGesturesEnabledDuringRotateOrZoom: Boolean = true,
  @Field
  val tiltGesturesEnabled: Boolean = true,
  @Field
  val zoomControlsEnabled: Boolean = true,
  @Field
  val zoomGesturesEnabled: Boolean = true
) : Record {
  fun toMapUiSettings(): MapUiSettings {
    return MapUiSettings(
      compassEnabled = compassEnabled,
      indoorLevelPickerEnabled = indoorLevelPickerEnabled,
      mapToolbarEnabled = mapToolbarEnabled,
      myLocationButtonEnabled = myLocationButtonEnabled,
      rotationGesturesEnabled = rotationGesturesEnabled,
      scrollGesturesEnabled = scrollGesturesEnabled,
      scrollGesturesEnabledDuringRotateOrZoom = scrollGesturesEnabledDuringRotateOrZoom,
      tiltGesturesEnabled = tiltGesturesEnabled,
      zoomControlsEnabled = zoomControlsEnabled,
      zoomGesturesEnabled = zoomGesturesEnabled
    )
  }
}

enum class MapTypeEnum : Enumerable {
  HYBRID,
  NORMAL,
  SATELLITE,
  TERRAIN;

  fun toMapType(): MapType {
    return when (this) {
      HYBRID -> MapType.HYBRID
      NORMAL -> MapType.NORMAL
      SATELLITE -> MapType.SATELLITE
      TERRAIN -> MapType.TERRAIN
    }
  }
}

data class MapPropertiesRecord(
  @Field
  val isBuildingEnabled: Boolean = false,
  @Field
  val isIndoorEnabled: Boolean = false,
  @Field
  val isMyLocationEnabled: Boolean = false,
  @Field
  val isTrafficEnabled: Boolean = false,
//  val latLngBoundsForCameraTarget: LatLngBounds? = null,
//  val mapStyleOptions: MapStyleOptions? = null,
  @Field
  val mapType: MapTypeEnum = MapTypeEnum.NORMAL,
  @Field
  val maxZoomPreference: Float = 21.0f,
  @Field
  val minZoomPreference: Float = 3.0f
) : Record {
  fun toMapProperties(): MapProperties {
    return MapProperties(
      isBuildingEnabled = isBuildingEnabled,
      isIndoorEnabled = isIndoorEnabled,
      isMyLocationEnabled = isMyLocationEnabled,
      isTrafficEnabled = isTrafficEnabled,
      mapType = mapType.toMapType(),
      maxZoomPreference = maxZoomPreference,
      minZoomPreference = minZoomPreference
    )
  }
}
