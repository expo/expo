import MapKit

class ExpoMKPolygon: MKPolygon {
  var fillColor: UIColor = UIColor.blue.withAlphaComponent(0.25)
  var strokeColor: UIColor = UIColor.blue
  var strokeWidth: Float = 0.0001
  var strokePattern: [NSNumber]?
  var jointType: CGLineJoin = CGLineJoin.miter
}
