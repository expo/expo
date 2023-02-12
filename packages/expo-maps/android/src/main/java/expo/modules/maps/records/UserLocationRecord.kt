package expo.modules.maps.records

import android.location.Location
import android.os.Build
import androidx.annotation.RequiresApi
import com.google.android.gms.maps.model.LatLng
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class UserLocationRecord(location: Location) : Record {
  @Field
  var position: LatLngRecord = LatLngRecord(LatLng(location.latitude, location.longitude))

  @Field
  var altitude: Double = location.altitude

  @Field
  var accuracy: Float = location.accuracy

  @RequiresApi(Build.VERSION_CODES.O)
  @Field
  var verticalAccuracy: Float = location.verticalAccuracyMeters

  @Field
  var speed: Float = location.speed

  @RequiresApi(Build.VERSION_CODES.O)
  @Field
  var speedAccuracy = location.speedAccuracyMetersPerSecond

  @Field
  var heading: Float = location.bearing

  @Field
  var timestamp: Long = location.time
}
