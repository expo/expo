import Foundation

/**
 Runs the font loads one at a time on a serial dispatch queue. Each load reads and then replaces the process-wide
 alias registry and CoreText registrations, so loads must not overlap. A load also reads font files, so it doesn't
 run on the JavaScript thread or the cooperative thread pool.
 */
@globalActor
internal actor FontLoaderActor {
  static let shared = FontLoaderActor()

  private nonisolated let executor = FontLoaderExecutor(
    queue: DispatchQueue(label: "expo.modules.font.loader", qos: .userInitiated)
  )

  nonisolated var unownedExecutor: UnownedSerialExecutor {
    executor.asUnownedSerialExecutor()
  }
}

private final class FontLoaderExecutor: SerialExecutor {
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
