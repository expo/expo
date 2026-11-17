package expo.modules.location.next.geofencing

import com.google.android.gms.location.Geofence
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
class GeofencingRegion(
  @Field val identifier: String,
  @Field val latitude: Double,
  @Field val longitude: Double,
  @Field val radius: Double
) : Record {
  fun isValid(): Boolean = identifier.isNotEmpty() &&
    latitude in -90.0..90.0 &&
    longitude in -180.0..180.0 &&
    radius > 0 &&
    radius.isFinite()

  fun toMap(): Map<String, Any> = mapOf(
    "identifier" to identifier,
    "latitude" to latitude,
    "longitude" to longitude,
    "radius" to radius
  )

  fun toGeofence(): Geofence = Geofence.Builder()
    .setRequestId(identifier)
    .setCircularRegion(latitude, longitude, radius.toFloat())
    .setExpirationDuration(Geofence.NEVER_EXPIRE)
    .setTransitionTypes(Geofence.GEOFENCE_TRANSITION_ENTER or Geofence.GEOFENCE_TRANSITION_EXIT)
    .build()
}

private fun Map<*, *>.toGeofencingRegion(): GeofencingRegion? {
  val identifier = this["identifier"] as? String ?: return null
  val latitude = (this["latitude"] as? Number)?.toDouble() ?: return null
  val longitude = (this["longitude"] as? Number)?.toDouble() ?: return null
  val radius = (this["radius"] as? Number)?.toDouble() ?: return null
  return GeofencingRegion(identifier, latitude, longitude, radius)
}

fun List<GeofencingRegion>.toTaskOptions(): Map<String, Any> = if (isEmpty()) {
  emptyMap()
} else {
  mapOf("regions" to map { it.toMap() })
}

fun Map<String, Any?>?.toGeofencingRegions(): List<GeofencingRegion> {
  val rawRegions = this?.get("regions") as? List<*> ?: emptyList<Any>()
  return rawRegions.mapNotNull { (it as? Map<*, *>)?.toGeofencingRegion() }
}
