import AVFoundation
import ExpoModulesCore
import Testing

@testable import ExpoVideo

@MainActor
@Suite("VideoPlayer failed replace")
struct VideoPlayerReplaceFailureTests {
  @Test
  func `currentTime seeks after an async replace throws`() async throws {
    let ref = SeekRecordingAVPlayer()
    let player = try await makeIdlePlayer(ref)

    await #expect(throws: DRMUnsupportedException.self) {
      try await player.replaceCurrentItem(with: makeUnsupportedSource())
    }
    player.currentTime = 2

    #expect(ref.seekTimes == [2])
  }

  @Test
  func `currentTime seeks after a synchronous replace throws`() async throws {
    let ref = SeekRecordingAVPlayer()
    let player = try await makeIdlePlayer(ref)

    // Nothing between the throw and the assertion yields the main actor, so a reset queued on the main queue can't run first.
    #expect(throws: DRMUnsupportedException.self) {
      try player.replaceCurrentItem(with: makeUnsupportedSource())
    }
    player.currentTime = 2

    #expect(ref.seekTimes == [2])
  }

  @Test
  func `replace that throws drops the currentTime stored while it ran`() async throws {
    let ref = SeekRecordingAVPlayer()
    let player = try await makeIdlePlayer(ref)
    let source = makeUnsupportedSource(path: "/stored-time.mp4")
    // The provider runs while the replace builds its item, before the DRM check throws.
    let provider = CurrentTimeWritingProvider(url: source.uri!, player: player)
    VideoAssetTransportRegistry.registerProvider(provider)
    defer {
      VideoAssetTransportRegistry.unregisterProvider(withId: provider.identifier)
    }

    #expect(throws: DRMUnsupportedException.self) {
      try player.replaceCurrentItem(with: source)
    }
    let nextSource = VideoSource()
    nextSource.uri = URL(fileURLWithPath: "/next.mp4")
    try await player.replaceCurrentItem(with: nextSource)
    await drainMainQueue()

    #expect(provider.didWrite)
    #expect((ref.currentItem as? VideoPlayerItem)?.videoSource.uri == nextSource.uri)
    #expect(ref.seekTimes.isEmpty)
  }

  private func makeIdlePlayer(_ ref: AVPlayer) async throws -> VideoPlayer {
    let player = try VideoPlayer(ref, initialSource: nil, useSynchronousReplace: true)
    // The nil source queues a reset of the replace state on the main queue. Run it now, so it can't clear the flag mid-test.
    await drainMainQueue()
    return player
  }

  private func drainMainQueue() async {
    await withCheckedContinuation { continuation in
      DispatchQueue.main.async {
        continuation.resume()
      }
    }
  }

  private func makeUnsupportedSource(path: String = "/video.mp4") -> VideoSource {
    let drm = DRMOptions()
    drm.type = .widevine
    let source = VideoSource()
    source.uri = URL(fileURLWithPath: path)
    source.drm = drm
    return source
  }
}

private final class CurrentTimeWritingProvider: VideoAssetTransportProvider {
  let identifier = "expo-video.tests.current-time-writing"
  let priority = Int.max
  private let url: URL
  private weak var player: VideoPlayer?
  private(set) var didWrite = false

  init(url: URL, player: VideoPlayer) {
    self.url = url
    self.player = player
  }

  func makeLoadPlan(for source: VideoAssetSourceDescriptor) -> VideoAssetLoadPlan? {
    if source.url == url {
      player?.currentTime = 5
      didWrite = true
    }
    return nil
  }
}

private final class SeekRecordingAVPlayer: AVPlayer {
  private(set) var seekTimes: [Double] = []

  override func seek(to time: CMTime, toleranceBefore: CMTime, toleranceAfter: CMTime) {
    seekTimes.append(time.seconds)
  }
}
