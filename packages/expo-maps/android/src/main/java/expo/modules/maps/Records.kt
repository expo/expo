@file:OptIn(EitherType::class)

package expo.modules.maps

import android.graphics.Bitmap
import android.graphics.drawable.Drawable
import android.location.Location
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.ComposeMapColorScheme
import com.google.maps.android.compose.MapProperties
import com.google.maps.android.compose.MapType
import com.google.maps.android.compose.MapUiSettings
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.sharedobjects.SharedRef
import expo.modules.kotlin.types.Either
import expo.modules.kotlin.types.Enumerable

data class SetCameraPositionConfig(
  @Field
  val coordinates: Coordinates?,

  @Field
  val zoom: Float?,

  @Field
  val duration: Int?
) : Record

data class Coordinates(
  @Field
  val latitude: Double = 0.0,

  @Field
  val longitude: Double = 0.0
) : Record {
  fun toLatLng(): LatLng {
    return LatLng(latitude, longitude)
  }
  fun toLocation() = Location("CustomLocation").apply {
    latitude = this@Coordinates.latitude
    longitude = this@Coordinates.longitude
  }
}

data class MarkerRecord(
  @Field
  val coordinates: Coordinates = Coordinates(),

  @Field
  val title: String = "",

  @Field
  val snippet: String = "",

  @Field
  val draggable: Boolean = false,

  @Field
  val icon: Either<SharedRef<Drawable>, SharedRef<Bitmap>>? = null,

  @Field
  val showCallout: Boolean = true
) : Record

data class CameraPositionRecord(
  @Field
  val coordinates: Coordinates = Coordinates(),

  @Field
  val zoom: Float = 10f
) : Record

data class UserLocationRecord(
  @Field
  val coordinates: Coordinates? = null,

  @Field
  val followUserLocation: Boolean = false
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
  // TODO(@lukmccall): supports these properties
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

data class POIRecord(
  @Field
  val name: String,

  @Field
  val coordinates: Coordinates
) : Record

enum class MapColorSchemeEnum : Enumerable {
  LIGHT,
  DARK,
  FOLLOW_SYSTEM;

  fun toComposeMapColorScheme(): ComposeMapColorScheme {
    return when (this) {
      LIGHT -> ComposeMapColorScheme.LIGHT
      DARK -> ComposeMapColorScheme.DARK
      FOLLOW_SYSTEM -> ComposeMapColorScheme.FOLLOW_SYSTEM
    }
  }
}

data class CameraMoveEvent(
  @Field
  val coordinates: Coordinates,

  @Field
  val zoom: Float,

  @Field
  val tilt: Float,

  @Field
  val bearing: Float
) : Record
