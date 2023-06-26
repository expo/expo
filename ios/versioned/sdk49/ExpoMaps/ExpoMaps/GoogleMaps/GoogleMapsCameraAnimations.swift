import Foundation
import ABI49_0_0ExpoModulesCore
import GoogleMaps

class GoogleMapsCameraAnimations {
  private let mapView: GMSMapView

  init(mapView: GMSMapView) {
    self.mapView = mapView
  }

  func moveCamera(cameraMove: CameraMoveRecord, promise: Promise?) {
    var boundsUpdate: GMSCameraUpdate?
    let target = CLLocationCoordinate2D(
      latitude: cameraMove.target["latitude"] as? CLLocationDegrees ?? mapView.camera.target.latitude,
      longitude: cameraMove.target["longitude"] as? CLLocationDegrees ?? mapView.camera.target.longitude
    )

    if let delta = cameraMove.latLngDelta {
      let latitudeDelta = delta.latitudeDelta
      let longitudeDelta = delta.longitudeDelta
      let x1 = target.latitude - latitudeDelta / 2
      let y1 = target.longitude - longitudeDelta / 2
      let topLeft = CLLocationCoordinate2D(latitude: x1 + latitudeDelta, longitude: y1)
      let bottomRight = CLLocationCoordinate2D(latitude: x1, longitude: y1 + longitudeDelta)
      boundsUpdate = GMSCameraUpdate.fit(GMSCoordinateBounds(coordinate: topLeft, coordinate: bottomRight))
    }

    if cameraMove.animate {
      CATransaction.begin()
      CATransaction.setCompletionBlock {
        /*
         Calculating the projection while next animation is starting sometimes causes the map view to flicker,
          the projection isn't accessed in order to avoid this
        */
        promise?.resolve(CameraPositionRecord(cameraPosition: self.mapView.camera, visibleRegion: nil).toDictionary())
      }
      CATransaction.setAnimationDuration(Double(cameraMove.duration) / 1000)
      CATransaction.setAnimationTimingFunction(CAMediaTimingFunction(name: CAMediaTimingFunctionName.easeInEaseOut))

      if let tilt = cameraMove.tilt {
        mapView.animate(toViewingAngle: tilt)
      }
      if let bearing = cameraMove.bearing {
        mapView.animate(toBearing: bearing)
      }
      if let zoom = cameraMove.zoom {
        mapView.animate(toZoom: zoom)
      }
      mapView.animate(toLocation: target)

      // if bounds are set this will override all of the properties set above, except for the target
      if let boundsUpdate = boundsUpdate {
        mapView.animate(with: boundsUpdate)
      }

      CATransaction.commit()
    } else {
      if let boundsUpdate = boundsUpdate {
        mapView.moveCamera(boundsUpdate)
      } else {
        mapView.camera = GMSCameraPosition(
          latitude: target.latitude,
          longitude: target.longitude,
          zoom: cameraMove.zoom ?? mapView.camera.zoom,
          bearing: cameraMove.bearing ?? mapView.camera.bearing,
          viewingAngle: cameraMove.tilt ?? mapView.camera.viewingAngle
        )
      }
      promise?.resolve(CameraPositionRecord(cameraPosition: mapView.camera, visibleRegion: mapView.projection.visibleRegion()).toDictionary())
    }
  }
}
