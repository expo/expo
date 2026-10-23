import Photos
import Testing

@testable import ExpoMediaLibrary

/// Unit coverage for the pure helpers in the legacy iOS implementation. `assetType(for:)` in
/// particular decides whether a file can be saved at all — `createAssetAsync` and
/// `saveToLibraryAsync` both reject anything it reports as `.unknown` or `.audio`.
@Suite("MediaLibrary utilities")
struct MediaLibraryUtilitiesTests {
  @Suite("assetType")
  struct AssetTypeTests {
    private func type(_ filename: String) -> PHAssetMediaType {
      assetType(for: URL(fileURLWithPath: "/tmp/\(filename)"))
    }

    @Test
    func `recognises common image extensions`() {
      for filename in ["photo.jpg", "photo.jpeg", "photo.png", "photo.gif", "photo.heic",
                       "photo.tiff", "photo.webp"] {
        #expect(type(filename) == .image, "expected \(filename) to be an image")
      }
    }

    @Test
    func `recognises common video extensions`() {
      for filename in ["clip.mov", "clip.mp4", "clip.m4v"] {
        #expect(type(filename) == .video, "expected \(filename) to be a video")
      }
    }

    @Test
    func `recognises common audio extensions`() {
      for filename in ["song.mp3", "song.m4a", "song.wav", "song.aiff"] {
        #expect(type(filename) == .audio, "expected \(filename) to be audio")
      }
    }

    @Test
    func `is case-insensitive`() {
      #expect(type("PHOTO.JPG") == .image)
      #expect(type("CLIP.MOV") == .video)
    }

    @Test
    func `reports an unknown type for a file with no extension`() {
      #expect(type("noextension") == .unknown)
    }

    @Test
    func `reports an unknown type for a non-media extension`() {
      #expect(type("document.xyzzy") == .unknown)
    }
  }

  @Suite("MediaType")
  struct MediaTypeTests {
    @Test
    func `maps PHAsset media types to the legacy api names`() {
      #expect(MediaType(fromPHAssetMediaType: .image) == .photo)
      #expect(MediaType(fromPHAssetMediaType: .video) == .video)
      #expect(MediaType(fromPHAssetMediaType: .audio) == .audio)
      #expect(MediaType(fromPHAssetMediaType: .unknown) == .unknown)
    }

    @Test
    func `maps the legacy api names back to PHAsset media types`() {
      #expect(MediaType.photo.toPHMediaType() == .image)
      #expect(MediaType.video.toPHMediaType() == .video)
      #expect(MediaType.audio.toPHMediaType() == .audio)
      #expect(MediaType.unknown.toPHMediaType() == .unknown)
    }

    @Test
    func `uses the same raw values as the JS MediaType constant`() {
      #expect(MediaType.photo.rawValue == "photo")
      #expect(MediaType.video.rawValue == "video")
      #expect(MediaType.audio.rawValue == "audio")
      #expect(MediaType.unknown.rawValue == "unknown")
      #expect(MediaType.all.rawValue == "all")
    }
  }

  @Suite("exportDate")
  struct ExportDateTests {
    @Test
    func `exports a date as milliseconds since the epoch`() {
      #expect(exportDate(Date(timeIntervalSince1970: 1_767_225_600)) == 1_767_225_600_000)
    }

    @Test
    func `exports a missing date as nil`() {
      #expect(exportDate(nil) == nil)
    }
  }

  @Suite("getFileExtension")
  struct FileExtensionTests {
    @Test
    func `returns the extension with a leading dot`() {
      #expect(getFileExtension(from: "IMG_0001.MOV") == ".MOV")
    }

    @Test
    func `returns only the last extension`() {
      #expect(getFileExtension(from: "my.holiday.clip.mov") == ".mov")
    }

    @Test
    func `returns a bare dot when there is no extension`() {
      #expect(getFileExtension(from: "IMG_0001") == ".")
    }
  }

  @Suite("assetIdFromLocalId")
  struct AssetIdTests {
    @Test
    func `strips the fragment from a PhotoKit local identifier`() {
      #expect(assetIdFromLocalId(localId: "5E8C0C43-1234-5678-9ABC-DEF012345678/L0/001")
        == "5E8C0C43-1234-5678-9ABC-DEF012345678")
    }

    @Test
    func `returns nil when there is no fragment to strip`() {
      #expect(assetIdFromLocalId(localId: "5E8C0C43-1234-5678-9ABC-DEF012345678") == nil)
    }
  }

  @Suite("assetUriForLocalId")
  struct AssetUriTests {
    @Test
    func `prefixes the local identifier with the ph scheme`() {
      #expect(assetUriForLocalId(localId: "ABC/L0/001") == "ph://ABC/L0/001")
    }
  }

  @Suite("stringifyAlbumType")
  struct AlbumTypeTests {
    @Test
    func `maps PHAssetCollectionType to the legacy api names`() {
      #expect(stringifyAlbumType(type: .album) == "album")
      #expect(stringifyAlbumType(type: .smartAlbum) == "smartAlbum")
    }
  }
}
