// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation

/**
 Global actor for video source and track loading.

 Creating `AVURLAsset`/`AVPlayerItem` and parsing tracks costs 10-20ms+ and must never run on
 the main thread. Tasks on the default (global) executor are not enough to guarantee that:
 the runtime is free to run even a detached task's job on the main thread.
 The loading pipeline should always run on this actor.
 */
@globalActor
internal actor VideoLoadingActor {
  static let shared = VideoLoadingActor()

  private nonisolated let executor = DispatchQueueSerialExecutor(
    queue: DispatchQueue(label: "expo.video.loading", qos: .userInitiated)
  )

  nonisolated var unownedExecutor: UnownedSerialExecutor {
    executor.asUnownedSerialExecutor()
  }
}

/**
 Executor, which never executes on the main thread
 */
internal final class DispatchQueueSerialExecutor: SerialExecutor {
  private let queue: DispatchQueue

  init(queue: DispatchQueue) {
    self.queue = queue
  }

  func enqueue(_ job: UnownedJob) {
    queue.async {
      job.runSynchronously(on: self.asUnownedSerialExecutor())
    }
  }

  func asUnownedSerialExecutor() -> UnownedSerialExecutor {
    UnownedSerialExecutor(ordinary: self)
  }
}
