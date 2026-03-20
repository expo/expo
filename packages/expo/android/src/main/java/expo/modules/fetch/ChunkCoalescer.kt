// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.fetch

import expo.modules.kotlin.jni.NativeArrayBuffer
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.nio.ByteBuffer
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock

/**
 * Accumulates small network chunks into larger buffers before flushing.
 * Reduces the number of JS thread dispatches by coalescing multiple small chunks
 * into fewer, larger NativeArrayBuffer emissions.
 *
 * Thread safety: all mutable state is protected by [lock]. The [onFlush] callback
 * is always called outside the lock to avoid holding it during JS thread dispatch.
 */
internal class ChunkCoalescer(
  private val sizeThreshold: Int = DEFAULT_SIZE_THRESHOLD,
  private val timeoutMs: Long = DEFAULT_TIMEOUT_MS,
  private val coroutineScope: CoroutineScope,
  private val onFlush: (NativeArrayBuffer) -> Unit
) {
  private var buffer: ByteBuffer = ByteBuffer.allocateDirect(sizeThreshold)
  private var timerJob: Job? = null
  private val lock = ReentrantLock()

  /**
   * Append a chunk to the coalescing buffer.
   * If the chunk would overflow the buffer, flushes first.
   * If a single chunk exceeds [sizeThreshold], it is emitted directly without buffering.
   */
  fun append(data: ByteArray) {
    if (data.size > sizeThreshold) {
      // Oversized chunk: flush pending data, then emit this chunk directly
      val pending = lock.withLock {
        cancelTimerLocked()
        flushBufferLocked()
      }
      pending?.let { onFlush(it) }
      val directBuffer = ByteBuffer.allocateDirect(data.size)
      directBuffer.put(data)
      onFlush(NativeArrayBuffer.wrap(directBuffer))
      return
    }

    val pending = lock.withLock {
      if (buffer.remaining() < data.size) {
        val flushed = flushBufferLocked()
        buffer.put(data)
        resetTimerLocked()
        flushed
      } else {
        buffer.put(data)
        resetTimerLocked()
        null
      }
    }
    pending?.let { onFlush(it) }
  }

  /**
   * Flush any pending data. Call before emitting didComplete or on cancel.
   * Cancels the timer to prevent races.
   */
  fun flush() {
    val pending = lock.withLock {
      cancelTimerLocked()
      flushBufferLocked()
    }
    pending?.let { onFlush(it) }
  }

  /**
   * Discard any pending data and cancel the timer.
   */
  fun cancel() {
    lock.withLock {
      cancelTimerLocked()
      buffer.clear()
    }
  }

  // All *Locked methods must be called with lock held.

  private fun flushBufferLocked(): NativeArrayBuffer? {
    val size = buffer.position()
    if (size == 0) return null

    val slice = ByteBuffer.allocateDirect(size)
    buffer.flip()
    slice.put(buffer)
    buffer = ByteBuffer.allocateDirect(sizeThreshold)
    return NativeArrayBuffer.wrap(slice)
  }

  private fun resetTimerLocked() {
    timerJob?.cancel()
    timerJob = coroutineScope.launch {
      delay(timeoutMs)
      val pending = lock.withLock {
        flushBufferLocked()
      }
      pending?.let { onFlush(it) }
    }
  }

  private fun cancelTimerLocked() {
    timerJob?.cancel()
    timerJob = null
  }

  companion object {
    const val DEFAULT_SIZE_THRESHOLD = 64 * 1024  // 64KB
    const val DEFAULT_TIMEOUT_MS = 16L             // ~1 frame
  }
}
