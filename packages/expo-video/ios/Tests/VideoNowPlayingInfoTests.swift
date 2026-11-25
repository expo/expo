import CoreMedia
import ExpoMediaSession
import Foundation
import Testing

@testable import ExpoVideo

@Suite("VideoNowPlaying")
struct VideoNowPlayingInfoTests {
  private let artworkURL = URL(string: "https://example.com/artwork.png")
  private let artworkData = Data([0x01, 0x02, 0x03])

  private func makeMetadata(title: String? = nil, artist: String? = nil, artwork: URL? = nil) -> VideoMetadata {
    var metadata = VideoMetadata()
    metadata.title = title
    metadata.artist = artist
    metadata.artwork = artwork
    return metadata
  }

  private func makeInfo(
    metadata: VideoMetadata? = nil,
    asset: VideoAssetMetadata? = nil,
    duration: CMTime = CMTime(seconds: 120, preferredTimescale: 600),
    elapsedTime: Double = 0,
    rate: Float = 1
  ) -> NowPlayingInfo {
    return VideoNowPlaying.info(
      metadata: metadata,
      asset: asset,
      duration: duration,
      elapsedTime: elapsedTime,
      rate: rate
    )
  }

  // MARK: - Info

  @Test
  func `source metadata wins over asset metadata`() {
    let info = makeInfo(metadata: makeMetadata(title: "A", artist: "B"), asset: VideoAssetMetadata(title: "X", artist: "Y"))

    #expect(info.title == "A")
    #expect(info.artist == "B")
  }

  @Test
  func `asset metadata fills missing source metadata`() {
    let info = makeInfo(asset: VideoAssetMetadata(title: "X", artist: "Y"))

    #expect(info.title == "X")
    #expect(info.artist == "Y")
  }

  @Test
  func `an artwork url replaces the asset artwork`() {
    let info = makeInfo(metadata: makeMetadata(artwork: artworkURL), asset: VideoAssetMetadata(artworkData: artworkData))

    #expect(info.artworkURL == artworkURL)
    #expect(info.artworkData == nil)
  }

  @Test
  func `asset artwork is used without an artwork url`() {
    let info = makeInfo(asset: VideoAssetMetadata(artworkData: artworkData))

    #expect(info.artworkURL == nil)
    #expect(info.artworkData == artworkData)
  }

  @Test
  func `no metadata gives empty text fields`() {
    let info = makeInfo()

    #expect(info.title == nil)
    #expect(info.artist == nil)
    #expect(info.artworkURL == nil)
    #expect(info.artworkData == nil)
  }

  @Test
  func `a finite duration is not a live stream`() {
    let info = makeInfo(duration: CMTime(seconds: 120, preferredTimescale: 600), elapsedTime: 42, rate: 1)

    #expect(info.duration == 120)
    #expect(info.elapsedTime == 42)
    #expect(info.playbackRate == 1)
    #expect(info.isLiveStream == false)
  }

  @Test
  func `an indefinite duration is a live stream without a duration`() {
    let info = makeInfo(duration: .indefinite)

    #expect(info.isLiveStream == true)
    #expect(info.duration == nil)
  }

  @Test
  func `a non-finite elapsed time is dropped`() {
    let info = makeInfo(elapsedTime: .nan)

    #expect(info.elapsedTime == nil)
  }

  @Test
  func `skip intervals are ten seconds`() {
    let info = makeInfo()

    #expect(info.skipForwardInterval == 10)
    #expect(info.skipBackwardInterval == 10)
  }

  // MARK: - Seek target

  @Test
  func `seek goes to the command value`() {
    let target = VideoNowPlaying.seekTarget(for: RemoteCommand(kind: .seek, value: 42), currentTime: 5)

    #expect(target == 42)
  }

  @Test
  func `skip forward adds the interval`() {
    let target = VideoNowPlaying.seekTarget(for: RemoteCommand(kind: .skipForward, value: 10), currentTime: 5)

    #expect(target == 15)
  }

  @Test
  func `skip uses ten seconds without a value`() {
    let target = VideoNowPlaying.seekTarget(for: RemoteCommand(kind: .skipForward), currentTime: 5)

    #expect(target == 15)
  }

  @Test
  func `skip backward stops at zero`() {
    let target = VideoNowPlaying.seekTarget(for: RemoteCommand(kind: .skipBackward, value: 10), currentTime: 3)

    #expect(target == 0)
  }

  @Test
  func `play has no seek target`() {
    let target = VideoNowPlaying.seekTarget(for: RemoteCommand(kind: .play), currentTime: 5)

    #expect(target == nil)
  }
}
