import AVFoundation
import Testing

@testable import ExpoVideo

@Suite("VideoPlayer playback rate")
struct VideoPlayerPlaybackRateTests {
  @Test
  func `setting playback rate while paused does not request playback`() throws {
    let ref = TestAVPlayer()
    let player = try VideoPlayer(ref, initialSource: nil)

    player.playbackRate = 1.5

    #expect(ref.timeControlStatus == .paused)
    #expect(ref.rate == 0)
    #expect(ref.defaultRate == 1.5)
  }

  @Test
  func `explicit play uses the configured playback rate`() throws {
    let ref = TestAVPlayer()
    let player = try VideoPlayer(ref, initialSource: nil)
    player.playbackRate = 1.5

    ref.play()

    #expect(ref.timeControlStatus == .playing)
    #expect(ref.rate == 1.5)
  }

  @Test
  func `setting playback rate while playing applies immediately`() throws {
    let ref = TestAVPlayer()
    let player = try VideoPlayer(ref, initialSource: nil)
    ref.play()

    player.playbackRate = 2

    #expect(ref.timeControlStatus == .playing)
    #expect(ref.rate == 2)
  }

  @Test
  func `setting playback rate while waiting applies to the pending playback request`() throws {
    let ref = TestAVPlayer()
    let player = try VideoPlayer(ref, initialSource: nil)
    ref.waitToPlay(at: 1)

    player.playbackRate = 1.75

    #expect(ref.timeControlStatus == .waitingToPlayAtSpecifiedRate)
    #expect(ref.rate == 1.75)
  }
}

private final class TestAVPlayer: AVPlayer {
  private var simulatedRate: Float = 0
  private var simulatedDefaultRate: Float = 1
  private var simulatedTimeControlStatus: AVPlayer.TimeControlStatus = .paused

  override var rate: Float {
    get {
      return simulatedRate
    }
    set {
      simulatedRate = newValue
      if newValue == 0 {
        simulatedTimeControlStatus = .paused
      } else if simulatedTimeControlStatus == .paused {
        simulatedTimeControlStatus = .waitingToPlayAtSpecifiedRate
      }
    }
  }

  override var defaultRate: Float {
    get {
      return simulatedDefaultRate
    }
    set {
      simulatedDefaultRate = newValue
    }
  }

  override var timeControlStatus: AVPlayer.TimeControlStatus {
    return simulatedTimeControlStatus
  }

  override func play() {
    simulatedTimeControlStatus = .playing
    rate = defaultRate
  }

  func waitToPlay(at rate: Float) {
    simulatedTimeControlStatus = .waitingToPlayAtSpecifiedRate
    self.rate = rate
  }
}
