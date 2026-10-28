package expo.modules.location.next.geocoding

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.location.next.Coordinates

@OptimizedRecord
class Address(
  @Field val coordinates: Coordinates,
  @Field val name: String?,
  @Field val formattedAddress: String?,
  @Field val city: String?,
  @Field val country: String?,
  @Field val isoCountryCode: String?
) : Record

class GeocodeOptions(
  @Field val locale: String? = null
) : Record

class ReverseGeocodeOptions(
  @Field val locale: String? = null
) : Record
