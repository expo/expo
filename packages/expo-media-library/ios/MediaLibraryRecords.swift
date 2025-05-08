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

enum MediaSubtype: String, Enumerable {
  case depthEffect
  case hdr
  case highFrameRate
  case livePhoto
  case panorama
  case screenshot
  case stream
  case timelapse
  case unknown

  func toPHAssetMediaSubtype() -> PHAssetMediaSubtype {
    switch self {
    case .depthEffect:
      return .photoDepthEffect
    case .hdr:
      return .photoHDR
    case .highFrameRate:
      return .videoHighFrameRate
    case .livePhoto:
      return .photoLive
    case .panorama:
      return .photoPanorama
    case .screenshot:
      return .photoScreenshot
    case .stream:
      return .videoStreamed
    case .timelapse:
      return .videoTimelapse
    case .unknown:
      return .none
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
  @Field var mediaSubtypes: [String] = []
  @Field var createdAfter: Double?
  @Field var createdBefore: Double?
}

struct GetAssetsResponse {
  let assets: [[String: Any?]]
  let totalCount: Int
  let hasNextPage: Bool
}
