// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 Accumulates small network chunks into larger buffers before flushing.
 Reduces the number of JS thread dispatches by coalescing multiple small chunks
 into fewer, larger ArrayBuffer emissions.

 Thread safety: uses an internal lock. The timer fires on the provided DispatchQueue.
 */
internal final class ChunkCoalescer: @unchecked Sendable {
  static let defaultSizeThreshold = 64 * 1024  // 64KB
  static let defaultTimeoutMs = 16              // ~1 frame

  private let sizeThreshold: Int
  private let timeoutMs: Int
  private let dispatchQueue: DispatchQueue
  private let onFlush: (ArrayBuffer) -> Void

  private var buffer = Data()
  private var timerWorkItem: DispatchWorkItem?
  private let lock = NSLock()

  init(
    sizeThreshold: Int = ChunkCoalescer.defaultSizeThreshold,
    timeoutMs: Int = ChunkCoalescer.defaultTimeoutMs,
    dispatchQueue: DispatchQueue,
    onFlush: @escaping (ArrayBuffer) -> Void
  ) {
    self.sizeThreshold = sizeThreshold
    self.timeoutMs = timeoutMs
    self.dispatchQueue = dispatchQueue
    self.onFlush = onFlush
  }

  /// Append a chunk to the coalescing buffer.
  /// If the chunk would overflow the buffer, flushes first.
  /// If a single chunk exceeds sizeThreshold, it is emitted directly.
  func append(data: Data) {
    lock.lock()

    if data.count > sizeThreshold {
      // Oversized chunk: flush pending, then emit directly
      let pending = flushBufferLocked()
      cancelTimerLocked()
      lock.unlock()

      if let pending {
        onFlush(pending)
      }
      onFlush(ArrayBuffer.wrap(dataWithoutCopy: data))
      return
    }

    if buffer.count + data.count > sizeThreshold {
      let pending = flushBufferLocked()
      lock.unlock()
      if let pending {
        onFlush(pending)
      }
      lock.lock()
    }

    buffer.append(data)
    resetTimerLocked()
    lock.unlock()
  }

  /// Flush any pending data. Call before emitting didComplete or on cancel.
  func flush() {
    lock.lock()
    cancelTimerLocked()
    let pending = flushBufferLocked()
    lock.unlock()

    if let pending {
      onFlush(pending)
    }
  }

  /// Discard any pending data and cancel the timer.
  func cancel() {
    lock.lock()
    cancelTimerLocked()
    buffer.removeAll()
    lock.unlock()
  }

  // MARK: - Private (must be called with lock held)

  /// Returns an ArrayBuffer wrapping the current buffer, or nil if empty.
  private func flushBufferLocked() -> ArrayBuffer? {
    guard !buffer.isEmpty else {
      return nil
    }
    let data = buffer
    buffer = Data()
    return ArrayBuffer.wrap(dataWithoutCopy: data)
  }

  private func resetTimerLocked() {
    timerWorkItem?.cancel()
    let workItem = DispatchWorkItem { [weak self] in
      self?.timerFired()
    }
    timerWorkItem = workItem
    dispatchQueue.asyncAfter(
      deadline: .now() + .milliseconds(timeoutMs),
      execute: workItem
    )
  }

  private func cancelTimerLocked() {
    timerWorkItem?.cancel()
    timerWorkItem = nil
  }

  private func timerFired() {
    lock.lock()
    let pending = flushBufferLocked()
    lock.unlock()

    if let pending {
      onFlush(pending)
    }
  }
}
