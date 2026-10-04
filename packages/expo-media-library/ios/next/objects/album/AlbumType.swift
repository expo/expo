import Photos
import ExpoModulesCore

enum AlbumType: String, Enumerable {
  case ALBUM = "album"
  case SMART_ALBUM = "smartAlbum"

  static func from(_ type: PHAssetCollectionType) throws -> AlbumType {
    switch type {
    case .album: return .ALBUM
    case .smartAlbum: return .SMART_ALBUM
    default: throw UnsupportedAlbumTypeException("\(type.rawValue)")
    }
  }
}
