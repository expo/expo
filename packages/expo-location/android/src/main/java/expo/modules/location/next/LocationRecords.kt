package expo.modules.location.next

import android.location.Location
import android.os.Build
import android.os.Bundle
import android.os.PersistableBundle
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.location.next.locationProviders.GetCurrentPositionOptions
import expo.modules.location.next.locationProviders.LocationPriority
import expo.modules.location.next.locationProviders.WatchPositionParameters
import kotlin.time.Duration
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

  fun watchParameters(): WatchPositionParameters {
    return when (this) {
      DEFAULT -> WatchPositionParameters(LocationPriority.BALANCED_POWER_ACCURACY, 5.seconds, Duration.ZERO)
      AUTOMOTIVE_NAVIGATION -> WatchPositionParameters(LocationPriority.HIGH_ACCURACY, 1.seconds, Duration.ZERO)
      OTHER_NAVIGATION -> WatchPositionParameters(LocationPriority.HIGH_ACCURACY, 2.seconds, Duration.ZERO)
      FITNESS -> WatchPositionParameters(LocationPriority.HIGH_ACCURACY, 2.seconds, Duration.ZERO)
      AIRBORNE -> WatchPositionParameters(LocationPriority.HIGH_ACCURACY, 1.seconds, Duration.ZERO)
      LOW_POWER -> WatchPositionParameters(LocationPriority.LOW_POWER, 60.seconds, 300.seconds)
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
class Coordinates (
  @Field val latitude: Double,
  @Field val longitude: Double,
) : Record {
  fun toPersistableBundle(): PersistableBundle {
    val bundle = PersistableBundle()
    bundle.putDouble("lat", latitude)
    bundle.putDouble("lon", longitude)
    return bundle
  }

  fun toBundle(): Bundle {
    val bundle = Bundle()
    bundle.putDouble("latitude", latitude)
    bundle.putDouble("longitude", longitude)
    return bundle
  }
}

fun PersistableBundle.toCoordinates(): Coordinates = Coordinates(
  getDouble("lat"),
  getDouble("lon"),
)

@OptimizedRecord
class Position (
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
  @Field val headingAccuracy: Double? = null,
) : Record {
  fun toPersistableBundle(): PersistableBundle {
    val bundle = PersistableBundle()
    bundle.putPersistableBundle("coordinates", coordinates.toPersistableBundle())
    bundle.putDouble("time", timestamp)
    bundle.putBoolean("mocked", mocked)
    // Optional fields are omitted rather than written as null — PersistableBundle has no null
    // primitives, and getDouble's default cannot be told apart from a stored value.
    mslAltitude?.let { bundle.putDouble("mslAltitude", it) }
    altitude?.let { bundle.putDouble("altitude", it) }
    speed?.let { bundle.putDouble("speed", it) }
    heading?.let { bundle.putDouble("heading", it) }
    horizontalAccuracy?.let { bundle.putDouble("horizontalAccuracy", it) }
    verticalAccuracy?.let { bundle.putDouble("verticalAccuracy", it) }
    speedAccuracy?.let { bundle.putDouble("speedAccuracy", it) }
    headingAccuracy?.let { bundle.putDouble("headingAccuracy", it) }
    return bundle
  }

  fun toBundle(): Bundle {
    val bundle = Bundle()
    bundle.putBundle("coordinates", coordinates.toBundle())
    bundle.putDouble("timestamp", timestamp)
    bundle.putBoolean("mocked", mocked)
    mslAltitude?.let { bundle.putDouble("mslAltitude", it) }
    altitude?.let { bundle.putDouble("altitude", it) }
    speed?.let { bundle.putDouble("speed", it) }
    heading?.let { bundle.putDouble("heading", it) }
    horizontalAccuracy?.let { bundle.putDouble("horizontalAccuracy", it) }
    verticalAccuracy?.let { bundle.putDouble("verticalAccuracy", it) }
    speedAccuracy?.let { bundle.putDouble("speedAccuracy", it) }
    headingAccuracy?.let { bundle.putDouble("headingAccuracy", it) }
    return bundle
  }
}

private fun PersistableBundle.getDoubleOrNull(key: String): Double? =
  if (containsKey(key)) getDouble(key) else null

fun PersistableBundle.toPosition(): Position = Position(
  coordinates = getPersistableBundle("coordinates")?.toCoordinates() ?: Coordinates(0.0, 0.0),
  timestamp = getDouble("time"),
  mocked = getBoolean("mocked"),
  mslAltitude = getDoubleOrNull("mslAltitude"),
  altitude = getDoubleOrNull("altitude"),
  speed = getDoubleOrNull("speed"),
  heading = getDoubleOrNull("heading"),
  horizontalAccuracy = getDoubleOrNull("horizontalAccuracy"),
  verticalAccuracy = getDoubleOrNull("verticalAccuracy"),
  speedAccuracy = getDoubleOrNull("speedAccuracy"),
  headingAccuracy = getDoubleOrNull("headingAccuracy"),
)

fun Location.mslAltitude(): Double? {
  return if (Build.VERSION.SDK_INT >= 34 && hasMslAltitude()) {
    mslAltitudeMeters
  } else null
}

fun Location.verticalAccuracy(): Double? {
  return if (Build.VERSION.SDK_INT >= 26 && hasAltitude() && hasVerticalAccuracy()) {
    verticalAccuracyMeters.toDouble()
  } else null
}

fun Location.speedAccuracy(): Double? {
  return if (Build.VERSION.SDK_INT >= 26 && hasSpeed() && hasSpeedAccuracy()) {
    speedAccuracyMetersPerSecond.toDouble()
  } else null
}

fun Location.headingAccuracy(): Double? {
  return if (Build.VERSION.SDK_INT >= 26 && hasBearing() && hasBearingAccuracy()) {
    bearingAccuracyDegrees.toDouble()
  } else null
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
    altitude = if (hasAltitude()) altitude else null,
    speed = if (hasSpeed()) speed.toDouble() else null,
    heading = if (hasBearing()) bearing.toDouble() else null,

    horizontalAccuracy = if (this.hasAccuracy()) this.accuracy.toDouble() else null,
    verticalAccuracy = verticalAccuracy(),
    speedAccuracy = speedAccuracy(),
    headingAccuracy = headingAccuracy(),
  )
}
