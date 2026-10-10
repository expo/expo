import Photos
import Testing

@testable import ExpoMediaLibrary

/// Unit coverage for the pure mapping layer of the class-based ("next") API. Everything here is a
/// value transformation with no PhotoKit access, so it can be asserted directly.
@Suite("MediaLibrary next mapping")
struct MediaLibraryNextMappingTests {
  @Suite("Date extensions")
  struct DateExtensionTests {
    @Test
    func `converts a date to milliseconds since the epoch`() {
      let date = Date(timeIntervalSince1970: 1_767_225_600)
      #expect(date.millisecondsSince1970 == 1_767_225_600_000)
    }

    @Test
    func `builds a date from milliseconds since the epoch`() {
      let date = Date(milliseconds: 1_767_225_600_000)
      #expect(date.timeIntervalSince1970 == 1_767_225_600)
    }

    @Test
    func `round-trips through milliseconds`() {
      let date = Date(timeIntervalSince1970: 1_767_225_600.25)
      #expect(Date(milliseconds: date.millisecondsSince1970).millisecondsSince1970 == date.millisecondsSince1970)
    }
  }

  @Suite("AssetMapper")
  struct AssetMapperTests {
    let mapper = AssetMapper()

    @Test
    func `maps the creation date to milliseconds`() {
      #expect(mapper.mapCreationTime(Date(timeIntervalSince1970: 1_767_225_600)) == 1_767_225_600_000)
    }

    @Test
    func `maps a missing creation date to nil`() {
      #expect(mapper.mapCreationTime(nil) == nil)
    }

    @Test
    func `maps the modification date to milliseconds`() {
      #expect(mapper.mapModificationTime(Date(timeIntervalSince1970: 1_767_225_600)) == 1_767_225_600_000)
    }

    @Test
    func `maps a missing modification date to nil`() {
      #expect(mapper.mapModificationTime(nil) == nil)
    }

    @Test
    func `maps the duration to milliseconds`() {
      // PHAsset.duration is a TimeInterval in seconds; JS receives milliseconds
      #expect(mapper.mapDuration(1.5) == 1500)
      #expect(mapper.mapDuration(90) == 90_000)
    }

    @Test
    func `maps a zero duration to nil`() {
      // still images report a duration of 0
      #expect(mapper.mapDuration(0) == nil)
    }

    @Test
    func `maps PHAsset media types`() {
      #expect(mapper.mapMediaType(.image) == .IMAGE)
      #expect(mapper.mapMediaType(.video) == .VIDEO)
      #expect(mapper.mapMediaType(.audio) == .AUDIO)
      #expect(mapper.mapMediaType(.unknown) == .UNKNOWN)
    }
  }

  @Suite("MediaType")
  struct MediaTypeTests {
    @Test
    func `round-trips through PHAssetMediaType`() {
      for mediaType in [MediaTypeNext.IMAGE, .VIDEO, .AUDIO, .UNKNOWN] {
        #expect(MediaTypeNext.from(mediaType.toPHAssetMediaType()) == mediaType)
      }
    }

    @Test
    func `parses api names case-insensitively`() throws {
      #expect(try MediaTypeNext.from("image") == .IMAGE)
      #expect(try MediaTypeNext.from("IMAGE") == .IMAGE)
      #expect(try MediaTypeNext.from("Video") == .VIDEO)
      #expect(try MediaTypeNext.from("audio") == .AUDIO)
      #expect(try MediaTypeNext.from("unknown") == .UNKNOWN)
    }

    @Test
    func `throws on an unrecognised api name`() {
      #expect(throws: MediaTypeFailedToParseString.self) {
        try MediaTypeNext.from("photo")
      }
    }

