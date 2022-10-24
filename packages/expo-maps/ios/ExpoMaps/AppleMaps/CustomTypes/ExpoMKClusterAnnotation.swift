import MapKit

open class ExpoMKClusterAnnotation: MKClusterAnnotation {
  var id: String?

  var minimumClusterSize: Int = 4

  var alpha: Double = 1
}

class ExpoMKClusterColorAnnotation: ExpoMKClusterAnnotation {
  var color: Double = 0
}

class ExpoMKClusterImageAnnotation: ExpoMKClusterAnnotation {
  var icon: String = ""
}
