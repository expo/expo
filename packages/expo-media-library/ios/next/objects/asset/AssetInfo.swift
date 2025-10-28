import ExpoModulesCore

struct AssetInfo: Record {
  @Field var id: String
  @Field var creationTime: Int?
  @Field var duration: Int?
  @Field var uri: String
  @Field var filename: String
  @Field var height: Int
  @Field var width: Int
  @Field var mediaType: MediaTypeNext = .UNKNOWN
  @Field var modificationTime: Int?

  init () {}

  init(
    id: String,
    creationTime: Int? = nil,
    duration: Int? = nil,
    uri: String,
    filename: String,
    height: Int,
    width: Int,
    mediaType: MediaTypeNext,
    modificationTime: Int? = nil
  ) {
    self.id = id
    self.creationTime = creationTime
    self.duration = duration
    self.uri = uri
    self.filename = filename
    self.height = height
    self.width = width
    self.mediaType = mediaType
    self.modificationTime = modificationTime
  }
}
