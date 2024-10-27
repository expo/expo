import ExpoModulesCore

struct Alarm: Record {
  @Field
  var absoluteDate: String?
  @Field
  var relativeOffset: Int?
  @Field
  var structuredLocation: AlarmLocation?
  @Field
  var method: String?
}

struct AlarmLocation: Record {
  @Field
  var title: String
  @Field
  var proximity: String?
  @Field
  var radius: Double?
  @Field
  var coords: Coordinates?
}

struct Coordinates: Record {
  @Field
  var latitude: Double
  @Field
  var longitude: Double
}
