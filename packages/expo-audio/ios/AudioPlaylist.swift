import ExpoModulesCore
import AVFoundation
import Combine

private enum PlaylistConstants {
  static let playlistStatusUpdate = "playlistStatusUpdate"
  static let trackChanged = "trackChanged"
}

public class AudioPlaylist: SharedRef<AVQueuePlayer> {
  let id = UUID().uuidString
  private let interval: Double
  private(set) var currentRate: Float = 1.0

  var loopMode: LoopMode = .none
  var wasPlaying = false

  private(set) var sources: [AudioSource] = []
  private(set) var currentTrackIndex: Int = 0

  func getSourceInfo() -> [AudioSource] {
    return sources
  }

  private var currentItem: AVPlayerItem?
  private var timeToken: Any?
  private var cancellables = Set<AnyCancellable>()
  private var endObserver: NSObjectProtocol?

  weak var owningRegistry: AudioComponentRegistry?

  var duration: Double {
    let d = ref.currentItem?.duration.seconds ?? 0.0
    return d.isNaN ? 0.0 : d
  }

  var currentTime: Double {
    ref.currentItem?.currentTime().seconds ?? 0.0
  }

  var isLoaded: Bool {
    ref.currentItem?.status == .readyToPlay
  }

  var isPlaying: Bool {
    ref.timeControlStatus == .playing
  }

  var isBuffering: Bool {
    playerIsBuffering()
  }

  var trackCount: Int {
    sources.count
  }

  init(_ ref: AVQueuePlayer, sources: [AudioSource], interval: Double, loopMode: LoopMode) {
    self.interval = interval
    self.loopMode = loopMode
    self.sources = sources
    super.init(ref)

    self.currentItem = ref.currentItem
    setupPublisher()
    addPlaybackEndNotification()
  }

  func play(at rate: Float) {
    registerTimeObserver()
    ref.playImmediately(atRate: rate)
  }

  func pause() {
    ref.pause()
  }

  func next() {
    let previousIndex = currentTrackIndex

    if currentTrackIndex < sources.count - 1 {
      ref.advanceToNextItem()
      currentTrackIndex += 1
      currentItem = ref.currentItem
      emitTrackChanged(previousIndex: previousIndex, currentIndex: currentTrackIndex)
    } else if loopMode == .all && !sources.isEmpty {
      skipTo(index: 0)
    }
  }

  func previous() {
    let previousIndex = currentTrackIndex

    if currentTrackIndex > 0 {
      let wasPlaying = isPlaying
      currentTrackIndex -= 1
      rebuildPlaylist(startingAt: currentTrackIndex)
      if wasPlaying {
        play(at: currentRate)
      }
      emitTrackChanged(previousIndex: previousIndex, currentIndex: currentTrackIndex)
    } else if loopMode == .all && !sources.isEmpty {
      skipTo(index: sources.count - 1)
    }
  }

  func skipTo(index: Int) {
    guard validIndex(index) else {
      return
    }

    let previousIndex = currentTrackIndex
    let wasPlaying = isPlaying

    currentTrackIndex = index
    rebuildPlaylist(startingAt: index)

    if wasPlaying {
      play(at: currentRate)
    }

    emitTrackChanged(previousIndex: previousIndex, currentIndex: currentTrackIndex)
  }