    @Test
    func `uses the same raw values as the JS MediaType enum`() {
      #expect(MediaTypeNext.IMAGE.rawValue == "image")
      #expect(MediaTypeNext.VIDEO.rawValue == "video")
      #expect(MediaTypeNext.AUDIO.rawValue == "audio")
      #expect(MediaTypeNext.UNKNOWN.rawValue == "unknown")
    }
  }

  @Suite("MediaSubtype")
  struct MediaSubtypeTests {
    @Test
    func `stringifies a single subtype`() {
      #expect(MediaSubtype.stringify(.photoPanorama) == ["panorama"])
      #expect(MediaSubtype.stringify(.photoScreenshot) == ["screenshot"])
      #expect(MediaSubtype.stringify(.videoTimelapse) == ["timelapse"])
    }

    @Test
    func `stringifies an empty option set`() {
      #expect(MediaSubtype.stringify([]).isEmpty)
    }

    @Test
    func `stringifies every subtype in a combined mask`() {
      let subtypes = MediaSubtype.stringify([.photoLive, .photoHDR])
      #expect(subtypes.contains("livePhoto"))
      #expect(subtypes.contains("hdr"))
      #expect(subtypes.count == 2)
    }

    @Test
    func `maps every case back to a PHAssetMediaSubtype`() {
      // spatialMedia resolves to an empty option set below iOS 16, every other case must map
      for subtype in [MediaSubtype.depthEffect, .hdr, .highFrameRate, .livePhoto, .panorama,
                      .screenshot, .stream, .timelapse, .videoCinematic] {
        #expect(!subtype.toPHAssetMediaSubtype().isEmpty)
      }
    }
  }

  @Suite("AssetField")
  struct AssetFieldTests {
    @Test
    func `maps every field to a PHAsset key path`() {
      #expect(AssetField.CREATION_TIME.photosKey() == "creationDate")
      #expect(AssetField.MODIFICATION_TIME.photosKey() == "modificationDate")
      #expect(AssetField.MEDIA_TYPE.photosKey() == "mediaType")
      #expect(AssetField.WIDTH.photosKey() == "pixelWidth")
      #expect(AssetField.HEIGHT.photosKey() == "pixelHeight")
      #expect(AssetField.DURATION.photosKey() == "duration")
      #expect(AssetField.IS_FAVORITE.photosKey() == "isFavorite")
    }

    @Test
    func `uses the same raw values as the JS AssetField enum`() {
      #expect(AssetField.CREATION_TIME.rawValue == "creationTime")
      #expect(AssetField.MODIFICATION_TIME.rawValue == "modificationTime")
      #expect(AssetField.MEDIA_TYPE.rawValue == "mediaType")
      #expect(AssetField.WIDTH.rawValue == "width")
      #expect(AssetField.HEIGHT.rawValue == "height")
      #expect(AssetField.DURATION.rawValue == "duration")
      #expect(AssetField.IS_FAVORITE.rawValue == "isFavorite")
    }
  }

  @Suite("SortDescriptor")
  struct SortDescriptorTests {
    /// `SortDescriptor`'s members are `@Field`-wrapped, so the synthesised memberwise
    /// initialiser takes `Field<Bool?>` rather than `Bool?`. Records are built by the
    /// `init()` + assignment path instead, which is also how `Record.from(dictionary:)` does it.
    private func makeDescriptor(
      key: AssetField,
      ascending: Bool? = nil
    ) -> ExpoMediaLibrary.SortDescriptor {
      // Foundation also declares a `SortDescriptor`, so the module-qualified name is required here
      var descriptor = ExpoMediaLibrary.SortDescriptor()
      descriptor.key = key
      descriptor.ascending = ascending
      return descriptor
    }

    @Test
    func `sorts ascending when ascending is not provided`() {
      let descriptor = makeDescriptor(key: .CREATION_TIME).toNSSortDescriptor()
      #expect(descriptor.key == "creationDate")
      #expect(descriptor.ascending)
    }

    @Test
    func `sorts descending when ascending is false`() {
      let descriptor = makeDescriptor(key: .MODIFICATION_TIME, ascending: false).toNSSortDescriptor()
      #expect(descriptor.key == "modificationDate")
      #expect(!descriptor.ascending)
    }

    @Test
    func `defaults to the modification date when no key is set`() {
      // the Record default, used when JS passes an AssetField instead of a SortDescriptor
      #expect(ExpoMediaLibrary.SortDescriptor().toNSSortDescriptor().key == "modificationDate")
    }

    @Test
    func `sorts by the PHAsset key path of every field`() {
      for field in [AssetField.CREATION_TIME, .MODIFICATION_TIME, .MEDIA_TYPE, .WIDTH, .HEIGHT,
                    .DURATION, .IS_FAVORITE] {
        let descriptor = makeDescriptor(key: field, ascending: true).toNSSortDescriptor()
        #expect(descriptor.key == field.photosKey())
      }
    }
  }
}
