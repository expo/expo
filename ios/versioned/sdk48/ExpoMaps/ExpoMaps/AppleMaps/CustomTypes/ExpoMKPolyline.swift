import MapKit

class ExpoMKPolyline: MKPolyline {
  var color: UIColor = UIColor.blue
  var width: Float = 1.0
  var pattern: [NSNumber]?
  var jointType: CGLineJoin = CGLineJoin.miter
  var capType: CGLineCap = CGLineCap.round
}
