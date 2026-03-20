// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.fetch

import expo.modules.kotlin.jni.NativeArrayBuffer
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.nio.ByteBuffer

/**
 * Accumulates small network chunks into larger buffers before flushing.
 * Reduces the number of JS thread dispatches by coalescing multiple small chunks
 * into fewer, larger NativeArrayBuffer emissions.
 *
 * Thread safety: all methods must be called from the same coroutine context
 * (the IO pump loop). The timer job runs in the same CoroutineScope.
 */
internal class ChunkCoalescer(
  private val sizeThreshold: Int = DEFAULT_SIZE_THRESHOLD,
  private val timeoutMs: Long = DEFAULT_TIMEOUT_MS,
  private val coroutineScope: CoroutineScope,
  private val onFlush: (NativeArrayBuffer) -> Unit
) {
  private var buffer: ByteBuffer = ByteBuffer.allocateDirect(sizeThreshold)
  private var timerJob: Job? = null

  /**
   * Append a chunk to the coalescing buffer.
   * If the chunk would overflow the buffer, flushes first.
   * If a single chunk exceeds [sizeThreshold], it is emitted directly without buffering.
   */
  fun append(data: ByteArray) {
    if (data.size > sizeThreshold) {
      // Oversized chunk: flush pending data, then emit this chunk directly
      if (buffer.position() > 0) {
        flushBuffer()
      }
      cancelTimer()
      val directBuffer = ByteBuffer.allocateDirect(data.size)
      directBuffer.put(data)
      onFlush(NativeArrayBuffer.wrap(directBuffer))
      return
    }

    if (buffer.remaining() < data.size) {
      flushBuffer()
    }

    buffer.put(data)
    resetTimer()
  }

  /**
   * Flush any pending data. Call before emitting didComplete or on cancel.
   * Cancels the timer to prevent races.
   */
  fun flush() {
    cancelTimer()
    if (buffer.position() > 0) {
      flushBuffer()
    }
  }

  /**
   * Discard any pending data and cancel the timer.
   */
  fun cancel() {
    cancelTimer()
    buffer.clear()
  }

  private fun flushBuffer() {
    // Slice the buffer to [0..position] and wrap as NativeArrayBuffer
    val size = buffer.position()
    val slice = ByteBuffer.allocateDirect(size)
    buffer.flip()
    slice.put(buffer)
    onFlush(NativeArrayBuffer.wrap(slice))

    // Reset for next batch
    buffer = ByteBuffer.allocateDirect(sizeThreshold)
  }

  private fun resetTimer() {
    timerJob?.cancel()
    timerJob = coroutineScope.launch {
      delay(timeoutMs)
      if (buffer.position() > 0) {
        flushBuffer()
      }
    }
  }

  private fun cancelTimer() {
    timerJob?.cancel()
    timerJob = null
  }

  companion object {
    const val DEFAULT_SIZE_THRESHOLD = 64 * 1024  // 64KB
    const val DEFAULT_TIMEOUT_MS = 16L             // ~1 frame
  }
}
