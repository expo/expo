package expo.modules.maps.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class CameraMoveRecord : Record {
  @Field
  var target: LatLngRecord? = null

  @Field
  var zoom: Float? = null

  @Field
  var bearing: Float? = null

  @Field
  var tilt: Float? = null

  @Field
  var latLngDelta: LatLngDeltaRecord? = null

  @Field
  var animate: Boolean = true

  @Field
  var duration: Int = 1000
}
