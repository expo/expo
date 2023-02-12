package expo.modules.maps.records

import com.google.android.gms.maps.model.CameraPosition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class CameraPositionRecord(cameraPosition: CameraPosition) : Record {
  @Field
  var target: LatLngRecord = LatLngRecord(cameraPosition.target)

  @Field
  var zoom: Float = cameraPosition.zoom

  @Field
  var bearing: Float = cameraPosition.bearing

  @Field
  var tilt: Float = cameraPosition.tilt
}
