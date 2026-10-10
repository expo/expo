import AVFoundation
import Testing

@testable import ExpoVideo

@Suite("NowPlayingManager")
struct NowPlayingManagerTests {
  @Test
  func `user metadata takes precedence over asset metadata`() async {
    let assetMetadata = AVMutableMetadataItem()
    assetMetadata.value = "Asset album" as NSString

    let value = await resolveNowPlayingMetadataValue(
      userValue: "User album",
      assetValue: assetMetadata
    )

    #expect(value == "User album")
  }

  @Test
  func `asset metadata is converted to a string`() async {
    let assetMetadata = AVMutableMetadataItem()
    assetMetadata.value = "Asset album" as NSString

    let value = await resolveNowPlayingMetadataValue(
      userValue: nil,
      assetValue: assetMetadata
    )

    #expect(value == "Asset album")
  }
}
