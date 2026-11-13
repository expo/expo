import AVFoundation
import ExpoModulesCore
import Testing

@testable import ExpoVideo

@Suite("VideoPlayer source loading")
struct VideoPlayerSourceLoadTests {
  @Test
  func `unsupported DRM type reports the error status`() async throws {
    let player = try VideoPlayer(AVPlayer(), initialSource: nil, useSynchronousReplace: true)
    let recorder = ErrorRecorder()
    player.observer?.registerDelegate(delegate: recorder)
    let drm = DRMOptions()
    drm.type = .widevine
    let source = VideoSource()
    source.uri = URL(fileURLWithPath: "/video.mp4")
    source.drm = drm

    await #expect(throws: DRMUnsupportedException.self) {
      try await player.replaceCurrentItem(with: source)
    }
    // The loader sends its events to the main queue before `replaceCurrentItem` throws.
    await withCheckedContinuation { continuation in
      DispatchQueue.main.async {
        continuation.resume()
      }
    }

    #expect(player.status == .error)
    #expect(recorder.error is DRMUnsupportedException)
  }

  @Test
  func `failed replace removes the previous item and reports the error status`() async throws {
    let previousSource = VideoSource()
    previousSource.uri = URL(fileURLWithPath: "/previous.mp4")
    let player = try VideoPlayer(AVPlayer(), initialSource: previousSource, useSynchronousReplace: true)
    await drainMainQueue()
    try #require(player.ref.currentItem != nil)
    let drm = DRMOptions()
    drm.type = .widevine
    let source = VideoSource()
    source.uri = URL(fileURLWithPath: "/video.mp4")
    source.drm = drm

    await #expect(throws: DRMUnsupportedException.self) {
      try await player.replaceCurrentItem(with: source)
    }
    await drainMainQueue()

    #expect(player.ref.currentItem == nil)
    #expect(player.status == .error)
  }
}

private func drainMainQueue() async {
  await withCheckedContinuation { continuation in
    DispatchQueue.main.async {
      continuation.resume()
    }
  }
}

private final class ErrorRecorder: VideoPlayerObserverDelegate {
  private(set) var error: Exception?

  func onStatusChanged(player: AVPlayer, oldStatus: PlayerStatus?, newStatus: PlayerStatus, error: Exception?) {
    self.error = error
  }
}
