package expo.modules.maps.googleMaps

import com.google.android.gms.maps.CameraUpdate
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.LatLngBounds
import expo.modules.kotlin.Promise
import expo.modules.maps.records.CameraMoveRecord
import expo.modules.maps.records.CameraPositionRecord

class GoogleMapsCameraAnimations(private val googleMap: GoogleMap) {
  fun moveCamera(cameraMove: CameraMoveRecord, promise: Promise?) {
    val cameraPositionBuilder = CameraPosition.Builder()
    var boundsUpdate: CameraUpdate? = null
    val target = LatLng(
      if (cameraMove.target?.latitude != null) cameraMove.target!!.latitude else googleMap.cameraPosition.target.latitude,
      if (cameraMove.target?.longitude != null) cameraMove.target!!.longitude else googleMap.cameraPosition.target.longitude
    )

    if (cameraMove.latLngDelta != null) {
      val x1 = target.latitude - cameraMove.latLngDelta!!.latitudeDelta / 2
      val y1 = target.longitude - cameraMove.latLngDelta!!.longitudeDelta / 2
      val bottomLeft = LatLng(x1, y1)
      val topRight = LatLng(
        x1 + cameraMove.latLngDelta!!.latitudeDelta,
        y1 + cameraMove.latLngDelta!!.longitudeDelta
      )
      boundsUpdate = CameraUpdateFactory.newLatLngBounds(LatLngBounds(bottomLeft, topRight), 0)
    }

    cameraPositionBuilder.target(target)

    if (cameraMove.zoom != null) {
      cameraPositionBuilder.zoom(cameraMove.zoom!!)
    }
    if (cameraMove.bearing != null) {
      cameraPositionBuilder.bearing(cameraMove.bearing!!)
    }
    if (cameraMove.tilt != null) {
      cameraPositionBuilder.tilt(cameraMove.tilt!!)
    }
    val cameraPosition = cameraPositionBuilder.build()

    val resolvePromise = object : GoogleMap.CancelableCallback {
      override fun onCancel() {
        promise?.resolve(CameraPositionRecord(googleMap.cameraPosition))
      }

      override fun onFinish() {
        promise?.resolve(CameraPositionRecord(googleMap.cameraPosition))
      }
    }
    if (cameraMove.animate) {
      if (boundsUpdate == null) {
        googleMap.animateCamera(
          CameraUpdateFactory.newCameraPosition(cameraPosition),
          cameraMove.duration,
          resolvePromise
        )
      } else {
        googleMap.animateCamera(
          boundsUpdate,
          cameraMove.duration,
          resolvePromise
        )
      }
    } else {
      if (boundsUpdate == null) {
        googleMap.moveCamera(CameraUpdateFactory.newCameraPosition(cameraPosition))
      } else {
        googleMap.moveCamera(boundsUpdate)
      }
      promise?.resolve(CameraPositionRecord(googleMap.cameraPosition))
    }
  }
}
