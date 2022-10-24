import ExpoModulesCore

enum MapType: String, EnumArgument {
  case normal
  case hybrid
  case satellite
  case terrain
}

//TODO: unify with google maps
enum POICategoryType: String, EnumArgument {
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
  @Field var id: String? = nil
  @Field var latitude: Double = 0
  @Field var longitude: Double = 0
  @Field var markerTitle: String? = nil
  @Field var markerSnippet: String? = nil
  @Field var icon: String? = nil
  @Field var color: UIColor? = nil
  @Field var draggable: Bool = false
  @Field var anchorU: Double? = nil
  @Field var anchorV: Double? = nil
  @Field var opacity: Double = 1
}

struct Point: Record {
  @Field var latitude: Double = 0
  @Field var longitude: Double = 0
}

struct PointWithData: Record {
  @Field var latitude: Double = 0
  @Field var longitude: Double = 0
  @Field var data: Float? = nil
}

struct PolygonObject: Record {
  @Field var points: [Point] = []
  @Field var fillColor: UIColor? = nil
  @Field var strokeColor: UIColor? = nil
  @Field var strokeWidth: Float? = nil
  @Field var strokePattern: [PatternItem]? = nil
  @Field var jointType: Joint? = nil
}

struct PolylineObject: Record {
  @Field var points: [Point] = []
  @Field var color: UIColor? = nil
  @Field var width: Float? = nil
  @Field var pattern: [PatternItem]? = nil
  @Field var jointType: Joint? = nil
  @Field var capType: Cap? = nil
}

struct PatternItem: Record {
  @Field var type: PatternType = .stroke
  @Field var length: Float = 1.0
}

enum PatternType: String, EnumArgument {
  case stroke
  case gap
}

enum Joint: String, EnumArgument {
  case miter
  case round
  case bevel
}

enum Cap: String, EnumArgument {
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
  @Field var id: String? = nil
  @Field var name: String = "default_cluster"
  @Field var minimumClusterSize: Int = 2
  @Field var markerTitle: String? = nil
  @Field var markerSnippet: String? = nil
  @Field var icon: String? = nil
  @Field var color: UIColor? = nil
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
  @Field var gradient: Gradient? = nil
  @Field var radius: UInt? = nil
  @Field var opacity: Float? = nil
}
