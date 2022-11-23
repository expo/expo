package expo.modules.maps.records

import com.google.android.gms.maps.model.LatLng
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class LatLngRecord(latLng: LatLng) : Record {
  @Field
  var longitude: Double = latLng.longitude

  @Field
  var latitude: Double = latLng.latitude
}
