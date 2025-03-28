import Foundation
import AVFoundation
import ExpoModulesCore

class AudioQueue {
  private var sources: [AudioSource] = []
  private var player: AVPlayer
  private var observers: [NSObjectProtocol] = []
  private var statusObservation: NSKeyValueObservation?
  private var wasPlayingBeforeAdvance = false

  private weak var audioPlayer: AudioPlayer?

  private(set) var currentIndex: Int = -1 {
    didSet {
      if oldValue != currentIndex {
        self.audioPlayer?.updateStatus(with: [:])
      }
    }
  }

  var currentSource: AudioSource? {
    guard currentIndex >= 0 && currentIndex < sources.count else {
      return nil
    }

    return sources[currentIndex]
  }

  var isEmpty: Bool {
    return sources.isEmpty
  }

  var count: Int {
    return sources.count
  }

  init(player: AVPlayer, audioPlayer: AudioPlayer) {
    self.player = player
    self.audioPlayer = audioPlayer
  }

  deinit {
    cleanup()
  }

  func setQueue(sources: [AudioSource]) {
    cleanup()

    self.sources = sources
    currentIndex = -1

    if !sources.isEmpty {
      advanceToIndex(0)
    }
  }

  func addToQueue(sources: [AudioSource], insertBeforeIndex: Int? = nil) {
    guard !sources.isEmpty else {
      return
    }

    // insertBeforeIndex must be in range 0 to count
    if let index = insertBeforeIndex, index >= 0 && index <= self.sources.count {
      self.sources.insert(contentsOf: sources, at: index)

      if index <= currentIndex {
        currentIndex += sources.count
      }
    } else {
      self.sources.append(contentsOf: sources)
    }

    // set index to 0 if previously reset
    if currentIndex == -1 {
      advanceToIndex(0)
    }
  }

  func removeFromQueue(sources: [AudioSource]) {
    guard !sources.isEmpty else {
      return
    }

    let currentItem = player.currentItem
    let wasPlaying = player.rate != 0

    let urisToRemove = Set(sources.compactMap { $0.uri?.absoluteString })

    let indicesToRemove = self.sources.enumerated()
      .filter { _, source in
        if let uri = source.uri?.absoluteString, urisToRemove.contains(uri) {
          return true
        }

        return false
      }
      .map { index, _ in index }
      // Sort in descending order to remove from end first
      .sorted(by: >)

    for index in indicesToRemove {
      self.sources.remove(at: index)
    }

    // Handle current index adjustments
    if indicesToRemove.contains(currentIndex) || currentIndex >= self.sources.count {
      if self.sources.isEmpty {
        clearQueue()

        return
      }

      if wasPlaying && currentIndex >= self.sources.count {
        let newLastIndex = self.sources.count - 1

        if newLastIndex >= 0 && indicesToRemove.contains(currentIndex) {
          advanceToIndex(newLastIndex)
        } else {
          currentIndex = newLastIndex
        }

        return
      }

      let nextIndex = min(currentIndex, self.sources.count - 1)

      currentIndex = nextIndex

      if indicesToRemove.contains(currentIndex) {
        advanceToIndex(nextIndex)
      }

      return
    }

    // Adjust current index if items were removed before it
    let removedBeforeCurrent = indicesToRemove.filter { $0 < currentIndex }
    if !removedBeforeCurrent.isEmpty {
      currentIndex -= removedBeforeCurrent.count
    }
  }

  func skipToIndex(_ index: Int) {
    guard index >= 0 && index < sources.count else {
      return
    }

    advanceToIndex(index)
  }

  func skipToNext() {
    guard !sources.isEmpty else {
      return
    }

    // Only advance if not at the end of the queue. Will not wrap around.
    if currentIndex < sources.count - 1 {
      skipToIndex(currentIndex + 1)
    }
  }

  func skipToPrevious() {
    guard !sources.isEmpty else {
      return
    }

    // Only go back if not at the beginning of the queue. Will not wrap around.
    if currentIndex > 0 {
      skipToIndex(currentIndex - 1)
    }
  }

  func getCurrentQueue() -> [[String: Any]] {
    return sources.map { source in
      var result: [String: Any] = [:]

      if let uri = source.uri {
        result["uri"] = uri.absoluteString
      }

      if let headers = source.headers {
        result["headers"] = headers
      }

      return result
    }
  }

  func clearQueue() {
    cleanup()
    sources = []
    currentIndex = -1

    player.replaceCurrentItem(with: nil)
  }

  private func advanceToIndex(_ index: Int) {
    guard index >= 0 && index < sources.count else {
      return
    }

    wasPlayingBeforeAdvance = player.rate != 0
    currentIndex = index

    let source = sources[index]
    if let playerItem = AudioUtils.createAVPlayerItem(from: source) {
      player.replaceCurrentItem(with: playerItem)
      setupItemObservation()
    }
  }

  private func setupItemObservation() {
    cleanup()

    statusObservation = player.observe(\.currentItem?.status) { [weak self] player, _ in
      guard
        let self = self,
        let currentItem = player.currentItem,
        currentItem.status == .readyToPlay
      else { return }

      self.setupTrackEndNotification(for: currentItem)

      if self.wasPlayingBeforeAdvance {
        self.player.play()
      }
    }
  }

  private func setupTrackEndNotification(for item: AVPlayerItem) {
    let observer = NotificationCenter.default.addObserver(
      forName: .AVPlayerItemDidPlayToEndTime,
      object: item,
      queue: nil
    ) { [weak self] _ in
      guard let self = self else {
        return
      }

      if self.audioPlayer?.isLooping == true {
        self.player.seek(to: CMTime.zero)
        self.player.play()

        return
      }

      // Move to next track if available
      if self.currentIndex < self.sources.count - 1 {
        self.advanceToIndex(self.currentIndex + 1)

        return
      }
    }

    observers.append(observer)
  }

  private func cleanup() {
    statusObservation?.invalidate()
    statusObservation = nil

    for observer in observers {
      NotificationCenter.default.removeObserver(observer)
    }

    observers.removeAll()
  }
}
