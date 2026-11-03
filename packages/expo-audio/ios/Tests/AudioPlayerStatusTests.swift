import Testing
import AVFoundation

@testable import ExpoAudio

private final class SpyPlayerItem: AVPlayerItem {
  private(set) var currentDateCalls = 0
  private(set) var currentTimeCalls = 0

  override func currentDate() -> Date? {
    currentDateCalls += 1
    return super.currentDate()
  }

  override func currentTime() -> CMTime {
    currentTimeCalls += 1
    return super.currentTime()
  }
}

@Suite("AudioPlayer status")
struct AudioPlayerStatusTests {
  @Test
  func `does not ask an item that is still loading for its date`() {
    let (player, item) = makePlayer()

    let status = player.currentStatus()

    #expect(item.status != .readyToPlay)
    #expect(item.currentDateCalls == 0)
    #expect(status["currentOffsetFromLive"] as? Double == nil)
  }

  @Test
  func `reports the time it is given instead of reading it from the item`() {
    let (player, item) = makePlayer()

    let status = player.currentStatus(knownCurrentTime: 12.5)

    #expect(status["currentTime"] as? Double == 12.5)
    #expect(item.currentTimeCalls == 0)
  }

  @Test
  func `reads the item's time only for an update that does not carry one`() {
    let (player, item) = makePlayer()

    player.updateStatus(with: ["currentTime": 3.0])
    #expect(item.currentTimeCalls == 0)

    player.updateStatus(with: [:])
    #expect(item.currentTimeCalls == 1)
  }

  private func makePlayer() -> (AudioPlayer, SpyPlayerItem) {
    let item = SpyPlayerItem(url: URL(string: "https://example.invalid/track.mp3")!)
    return (AudioPlayer(AVQueuePlayer(items: [item]), interval: 500), item)
  }
}
