package expo.modules.location.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.location.LocationModule.Companion.ACCURACY_BALANCED
import java.io.Serializable

import expo.modules.kotlin.types.Enumerable

enum class GeofencingRegionState : Enumerable {
  UNKNOWN,
  INSIDE,
  OUTSIDE
}

internal class LocationLastKnownOptions(
  @Field var maxAge: Double? = null,
  @Field var requiredAccuracy: Double? = null
) : Record, Serializable

internal open class LocationOptions(
  @Field var accuracy: Int = ACCURACY_BALANCED,
  @Field var distanceInterval: Int? = null,
  @Field var mayShowUserSettingsDialog: Boolean = true,
  @Field var timeInterval: Long? = null
) : Record, Serializable {
  constructor(map: Map<String, Any?>) : this(
    accuracy = map["accuracy"] as? Int ?: ACCURACY_BALANCED,
    distanceInterval = map["distanceInterval"] as? Int?,
    mayShowUserSettingsDialog = map["mayShowUserSettingsDialog"] as? Boolean? ?: true,
    timeInterval = map["timeInterval"] as? Long
  )
}

internal class ReverseGeocodeLocation(
  @Field var latitude: Double,
  @Field var longitude: Double,
  @Field var accuracy: Float? = null,
  @Field var altitude: Double? = null
) : Record, Serializable

internal class LocationTaskOptions(
  @Field var deferredUpdatesDistance: Float? = 0f,
  @Field var deferredUpdatesInterval: Float? = 0f,
  @Field var deferredUpdatesTimeout: Float? = null,
  @Field var foregroundService: LocationTaskServiceOptions? = null
) : LocationOptions() {
  internal fun toMutableMap() = mutableMapOf(
    "accuracy" to accuracy,
    "distanceInterval" to distanceInterval,
    "mayShowUserSettingsDialog" to mayShowUserSettingsDialog,
    "timeInterval" to timeInterval,
    "deferredUpdatesDistance" to deferredUpdatesDistance,
    "deferredUpdatesInterval" to deferredUpdatesInterval,
    "deferredUpdatesTimeout" to deferredUpdatesTimeout,
    "foregroundService" to (foregroundService?.toMutableMap() ?: mutableMapOf())
  )
}

internal class LocationTaskServiceOptions(
  @Field var notificationTitle: String? = null,
  @Field var notificationBody: String? = null,
  @Field var killServiceOnDestroy: Boolean? = null,
  @Field var notificationColor: String? = null
) : Record, Serializable {

  internal fun toMutableMap() = mutableMapOf(
    "notificationTitle" to notificationTitle,
    "notificationBody" to notificationBody,
    "killServiceOnDestroy" to killServiceOnDestroy,
    "notificationColor" to notificationColor
  )
}

internal class GeofencingOptions(
  @Field var regions: List<Region>
) : Record, Serializable {
  internal fun toMap(): Map<String, Any?> = mapOf(
    "regions" to regions.map { it.toMap() }
  )
}

internal class Region(
  @Field var identifier: String? = null,
  @Field var latitude: Double = .0,
  @Field var longitude: Double = .0,
  @Field var notifyOnEnter: Boolean? = true,
  @Field var notifyOnExit: Boolean? = true,
  @Field var radius: Double? = .0,
  @Field var state: GeofencingRegionState = GeofencingRegionState.UNKNOWN
) : Record, Serializable {
  internal fun toMap() = mapOf<String, Any?>(
    "identifier" to identifier,
    "latitude" to latitude,
    "longitude" to longitude,
    "notifyOnEnter" to notifyOnEnter,
    "notifyOnExit" to notifyOnExit,
    "radius" to radius,
    "state" to state
  )
}
