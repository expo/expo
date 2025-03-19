import Foundation
import AVFoundation
import ExpoModulesCore

class AudioQueue {
    private var sources: [AudioSource] = []
    private(set) var currentIndex: Int = -1
    private var player: AVPlayer
    private var observers: [NSObjectProtocol] = []
    private var statusObservation: NSKeyValueObservation?
    private var wasPlayingBeforeAdvance = false

    var onQueueChanged: (([String: Any]) -> [String: Any]?)?

    var currentSource: AudioSource? {
        guard currentIndex >= 0 && currentIndex < sources.count else { return nil }

        return sources[currentIndex]
    }

    var isEmpty: Bool {
        return sources.isEmpty
    }

    var count: Int {
        return sources.count
    }

    init(player: AVPlayer) {
        self.player = player
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

        let queueInfo: [String: Any] = ["queue": getCurrentQueue()]
        _ = onQueueChanged?(queueInfo)
    }

    func addToQueue(sources: [AudioSource], insertBeforeIndex: Int? = nil) {
        guard !sources.isEmpty else { return }

        // insertBeforeIndex must be in range 0 to count
        if let index = insertBeforeIndex, index >= 0 && index <= self.sources.count {
            self.sources.insert(contentsOf: sources, at: index)

            if index <= currentIndex {
                currentIndex += sources.count
            }
        } else {
            self.sources.append(contentsOf: sources)
        }

        // If this is the first item, set it as current
        if self.sources.count == sources.count {
            advanceToIndex(0)
        }

        let queueInfo: [String: Any] = ["queue": getCurrentQueue()]
        _ = onQueueChanged?(queueInfo)
    }

    func removeFromQueue(sources: [AudioSource]) {
        guard !sources.isEmpty else { return }

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
                currentIndex = -1
                player.pause()
                return
            }

            // If current track was removed, play the next track or the first track
            let nextIndex = min(currentIndex, self.sources.count - 1)
            advanceToIndex(nextIndex)
            return
        }

        // Adjust current index if items were removed before it
        let removedBeforeCurrent = indicesToRemove.filter { $0 < currentIndex }
        if !removedBeforeCurrent.isEmpty {
            currentIndex -= removedBeforeCurrent.count
        }
    }

    func skipToIndex(_ index: Int) {
        guard index >= 0 && index < sources.count else { return }

        advanceToIndex(index)
    }

    func skipToNext() {
        guard !sources.isEmpty else { return }

        // Only advance if not at the end of the queue. Will not wrap around.
        if currentIndex < sources.count - 1 {
            skipToIndex(currentIndex + 1)
        }
    }

    func skipToPrevious() {
        guard !sources.isEmpty else { return }

        // Only go back if not at the beginning of the queue. Will not wrap around.
        if currentIndex > 0 {
            skipToIndex(currentIndex - 1)
        }
    }

    func getCurrentQueue() -> [[String: Any]] {
        return sources.enumerated().map { _, source in
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

    private func advanceToIndex(_ index: Int) {
        guard index >= 0 && index < sources.count else { return }

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
            guard let self = self,
                  let currentItem = player.currentItem,
                  currentItem.status == .readyToPlay else { return }

            self.setupTrackEndNotification(for: currentItem)

            if self.wasPlayingBeforeAdvance {
                self.player.play()
            }

            self.notifyQueueChanged()
        }
    }

    private func setupTrackEndNotification(for item: AVPlayerItem) {
        let observer = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: item,
            queue: nil
        ) { [weak self] _ in
            guard let self = self else { return }

            // Check if we should loop the current track
             if let onQueueChanged = self.onQueueChanged {
                let response = onQueueChanged(["queryLooping": true])
                 let isLooping = (response)?["isLooping"] as? Bool ?? false

                if isLooping {
                    self.player.seek(to: CMTime.zero)
                    self.player.play()
                    return
                }
            }

            // Move to next track if available
            if self.currentIndex < self.sources.count - 1 {
                self.advanceToIndex(self.currentIndex + 1)
                return
            }

            // Notify that playback finished
            self.notifyQueueChanged(additionalInfo: [
                "isPlaying": false,
                "didJustFinish": true
            ])
        }

        observers.append(observer)
    }

    private func cleanup() {
        // Remove all observers
        statusObservation?.invalidate()
        statusObservation = nil

        for observer in observers {
            NotificationCenter.default.removeObserver(observer)
        }
        observers.removeAll()
    }

    private func notifyQueueChanged(additionalInfo: [String: Any] = [:]) {
        guard let onQueueChanged = onQueueChanged else { return }

        var info: [String: Any] = [
            "currentQueueIndex": currentIndex,
            "queueSize": sources.count
        ]

         info.merge(additionalInfo) { _, new in new }
        _ = onQueueChanged(info)
    }
}
