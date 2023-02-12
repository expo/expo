package expo.modules.maps.records

import com.google.android.gms.maps.model.LatLng
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class LatLngDeltaRecord(latLng: LatLng) : Record {
  @Field
  var longitudeDelta: Double = 0.0

  @Field
  var latitudeDelta: Double = 0.0
}
