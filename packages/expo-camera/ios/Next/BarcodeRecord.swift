import ExpoModulesCore

struct BarcodeSettings: Record {
  @Field var interval: Double?
  @Field var barCodeTypes: [String]

  func toMetadataObjectType() -> [AVMetadataObject.ObjectType] {
    barCodeTypes.map {
      AVMetadataObject.ObjectType(rawValue: $0)
    }
  }
}