  func seekTo(seconds: Double) async {
    let time = CMTime(seconds: seconds, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
    await ref.currentItem?.seek(to: time)
    updateStatus(with: ["currentTime": currentTime])
  }

  func add(source: AudioSource) {
    sources.append(source)
    if let item = AudioUtils.createAVPlayerItem(from: source) {
      ref.insert(item, after: nil)
    }
    if currentItem == nil {
      currentItem = ref.currentItem
    }
    updateStatus(with: ["trackCount": trackCount])
  }

  func insert(source: AudioSource, at index: Int) {
    guard index >= 0 && index <= sources.count else {
      return
    }

    let wasPlaying = isPlaying
    sources.insert(source, at: index)

    if index <= currentTrackIndex {
      currentTrackIndex += 1
    }

    rebuildPlaylist(startingAt: currentTrackIndex)
    if wasPlaying {
      play(at: currentRate)
    }
    updateStatus(with: ["trackCount": trackCount])
  }

  func remove(at index: Int) {
    guard validIndex(index) else {
      return
    }

    let wasPlaying = isPlaying
    sources.remove(at: index)

    if index == currentTrackIndex {
      if currentTrackIndex >= sources.count {
        currentTrackIndex = max(0, sources.count - 1)
      }
      rebuildPlaylist(startingAt: currentTrackIndex)
      if wasPlaying && !sources.isEmpty {
        play(at: currentRate)
      }
    } else if index < currentTrackIndex {
      currentTrackIndex -= 1
      rebuildPlaylist(startingAt: currentTrackIndex)
      if wasPlaying {
        play(at: currentRate)
      }
    }

    updateStatus(with: ["trackCount": trackCount])
  }

  func clear() {
    ref.pause()
    ref.removeAllItems()
    sources.removeAll()
    currentTrackIndex = 0
    currentItem = nil

    updateStatus(with: [
      "trackCount": 0,
      "currentIndex": 0,
      "playing": false
    ])
  }

  func setLoopMode(_ mode: LoopMode) {
    loopMode = mode
    updateStatus(with: ["loop": mode.rawValue])
  }

  func setPlaybackRate(_ rate: Float) {
    let boundedRate = max(0.1, min(rate, 2.0))
    currentRate = boundedRate
    if isPlaying {
      ref.rate = boundedRate
    }
  }

  func currentStatus() -> [String: Any] {
    return [
      "id": id,
      "currentIndex": currentTrackIndex,
      "trackCount": trackCount,
      "currentTime": currentTime,
      "duration": duration,
      "playing": isPlaying,
      "isBuffering": isBuffering,
      "isLoaded": isLoaded,
      "playbackRate": isPlaying ? ref.rate : currentRate,
      "muted": ref.isMuted,
      "volume": ref.volume,
      "loop": loopMode.rawValue,
      "didJustFinish": false
    ]
  }

  func updateStatus(with dict: [String: Any]) {
    var arguments = currentStatus()
    arguments.merge(dict) { _, new in new }
    self.emit(event: PlaylistConstants.playlistStatusUpdate, arguments: arguments)
  }

  private func validIndex(_ index: Int) -> Bool {
    return index >= 0 && index < sources.count
  }

  private func emitTrackChanged(previousIndex: Int, currentIndex: Int) {
    self.emit(event: PlaylistConstants.trackChanged, arguments: [
      "previousIndex": previousIndex,
      "currentIndex": currentIndex
    ])
    updateStatus(with: [:])
  }

  private func rebuildPlaylist(startingAt index: Int) {
    ref.removeAllItems()

    for i in index..<sources.count {
      if let item = AudioUtils.createAVPlayerItem(from: sources[i]) {
        ref.insert(item, after: nil)
      }
    }
    currentItem = ref.currentItem
  }

  private func setupPublisher() {
    ref.publisher(for: \.currentItem?.status)
      .sink { [weak self] status in
        guard let self, let status else {
          return
        }
        if status == .readyToPlay {
          self.updateStatus(with: ["isLoaded": true])
        }
      }
      .store(in: &cancellables)

    ref.publisher(for: \.currentItem)
      .sink { [weak self] item in
        guard let self else {
          return
        }
        self.updateStatus(with: [:])
      }
      .store(in: &cancellables)
  }

  private func addPlaybackEndNotification() {
    endObserver = NotificationCenter.default.addObserver(
      forName: .AVPlayerItemDidPlayToEndTime,
      object: nil,
      queue: nil
    ) { [weak self] notification in
      guard let self,
            let item = notification.object as? AVPlayerItem,
            item == self.currentItem else {
        return
      }

      let previousIndex = self.currentTrackIndex

      switch self.loopMode {
      case .single:
        self.rebuildPlaylist(startingAt: self.currentTrackIndex)
        self.play(at: self.currentRate)

      case .all:
        if self.currentTrackIndex >= self.sources.count - 1 {
          self.skipTo(index: 0)
          self.play(at: self.currentRate)
        } else {
          self.currentItem = self.ref.currentItem
          self.currentTrackIndex += 1
          self.emitTrackChanged(previousIndex: previousIndex, currentIndex: self.currentTrackIndex)
        }

      case .none:
        if self.currentTrackIndex >= self.sources.count - 1 {
          self.currentItem = nil
          self.updateStatus(with: [
            "playing": false,
            "didJustFinish": true
          ])
        } else {
          self.currentItem = self.ref.currentItem
          self.currentTrackIndex += 1
          self.emitTrackChanged(previousIndex: previousIndex, currentIndex: self.currentTrackIndex)
        }
      }
    }
  }

  private func registerTimeObserver() {
    if let timeToken {
      ref.removeTimeObserver(timeToken)
    }

    let updateInterval = interval / 1000
    let interval = CMTime(seconds: updateInterval, preferredTimescale: CMTimeScale(NSEC_PER_SEC))

    timeToken = ref.addPeriodicTimeObserver(forInterval: interval, queue: nil) { [weak self] time in
      guard let self else {
        return
      }
      self.updateStatus(with: ["currentTime": time.seconds])
    }
  }

  private func playerIsBuffering() -> Bool {
    if isPlaying {
      return false
    }

    if ref.timeControlStatus == .waitingToPlayAtSpecifiedRate {
      return true
    }

    if let currentItem = ref.currentItem {
      return !currentItem.isPlaybackLikelyToKeepUp && currentItem.isPlaybackBufferEmpty
    }
    return true
  }

  public override func sharedObjectWillRelease() {
    owningRegistry?.remove(self)
    cancellables.removeAll()

    if let timeToken {
      ref.removeTimeObserver(timeToken)
    }

    if let endObserver {
      NotificationCenter.default.removeObserver(endObserver)
    }

    ref.pause()
    ref.removeAllItems()
  }
}
