import ExpoModulesCore
import AVFoundation
import Combine

private enum PlaylistConstants {
  static let playlistStatusUpdate = "playlistStatusUpdate"
  static let trackChanged = "trackChanged"
}

public class AudioPlaylist: SharedRef<AVQueuePlayer>, Playable, LockScreenPlayable {
  let id = UUID().uuidString
  private let interval: Double
  private(set) var currentRate: Float = 1.0
  var isActiveForLockScreen = false
  var metadata: Metadata?
  var lockScreenOptions: LockScreenOptions?

  var loopMode: LoopMode = .none
  var wasPlaying = false

  private(set) var sources: [AudioSource] = []

  private var playerItems: [AVPlayerItem?] = []
  private var previousTrackIndex = 0

  var currentTrackIndex: Int {
    guard let current = ref.currentItem,
          let index = playerItems.firstIndex(where: { $0 === current }) else {
      return min(max(previousTrackIndex, 0), max(sources.count - 1, 0))
    }
    return index
  }

  func getSourceInfo() -> [AudioSource] {
    return sources
  }

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

  var isLive: Bool {
    ref.currentItem?.duration.isIndefinite ?? false
  }

  var lockScreenPlayer: AVPlayer {
    ref
  }

  var supportsNextTrack: Bool {
    true
  }

  var supportsPreviousTrack: Bool {
    true
  }

  var isBuffering: Bool {
    ref.isBuffering(isPlaying: isPlaying)
  }

  var trackCount: Int {
    sources.count
  }

  init(_ ref: AVQueuePlayer, sources: [AudioSource], items: [AVPlayerItem?], interval: Double, loopMode: LoopMode) {
    self.interval = interval
    self.loopMode = loopMode
    self.sources = sources
    self.playerItems = items
    super.init(ref)

    ref.actionAtItemEnd = loopMode == .single ? .pause : .advance
    setupPublisher()
    addPlaybackEndNotification()
  }

  func play(at rate: Float) {
    registerTimeObserver()
    ref.playImmediately(atRate: rate)

    if isActiveForLockScreen {
      MediaController.shared.updateNowPlayingInfo(for: self)
    }
  }

  func pause() {
    ref.pause()

    if isActiveForLockScreen {
      MediaController.shared.updateNowPlayingInfo(for: self)
    }
  }

  func next() {
    if currentTrackIndex < sources.count - 1 {
      ref.advanceToNextItem()
    } else if loopMode == .all && !sources.isEmpty {
      skipTo(index: 0)
    }
  }

  func previous() {
    if currentTrackIndex > 0 {
      let wasPlaying = isPlaying
      rebuildPlaylist(startingAt: currentTrackIndex - 1)
      if wasPlaying {
        play(at: currentRate)
      }
    } else if loopMode == .all && !sources.isEmpty {
      skipTo(index: sources.count - 1)
    }
  }

  func nextTrack() {
    next()
  }

  func previousTrack() {
    previous()
  }

  func skipTo(index: Int) {
    guard validIndex(index) else {
      return
    }

    let wasPlaying = isPlaying
    rebuildPlaylist(startingAt: index)

    if wasPlaying {
      play(at: currentRate)
    }
  }

  func seekTo(seconds: Double) async {
    let time = CMTime(seconds: seconds, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
    await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
      ref.seek(to: time) { [weak self] _ in
        if let self {
          self.updateStatus(with: ["currentTime": self.currentTime])
        }
        continuation.resume()
      }
    }
  }

  func add(source: AudioSource) {
    sources.append(source)
    let item = AudioUtils.createAVPlayerItem(from: source)
    if let item {
      ref.insert(item, after: nil)
    }
    playerItems.append(item)
    updateStatus(with: ["trackCount": trackCount])
  }

