import ExpoModulesCore
import SwiftUI

struct Coordinate: Record {
  @Field var latitude: Double = 0
  @Field var longitude: Double = 0
}

struct MapMarker: Identifiable, Record {
  @Field var id: String = UUID().uuidString
  @Field var coordinates: Coordinate
  @Field var title: String = ""
}

struct CameraPosition: Record {
  @Field var coordinates: Coordinate
  @Field var zoom: Double = 1
}

struct MapAnnotation: Record, Identifiable {
  @Field var id: String = UUID().uuidString
  @Field var coordinates: Coordinate
  @Field var title: String = ""
  @Field var backgroundColor: Color = .white
  @Field var textColor: Color = .black
  @Field var text: String = ""
}
