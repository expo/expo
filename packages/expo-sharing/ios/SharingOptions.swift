import ExpoModulesCore

internal struct SharingOptions: Record {
  @Field var mimeType: String?
  @Field var UTI: String?
  @Field var dialogTitle: String?
  @Field var anchor: Rect?

  public struct Rect: Record {
    @Field var x: Double?
    @Field var y: Double?
    @Field var width: Double?
    @Field var height: Double?
  }
}
