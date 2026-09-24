package expo.modules.location.next

import android.location.Location
import android.os.Build
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.location.next.locationProviders.GetCurrentPositionOptions
import expo.modules.location.next.locationProviders.LocationPriority
import kotlin.time.Duration.Companion.seconds

enum class LocationPermissionStatus(val value: String) : Enumerable {
  GRANTED("granted"),
  DENIED("denied"),
  UNDETERMINED("undetermined");

  companion object {
    fun fromString(status: String?): LocationPermissionStatus = when (status) {
      "granted" -> GRANTED
      "denied" -> DENIED
      else -> UNDETERMINED
    }
  }
}

enum class LocationScope(val value: String) : Enumerable {
  ALWAYS("always"),
  WHEN_IN_USE("whenInUse"),
  NOT_GRANTED("notGranted")
}

enum class LocationAccuracy(val value: String) : Enumerable {
  FULL("full"),
  REDUCED("reduced"),
  NOT_GRANTED("notGranted")
}

enum class LocationAccuracyOption(val value: String) : Enumerable {
  FULL("full"),
  REDUCED("reduced")
}

class RequestForegroundPermissionsOptions(
  @Field val accuracy: LocationAccuracyOption? = null
) : Record

class LocationPermissionResponse(
  @Field val status: LocationPermissionStatus,
  @Field val granted: Boolean,
  @Field val canAskAgain: Boolean,
  @Field val scope: LocationScope,
  @Field val accuracy: LocationAccuracy,
  @Field val expires: String = "never"
) : Record

enum class LocationProfile(val value: String) : Enumerable {
  DEFAULT("default"),
  AUTOMOTIVE_NAVIGATION("automotiveNavigation"),
  OTHER_NAVIGATION("otherNavigation"),
  FITNESS("fitness"),
  AIRBORNE("airborne"),
  LOW_POWER("lowPower");

  fun priority(): LocationPriority {
    return when (this) {
      DEFAULT -> LocationPriority.BALANCED_POWER_ACCURACY
      AUTOMOTIVE_NAVIGATION -> LocationPriority.HIGH_ACCURACY
      OTHER_NAVIGATION -> LocationPriority.HIGH_ACCURACY
      FITNESS -> LocationPriority.HIGH_ACCURACY
      AIRBORNE -> LocationPriority.HIGH_ACCURACY
      LOW_POWER -> LocationPriority.LOW_POWER
    }
  }
}

class GetPositionOptions(
  @Field val maxCachedAge: Double? = null,
  @Field val timeout: Double? = null,
  @Field val profile: LocationProfile = LocationProfile.DEFAULT
) : Record {
  fun toProviderOptions(): GetCurrentPositionOptions = GetCurrentPositionOptions(
    maxCachedAge = (maxCachedAge ?: 0.0).seconds,
    timeout = (timeout ?: 90.0).seconds,
    priority = profile.priority()
  )
}

@OptimizedRecord
class Coordinates(
  @Field val latitude: Double,
  @Field val longitude: Double
) : Record

@OptimizedRecord
class Position(
  @Field val coordinates: Coordinates,
  @Field val timestamp: Double,
  @Field val mocked: Boolean,

  @Field val mslAltitude: Double? = null,
  @Field val altitude: Double? = null,
  @Field val speed: Double? = null,
  @Field val heading: Double? = null,

  @Field val horizontalAccuracy: Double? = null,
  @Field val verticalAccuracy: Double? = null,
  @Field val speedAccuracy: Double? = null,
  @Field val headingAccuracy: Double? = null
) : Record

fun Location.mslAltitude(): Double? {
  return if (Build.VERSION.SDK_INT >= 34 && hasMslAltitude()) {
    mslAltitudeMeters
  } else {
    null
  }
}

fun Location.verticalAccuracy(): Double? {
  return if (Build.VERSION.SDK_INT >= 26 && hasAltitude() && hasVerticalAccuracy()) {
    verticalAccuracyMeters.toDouble()
  } else {
    null
  }
}

fun Location.speedAccuracy(): Double? {
  return if (Build.VERSION.SDK_INT >= 26 && hasSpeed() && hasSpeedAccuracy()) {
    speedAccuracyMetersPerSecond.toDouble()
  } else {
    null
  }
}

fun Location.headingAccuracy(): Double? {
  return if (Build.VERSION.SDK_INT >= 26 && hasBearing() && hasBearingAccuracy()) {
    bearingAccuracyDegrees.toDouble()
  } else {
    null
  }
}

fun Location.mocked(): Boolean {
  return if (Build.VERSION.SDK_INT >= 31) {
    isMock
  } else {
    @Suppress("DEPRECATION")
    isFromMockProvider
  }
}

fun Location.toPosition(): Position {
  return Position(
    coordinates = Coordinates(
      latitude,
      longitude
    ),
    timestamp = time.toDouble(),
    mocked = mocked(),

    mslAltitude = mslAltitude(),
    altitude = if (hasAltitude()) {
      altitude
    } else {
      null
    },
    speed = if (hasSpeed()) {
      speed.toDouble()
    } else {
      null
    },
    heading = if (hasBearing()) {
      bearing.toDouble()
    } else {
      null
    },

    horizontalAccuracy = if (this.hasAccuracy()) {
      this.accuracy.toDouble()
    } else {
      null
    },
    verticalAccuracy = verticalAccuracy(),
    speedAccuracy = speedAccuracy(),
    headingAccuracy = headingAccuracy()
  )
}
