import AVFoundation
import Testing

@testable import ExpoVideo

@Suite("VideoPlayerObserver status")
struct VideoPlayerObserverTests {
  @MainActor
  @Test
  func `player without an item stays idle when time control status changes`() throws {
    let ref = ReadyPlayerWithoutItem()
    let player = try VideoPlayer(ref, initialSource: nil, useSynchronousReplace: true)
    #expect(player.status == .idle)

    ref.notifyTimeControlStatusChange()

    #expect(player.status == .idle)
  }
}

// `AVPlayer.status` stays `.readyToPlay` after the player's item is removed.
private final class ReadyPlayerWithoutItem: AVPlayer {
  override var status: AVPlayer.Status {
    return .readyToPlay
  }

  override var timeControlStatus: AVPlayer.TimeControlStatus {
    return .paused
  }

  func notifyTimeControlStatusChange() {
    willChangeValue(for: \.timeControlStatus)
    didChangeValue(for: \.timeControlStatus)
  }
}
