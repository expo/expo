import ExpoModulesCore

enum MapType: String, Enumerable {
  case normal
  case hybrid
  case satellite
  case terrain
}

// TODO: unify with google maps
enum POICategoryType: String, Enumerable {
  case airport
  case atm
  case bank
  case beach
  case cafe
  case hospital
  case hotel
  case museum
  case pharmacy
  case store
  case zoo
}

struct MarkerObject: Record {
  @Field var id: String?
  @Field var latitude: Double = 0
  @Field var longitude: Double = 0
  @Field var markerTitle: String?
  @Field var markerSnippet: String?
  @Field var icon: String?
  @Field var color: UIColor?
  @Field var draggable: Bool = false
  @Field var anchorU: Double?
  @Field var anchorV: Double?
  @Field var opacity: Double = 1
}

struct Point: Record {
  @Field var latitude: Double = 0
  @Field var longitude: Double = 0
}

struct PointWithData: Record {
  @Field var latitude: Double = 0
  @Field var longitude: Double = 0
  @Field var data: Float?
}

struct PolygonObject: Record {
  @Field var points: [Point] = []
  @Field var fillColor: UIColor?
  @Field var strokeColor: UIColor?
  @Field var strokeWidth: Float?
  @Field var strokePattern: [PatternItem]?
  @Field var jointType: Joint?
}

struct PolylineObject: Record {
  @Field var points: [Point] = []
  @Field var color: UIColor?
  @Field var width: Float?
  @Field var pattern: [PatternItem]?
  @Field var jointType: Joint?
  @Field var capType: Cap?
}

struct PatternItem: Record {
  @Field var type: PatternType = .stroke
  @Field var length: Float = 1.0
}

enum PatternType: String, Enumerable {
  case stroke
  case gap
}

enum Joint: String, Enumerable {
  case miter
  case round
  case bevel
}

enum Cap: String, Enumerable {
  case butt
  case round
  case square
}

struct CircleObject: Record {
  @Field var center: Point = Point()
  @Field var radius: Double = 0
  @Field var strokeColor: UIColor?
  @Field var fillColor: UIColor?
  @Field var strokeWidth: Float?
}

struct ClusterObject: Record {
  @Field var id: String?
  @Field var name: String = "default_cluster"
  @Field var minimumClusterSize: Int = 2
  @Field var markerTitle: String?
  @Field var markerSnippet: String?
  @Field var icon: String?
  @Field var color: UIColor?
  @Field var opacity: Double = 1
  @Field var markers: [MarkerObject] = []
}

struct KMLObject: Record {
  @Field var filePath: String
}

struct GeoJsonObject: Record {
  @Field var geoJsonString: String
  @Field var defaultStyle: GeoJsonObjectDefaultStyle?
}

struct GeoJsonObjectDefaultStyle: Record {
  @Field var marker: GeoJsonObjectDefaultStyleMarker?
  @Field var polygon: GeoJsonObjectDefaultStylePolygon?
  @Field var polyline: GeoJsonObjectDefaultStylePolyline?
}

struct GeoJsonObjectDefaultStylePolygon: Record {
  @Field var fillColor: UIColor?
  @Field var strokeColor: UIColor?
  @Field var strokeWidth: Float?
  @Field var strokeJointType: Joint?
  @Field var strokePattern: [PatternItem]?
}

struct GeoJsonObjectDefaultStylePolyline: Record {
  @Field var color: UIColor?
  @Field var width: Double?
  @Field var pattern: [PatternItem]?
}

struct GeoJsonObjectDefaultStyleMarker: Record {
  @Field var color: UIColor?
  @Field var title: String?
  @Field var snippet: String?
}

struct OverlayObject: Record {
  @Field var bounds: Bounds = Bounds()
  @Field var icon: String = ""
}

struct Bounds: Record {
  @Field var southWest: Point = Point()
  @Field var northEast: Point = Point()
}

struct Gradient: Record {
  @Field var colors: [UIColor] = []
  @Field var locations: [Double] = []
}

struct HeatmapObject: Record {
  @Field var points: [PointWithData] = []
  @Field var gradient: Gradient?
  @Field var radius: UInt?
  @Field var opacity: Float?
}
