package expo.modules.maps.records

import com.google.android.gms.maps.model.Marker
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.maps.MarkerObject

class MarkerRecord() : Record {

  @Field
  lateinit var id: String

  @Field
  lateinit var position: LatLngRecord

  constructor(marker: Marker) : this() {
    this.id = marker.id
    this.position = LatLngRecord(marker.position)
  }

  constructor(markerObject: MarkerObject) : this() {
    this.id = markerObject.id.toString()
    this.position = LatLngRecord(markerObject.position)
  }
}
