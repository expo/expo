import ExpoModulesCore
import Photos

enum MediaType: String, Enumerable {
  case audio
  case photo
  case video
  case all
  case unknown

  func toPHMediaType() -> PHAssetMediaType {
    switch self {
    case .audio:
      return .audio
    case .photo:
      return .image
    case .video:
      return .video
    default:
      return .unknown
    }
  }
}

struct AlbumOptions: Record {
  @Field var includeSmartAlbums: Bool = false
}

struct AssetInfoOptions: Record {
  @Field var shouldDownloadFromNetwork: Bool = true
}

struct AssetWithOptions: Record {
  @Field var first: Int
  @Field var after: String?
  @Field var album: String?
  @Field var sortBy: [String] = []
  @Field var mediaType: [MediaType]
  @Field var createdAfter: Double?
  @Field var createdBefore: Double?
}

struct GetAssetsResponse {
  let assets: [[String: Any?]]
  let totalCount: Int
  let hasNextPage: Bool
}

struct PairedVideoAssetInfo: Record {
  @Field var assetId: String? = nil
  @Field var type: String = "pairedVideo"
  @Field var uri: String = ""
  @Field var width: Double = 0
  @Field var height: Double = 0
  @Field var fileName: String? = nil
  @Field var fileSize: Int? = nil
  @Field var mimeType: String? = nil
  @Field var duration: Double? = nil
}
