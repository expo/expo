import ExpoModulesCore

struct AlbumMetadata: Record {
  @Field var id: String
  @Field var title: String
  @Field var type: AlbumType?

  init() {}

  init(id: String, title: String, type: AlbumType?) {
    self.id = id
    self.title = title
    self.type = type
  }
}
