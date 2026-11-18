import AVFoundation
import Testing

@testable import ExpoVideo

@Suite("VideoPlayer playback state")
@MainActor
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
  func `a later seek takes precedence over replay`() async throws {
    let ref = TestAVPlayer()
    let player = try VideoPlayer(ref, initialSource: nil)
    submitOffMain {
      player.replay()
      player.currentTime = 10
    }

    await drainMainQueue()
    #expect(ref.seekTimes == [0, 10])
  }

  @Test
  func `a positive rate after zero leaves playback paused until play`() async throws {
    let ref = TestAVPlayer()
    let player = try VideoPlayer(ref, initialSource: nil)
    player.play()
    submitOffMain {
      player.playbackRate = 0
      player.playbackRate = 2
    }

    await drainMainQueue()
    #expect(ref.timeControlStatus == .paused)
    #expect(ref.rate == 0)
    #expect(ref.defaultRate == 2)
    player.play()
    #expect(ref.rate == 2)
  }

  @Test
  func `queued writes become one write for each value in the next pass`() async throws {
    let ref = TestAVPlayer()
    let player = try VideoPlayer(ref, initialSource: nil)
    submitOffMain {
      player.playbackRate = 2
      player.volume = 0.6
      player.volume = 0.7
      player.play()
      player.volume = 0.8
      player.volume = 0.9
      player.playbackRate = 0.5
    }
    #expect(player.volume == 0.9)
    #expect(player.playbackRate == 0.5)

    await drainMainQueue()
    #expect(ref.volumeWrites == [0.9])
    #expect(ref.volumeAtPlay == 0.9)
    #expect(ref.rateAtPlay == 0.5)
    #expect(ref.rate == 0.5)
  }

  @Test
  func `a native volume report cannot overwrite a pending JS write`() async throws {
    let ref = TestAVPlayer()
    let player = try VideoPlayer(ref, initialSource: nil)
    player.volume = 0.5
    submitOffMain {
      for volume: Float in [0.6, 0.7, 0.8, 0.9] {
        player.volume = volume
      }
    }
    ref.volume = 0.4
    player.onVolumeChanged(player: ref, oldVolume: 0.5, newVolume: 0.4)
    #expect(player.volume == 0.9)

    await drainMainQueue()
    #expect(ref.volumeWrites == [0.5, 0.4, 0.9])
    #expect(ref.volume == 0.9)
  }

  @Test
  func `interleaved volume and mute writes become one write each`() async throws {
    let ref = TestAVPlayer()
    let player = try VideoPlayer(ref, initialSource: nil)
    submitOffMain {
      player.volume = 0.2
      player.isMuted = true
      player.volume = 0.4
      player.isMuted = false
      player.volume = 0.6
      player.isMuted = true
    }
    #expect(player.volume == 0.6)
    #expect(player.isMuted)

    await drainMainQueue()
    #expect(ref.volumeWrites == [0.6])
    #expect(ref.muteWrites == [true])
  }

  @Test
  func `a pending pause masks an earlier playing notification`() async throws {
    let ref = TestAVPlayer()
    let player = try VideoPlayer(ref, initialSource: nil)
    ref.play()
    submitOffMain {
      player.pause()
      player.playbackRate = 2
    }
    player.onIsPlayingChanged(player: ref, oldIsPlaying: false, newIsPlaying: true)
    #expect(!player.isPlaying)

    await drainMainQueue()
    #expect(!player.isPlaying)
    #expect(player.playbackRate == 2)
    #expect(ref.defaultRate == 2)
    #expect(ref.rate == 0)
  }

  @Test(arguments: [false, true])
  func `play restores the observed playing state when it supersedes a pending pause`(onlyIfPaused: Bool) async throws {
    let ref = TestAVPlayer()
    let player = try VideoPlayer(ref, initialSource: nil)
    submitOffMain { player.pause() }
    ref.play()
    player.onIsPlayingChanged(player: ref, oldIsPlaying: false, newIsPlaying: true)
    #expect(!player.isPlaying)

    submitOffMain { player.play(onlyIfPaused: onlyIfPaused) }
    await drainMainQueue()
    #expect(ref.timeControlStatus == .playing)
    #expect(player.isPlaying)
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

  private func submitOffMain(_ body: @escaping @Sendable () -> Void) {
    let submitted = DispatchSemaphore(value: 0)
    DispatchQueue.global().async {
      body()
      submitted.signal()
    }
    #expect(submitted.wait(timeout: .now() + 5) == .success)
  }

  private func drainMainQueue() async {
    await withCheckedContinuation { continuation in
      DispatchQueue.main.async { continuation.resume() }
    }
  }
}

private final class TestAVPlayer: AVPlayer {
  private var simulatedRate: Float = 0
  private var simulatedDefaultRate: Float = 1
  private var simulatedTimeControlStatus: AVPlayer.TimeControlStatus = .paused

  private(set) var rateAtPlay: Float?
  private(set) var volumeAtPlay: Float?
  private(set) var volumeWrites: [Float] = []
  private(set) var seekTimes: [Double] = []

  private(set) var muteWrites: [Bool] = []
  override var isMuted: Bool {
    get { muteWrites.last ?? false }
    set {
      willChangeValue(for: \.isMuted)
      muteWrites.append(newValue)
      didChangeValue(for: \.isMuted)
    }
  }

  override var volume: Float {
    didSet {
      volumeWrites.append(volume)
    }
  }

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
    rateAtPlay = defaultRate
    volumeAtPlay = volume
    simulatedTimeControlStatus = .playing
    rate = defaultRate
  }

  override func pause() {
    rate = 0
  }

  override func seek(to time: CMTime, toleranceBefore: CMTime, toleranceAfter: CMTime) {
    seekTimes.append(time.seconds)
  }

  func waitToPlay(at rate: Float) {
    simulatedTimeControlStatus = .waitingToPlayAtSpecifiedRate
    self.rate = rate
  }
}
