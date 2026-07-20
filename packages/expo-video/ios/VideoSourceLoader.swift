import AVKit
import ExpoModulesCore

private struct State {
  var isLoading = true
  var currentSource: VideoSource?
  var currentTask: Task<LoadingResult, Error>?
  var currentTaskId = 0
  var isClosed = false
  var listeners = Set<WeakVideoSourceLoaderListener>()
}

private struct LoadContext {
  let task: Task<LoadingResult, Error>
  let taskId: Int
}

private struct PreviousLoad {
  let task: Task<LoadingResult, Error>
  let source: VideoSource?
}

internal class VideoSourceLoader {
  private let state = Mutex(State())

  var isLoading: Bool {
    return state.withLock { $0.isLoading }
  }

  func registerListener(listener: VideoSourceLoaderListener) {
    let weakListener = WeakVideoSourceLoaderListener(value: listener)
    state.withLock { state in
      // Purging dead listeners is required for correctness, not just hygiene: a wrapper keeps its
      // `ObjectIdentifier` after its listener deallocates, and a new listener allocated at the same
      // address would compare equal to the stale wrapper, making `insert` silently drop it.
      state.listeners = state.listeners.filter { $0.value != nil }
      state.listeners.insert(weakListener)
    }
  }

  func unregisterListener(listener: VideoSourceLoaderListener) {
    state.withLock { state in
      state.listeners.remove(WeakVideoSourceLoaderListener(value: listener))
    }
  }

  /**
   Asynchronously loads a video item from the provided `videoSource`. If another loading operation is in progress, it will be cancelled.

   - Parameter videoSource: The source description for the video to load. If `nil`, the current player item will be cleared.
   */
  func load(videoSource: VideoSource) async throws -> VideoPlayerItem? {
    let loadContext: (LoadContext, PreviousLoad?)? = state.withLock { state in
      guard !state.isClosed else {
        return nil
      }

      let previousLoad: PreviousLoad?
      if let currentTask = state.currentTask {
        previousLoad = PreviousLoad(task: currentTask, source: state.currentSource)
      } else {
        previousLoad = nil
      }

      state.currentTaskId += 1
      let taskId = state.currentTaskId
      let newTask = Task {
        return try await self.loadImpl(videoSource: videoSource)
      }

      state.isLoading = true
      state.currentTask = newTask
      state.currentSource = videoSource

      if let previousLoad {
        enqueueListenerEventWhileLocked(listeners: state.listeners) { listener, loader in
          listener.onLoadingCancelled(loader: loader, videoSource: previousLoad.source)
        }
      }
      enqueueListenerEventWhileLocked(listeners: state.listeners) { listener, loader in
        listener.onLoadingStarted(loader: loader, videoSource: videoSource)
      }

      return (LoadContext(task: newTask, taskId: taskId), previousLoad)
    }

    guard let (context, previousLoad) = loadContext else {
      return nil
    }

    previousLoad?.task.cancel()

    let loadingResult: LoadingResult
    do {
      loadingResult = try await context.task.value
    } catch {
      finishLoading(taskId: context.taskId, videoSource: videoSource)
      throw error
    }

    guard finishLoading(
      taskId: context.taskId,
      videoSource: videoSource,
      loadingResult: loadingResult
    ) else {
      return nil
    }

    return loadingResult.value
  }

  func cancelCurrentTask() {
    cancelCurrentTask(close: false)
  }

  func close() {
    cancelCurrentTask(close: true)
  }

  deinit {
    cancelCurrentTask()
  }

  private func loadImpl(videoSource: VideoSource) async throws -> LoadingResult {
    do {
      try Task.checkCancellation()

      guard let url = videoSource.uri else {
        return LoadingResult(value: nil, isCancelled: false)
      }

      let safeUrl = try await url.toUrlWithPermissions()
      let playerItem = try await VideoPlayerItem(videoSource: videoSource, urlOverride: safeUrl)

      try Task.checkCancellation()
      return LoadingResult(value: playerItem, isCancelled: false)
    } catch is CancellationError {
      return LoadingResult(value: nil, isCancelled: true)
    }
  }

  /**
   Resets the loading state if `taskId` is still the current load.

   - Returns: Whether the caller's load is still the current one and its result should be used.
   */
  @discardableResult
  private func finishLoading(
    taskId: Int,
    videoSource: VideoSource? = nil,
    loadingResult: LoadingResult? = nil
  ) -> Bool {
    return state.withLock { state in
      guard state.currentTaskId == taskId else {
        return false
      }
      state.isLoading = false
      state.currentSource = nil
      state.currentTask = nil

      if let videoSource, let loadingResult, !loadingResult.isCancelled {
        enqueueListenerEventWhileLocked(listeners: state.listeners) { listener, loader in
          listener.onLoadingFinished(loader: loader, videoSource: videoSource, result: loadingResult.value)
        }
      } else {
        enqueueListenerEventWhileLocked(listeners: state.listeners) { listener, loader in
          listener.onLoadingCancelled(loader: loader, videoSource: videoSource)
        }
      }
      return true
    }
  }

  private func cancelCurrentTask(close: Bool) {
    let currentTask = state.withLock { state in
      state.currentTaskId += 1
      state.isClosed = state.isClosed || close
      state.isLoading = false
      let currentSource = state.currentSource
      state.currentSource = nil
      let currentTask = state.currentTask
      state.currentTask = nil

      // Only notify when a load was actually in flight. Skipping the enqueue otherwise also keeps
      // `deinit` (reachable only with no pending task, which retains `self`) from forming a weak
      // reference to a deinitializing object in `enqueueListenerEventWhileLocked`.
      if currentTask != nil {
        enqueueListenerEventWhileLocked(listeners: state.listeners) { listener, loader in
          listener.onLoadingCancelled(loader: loader, videoSource: currentSource)
        }
      }
      return currentTask
    }
    currentTask?.cancel()
  }

  /**
   Must be called while holding `state` so listener events are enqueued in state transition order.
   */
  private func enqueueListenerEventWhileLocked(
    listeners: Set<WeakVideoSourceLoaderListener>,
    event: @escaping (VideoSourceLoaderListener, VideoSourceLoader) -> Void
  ) {
    DispatchQueue.main.async { [weak self] in
      guard let self else {
        return
      }
      for weakListener in listeners {
        guard let listener = weakListener.value else {
          continue
        }
        event(listener, self)
      }
    }
  }
}

private struct LoadingResult {
  let value: VideoPlayerItem?
  let isCancelled: Bool
}
