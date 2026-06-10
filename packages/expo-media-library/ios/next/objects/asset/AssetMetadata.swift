import ExpoModulesCore

struct AssetMetadata: Record {
  @Field var id: String
  @Field var creationTime: Int?
  @Field var duration: Int?
  @Field var filename: String?
  @Field var height: Int?
  @Field var width: Int?
  @Field var mediaType: MediaTypeNext = .UNKNOWN
  @Field var modificationTime: Int?
  @Field var isFavorite: Bool

  init () {}

  init(
    id: String,
    creationTime: Int? = nil,
    duration: Int? = nil,
    filename: String?,
    height: Int?,
    width: Int?,
    mediaType: MediaTypeNext,
    modificationTime: Int? = nil,
    isFavorite: Bool
  ) {
    self.id = id
    self.creationTime = creationTime
    self.duration = duration
    self.filename = filename
    self.height = height
    self.width = width
    self.mediaType = mediaType
    self.modificationTime = modificationTime
    self.isFavorite = isFavorite
  }
}
