import ExpoModulesCore
import Photos

enum MediaType: String, Enumerable {
  case audio
  case photo
  case video
  case all
  case unknown

  init(fromPHAssetMediaType mediaType: PHAssetMediaType) {
    let result: MediaType = switch mediaType {
    case .audio: .audio
    case .image: .photo
    case .video: .video
    default: .unknown
    }
    self = result
  }

  func toPHMediaType() -> PHAssetMediaType {
    switch self {
    case .audio: .audio
    case .photo: .image
    case .video: .video
    default: .unknown
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
  case spatialMedia
  case videoCinematic

  static func stringify(_ mediaSubtypes: PHAssetMediaSubtype) -> [MediaSubtype.RawValue] {
    var mapping: [(PHAssetMediaSubtype, MediaSubtype)] = [
      (.photoDepthEffect, .depthEffect),
      (.photoHDR, .hdr),
      (.videoHighFrameRate, .highFrameRate),
      (.photoLive, .livePhoto),
      (.photoPanorama, .panorama),
      (.photoScreenshot, .screenshot),
      (.videoStreamed, .stream),
      (.videoTimelapse, .timelapse),
      (.videoCinematic, .videoCinematic)
    ]
    if #available(iOS 16.0, tvOS 16.0, *) {
      mapping.append((.spatialMedia, .spatialMedia))
    }

    return mapping.compactMap { phSubtype, mediaSubtype in
      mediaSubtypes.contains(phSubtype) ? mediaSubtype.rawValue : nil
    }
  }

  func toPHAssetMediaSubtype() -> PHAssetMediaSubtype {
    switch self {
    case .depthEffect: .photoDepthEffect
    case .hdr: .photoHDR
    case .highFrameRate: .videoHighFrameRate
    case .livePhoto: .photoLive
    case .panorama: .photoPanorama
    case .screenshot: .photoScreenshot
    case .stream: .videoStreamed
    case .timelapse: .videoTimelapse
    case .spatialMedia:
      if #available(iOS 16, tvOS 16, *) {
        .spatialMedia
      } else {
        []
      }
    case .videoCinematic: .videoCinematic
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
  @Field var mediaSubtypes: [MediaSubtype]
  @Field var createdAfter: Double?
  @Field var createdBefore: Double?
}

struct GetAssetsResponse {
  let assets: [[String: Any?]]
  let totalCount: Int
  let hasNextPage: Bool
}