  func insert(source: AudioSource, at index: Int) {
    guard index >= 0 && index <= sources.count else {
      return
    }

    let wasPlaying = isPlaying
    let resumeIndex: Int
    if ref.currentItem != nil {
      resumeIndex = index <= currentTrackIndex ? currentTrackIndex + 1 : currentTrackIndex
    } else {
      resumeIndex = index
    }
    sources.insert(source, at: index)

    previousTrackIndex = resumeIndex
    rebuildPlaylist(startingAt: resumeIndex)
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
    let current = currentTrackIndex
    sources.remove(at: index)

    if index == current {
      let resumeIndex = min(current, max(0, sources.count - 1))
      previousTrackIndex = resumeIndex
      rebuildPlaylist(startingAt: resumeIndex)
      if wasPlaying && !sources.isEmpty {
        play(at: currentRate)
      }
    } else if index < current {
      let resumeIndex = current - 1
      previousTrackIndex = resumeIndex
      rebuildPlaylist(startingAt: resumeIndex)
      if wasPlaying {
        play(at: currentRate)
      }
    } else if index < playerItems.count {
      if let item = playerItems[index] {
        ref.remove(item)
      }
      playerItems.remove(at: index)
    }

    updateStatus(with: ["trackCount": trackCount])
  }

  func clear() {
    ref.pause()
    ref.removeAllItems()
    sources.removeAll()
    playerItems.removeAll()
    previousTrackIndex = 0

    updateStatus(with: [
      "trackCount": 0,
      "currentIndex": 0,
      "playing": false
    ])
  }

  func setLoopMode(_ mode: LoopMode) {
    loopMode = mode
    ref.actionAtItemEnd = mode == .single ? .pause : .advance
    updateStatus(with: ["loop": mode.rawValue])
  }

  func setPlaybackRate(_ rate: Float) {
    let boundedRate = max(0.1, min(rate, 2.0))
    currentRate = boundedRate
    if isPlaying {
      ref.rate = boundedRate
    }
  }

  func setActiveForLockScreen(_ active: Bool = true, metadata: Metadata? = nil, options: LockScreenOptions?) {
    self.metadata = metadata
    self.isActiveForLockScreen = active
    self.lockScreenOptions = active ? options : nil
    if active {
      MediaController.shared.setActivePlayable(self, options: options)
    } else {
      MediaController.shared.setActivePlayable(nil)
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
    self.emit(event: PlaylistConstants.playlistStatusUpdate, payload: arguments)

    if isActiveForLockScreen {
      MediaController.shared.updateNowPlayingInfo(for: self)
    }
  }

  private func validIndex(_ index: Int) -> Bool {
    return index >= 0 && index < sources.count
  }

  private func emitTrackChanged(previousIndex: Int, currentIndex: Int) {
    self.emit(event: PlaylistConstants.trackChanged, payload: [
      "previousIndex": previousIndex,
      "currentIndex": currentIndex
    ])
    updateStatus(with: [:])
  }

  private func rebuildPlaylist(startingAt index: Int) {
    var items = [AVPlayerItem?](repeating: nil, count: sources.count)
    for i in index..<sources.count {
      items[i] = AudioUtils.createAVPlayerItem(from: sources[i])
    }
    playerItems = items

    ref.removeAllItems()
    for i in index..<sources.count {
      if let item = items[i] {
        ref.insert(item, after: nil)
      }
    }
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
      .sink { [weak self] _ in
        guard let self else {
          return
        }
        let index = self.currentTrackIndex
        if index != self.previousTrackIndex {
          self.emitTrackChanged(previousIndex: self.previousTrackIndex, currentIndex: index)
          self.previousTrackIndex = index
        } else {
          self.updateStatus(with: [:])
        }
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
            let finishedIndex = self.playerItems.firstIndex(where: { $0 === item }) else {
        return
      }

      let isLastTrack = finishedIndex >= self.sources.count - 1

      switch self.loopMode {
      case .single:
        self.ref.seek(to: .zero)
        self.play(at: self.currentRate)

      case .all:
        if isLastTrack {
          self.skipTo(index: 0)
          self.play(at: self.currentRate)
        }

      case .none:
        if isLastTrack {
          self.updateStatus(with: [
            "playing": false,
            "didJustFinish": true
          ])
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

  var volume: Float {
    get { ref.volume }
    set { ref.volume = newValue }
  }

  func resumePlayback() {
    play(at: currentRate)
  }

  public override func sharedObjectWillRelease() {
    ref.currentItem?.cancelPendingSeeks()
    owningRegistry?.remove(self)
    cancellables.removeAll()

    if let timeToken {
      ref.removeTimeObserver(timeToken)
    }

    if let endObserver {
      NotificationCenter.default.removeObserver(endObserver)
    }

    if isActiveForLockScreen {
      MediaController.shared.setActivePlayable(nil)
    }

    ref.pause()
    ref.removeAllItems()
  }
}
