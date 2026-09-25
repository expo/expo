import ExpoModulesCore

internal struct SharingOptions: Record {
  @Field var mimeType: String?
  @Field var UTI: String?
  @Field var dialogTitle: String?
  @Field var anchor: Rect?
  @Field var preview: Preview?

  public struct Rect: Record {
    @Field var x: Double?
    @Field var y: Double?
    @Field var width: Double?
    @Field var height: Double?
  }

  public struct Preview: Record {
    @Field var title: String = ""
  }
}
