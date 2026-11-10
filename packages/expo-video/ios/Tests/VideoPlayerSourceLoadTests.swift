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
}

private final class ErrorRecorder: VideoPlayerObserverDelegate {
  private(set) var error: Exception?

  func onStatusChanged(player: AVPlayer, oldStatus: PlayerStatus?, newStatus: PlayerStatus, error: Exception?) {
    self.error = error
  }
}
