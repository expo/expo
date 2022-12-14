import MapKit

class AppleMapsControls: Controls {
   private let mapView: MKMapView

   init(mapView: MKMapView) {
     self.mapView = mapView
   }

   func setShowCompass(enable: Bool) {
     mapView.showsCompass = enable
   }

   func setShowMyLocationButton(enable: Bool) {
     if enable == true {
        enableMyLocationButton()
     }
   }

    func setShowLevelPicker(enable: Bool) {
      // TODO: enable floor picker
    }

    private func enableMyLocationButton() {
      mapView.showsUserLocation = true
      let myLocationButton = MKUserTrackingButton(mapView: mapView)
      myLocationButton.layer.backgroundColor = UIColor(white: 1, alpha: 0.5).cgColor
      myLocationButton.layer.borderColor = UIColor.white.cgColor
      myLocationButton.layer.borderWidth = 1
      myLocationButton.layer.cornerRadius = 5
      myLocationButton.translatesAutoresizingMaskIntoConstraints = false
      mapView.addSubview(myLocationButton)

      NSLayoutConstraint.activate([
          myLocationButton.topAnchor.constraint(
            equalTo: mapView.topAnchor,
            constant: 100
          ),
          myLocationButton.trailingAnchor.constraint(
            equalTo: mapView.trailingAnchor,
            constant: -10
          )
      ])
    }
 }
