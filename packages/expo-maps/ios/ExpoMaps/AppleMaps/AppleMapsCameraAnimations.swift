import Foundation
import MapKit
import ExpoModulesCore

class AppleMapsCameraAnimations {
  private let mapView: MKMapView

  init(mapView: MKMapView) {
    self.mapView = mapView
  }

  func moveCamera(cameraMove: CameraMoveRecord, promise: Promise?) {
    let newCamera = MKMapCamera()
    var mapRect: MKMapRect?
    let target = CLLocationCoordinate2D(
      latitude: cameraMove.target["latitude"] as? CLLocationDegrees ?? mapView.camera.centerCoordinate.latitude,
      longitude: cameraMove.target["longitude"] as? CLLocationDegrees ?? mapView.camera.centerCoordinate.longitude
    )

    newCamera.centerCoordinate = target
    newCamera.heading = cameraMove.bearing ?? mapView.camera.heading
    newCamera.pitch = cameraMove.tilt ?? mapView.camera.pitch

    if let zoom = cameraMove.zoom {
      let distance = AppleMapsView.googleMapsZoomLevelToMeters(latitude: newCamera.centerCoordinate.latitude, zoom: Double(zoom))
      newCamera.centerCoordinateDistance = distance
    } else {
      newCamera.centerCoordinateDistance = mapView.camera.centerCoordinateDistance
    }

    if let delta = cameraMove.latLngDelta {
      let latitudeDelta = delta.latitudeDelta
      let longitudeDelta = delta.longitudeDelta
      let x1 = target.latitude - latitudeDelta / 2
      let y1 = target.longitude - longitudeDelta / 2
      let topLeft = MKMapPoint(CLLocationCoordinate2D(latitude: x1 + latitudeDelta, longitude: y1))
      let bottomRight = MKMapPoint(CLLocationCoordinate2D(latitude: x1, longitude: y1 + longitudeDelta))
      mapRect = MKMapRect(x: topLeft.x, y: topLeft.y, width: bottomRight.x - topLeft.x, height: bottomRight.y - topLeft.y)
    }

    if cameraMove.animate {
      UIView.animate(withDuration: Double(cameraMove.duration) / 1000, animations: { () in
        if let mapRect = mapRect {
          self.mapView.setVisibleMapRect(mapRect, animated: true)
        } else {
          self.mapView.setCamera(newCamera, animated: true)
        }
      }, completion: { [self] _ in
        promise?.resolve(CameraPositionRecord(camera: mapView.camera, coordinateSpan: mapView.region.span).toDictionary())
      })
    } else {
      if let mapRect = mapRect {
        mapView.setVisibleMapRect(mapRect, animated: false)
      } else {
        mapView.setCamera(newCamera, animated: false)
      }
      promise?.resolve(CameraPositionRecord(camera: mapView.camera, coordinateSpan: mapView.region.span).toDictionary())
    }
  }
}
