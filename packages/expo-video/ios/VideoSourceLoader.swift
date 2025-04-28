import AVKit

internal class VideoSourceLoader {
  private(set) var isLoading: Bool = true
  private var currentTask: Task<VideoPlayerItem?, Error>?

  /**
   Asynchronously loads a video item from the provided `videoSource`. If another loading operation is in progress, it will be cancelled.

   - Parameter videoSource: The source description for the video to load. If `nil`, the current player item will be cleared.
   - Parameter player: The `VideoPlayer` instance whose current item will be replaced.
   */
  func load(videoSource: VideoSource) async throws -> VideoPlayerItem? {
    isLoading = true
    currentTask?.cancel()

    let newTask = Task {
      return try await loadImpl(videoSource: videoSource)
    }

    self.currentTask = newTask
    let result = try await newTask.value
    isLoading = false
    return result
  }

  func cancelCurrentTask() {
    currentTask?.cancel()
    currentTask = nil
    isLoading = false
  }

  deinit {
    cancelCurrentTask()
  }

  private func loadImpl(videoSource: VideoSource) async throws -> VideoPlayerItem? {
    guard
      let url = videoSource.uri
    else {
      return nil
    }

    let playerItem = try await VideoPlayerItem(videoSource: videoSource)

    if Task.isCancelled {
      print("The loading task has been cancelled")
      return nil
    }

    return playerItem
  }
}
