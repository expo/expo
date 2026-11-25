package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.exception.Exceptions
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.suspendCancellableCoroutine

@DoNotStrip
internal fun interface ArrayBufferScopedAccessAsyncCallback {
  @DoNotStrip
  fun invoke(result: Any?, error: Throwable?)
}

@DoNotStrip
internal fun interface ArrayBufferScopedAccessAsyncQueueFailureCallback {
  @DoNotStrip
  fun invoke(error: Throwable)
}

/**
 * A Kotlin representation of an ArrayBuffer with native-owned or native-retained storage.
 * Can be created on any thread and safely returned to JavaScript.
 */
@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class ArrayBuffer : Destructible {
  @DoNotStrip private val mHybridData: HybridData

  @DoNotStrip
  @Suppress("unused")
  private constructor(hybridData: HybridData) {
    mHybridData = hybridData
  }

  constructor(byteBuffer: ByteBuffer) {
    if (!byteBuffer.isDirect) {
      throw Exceptions.IllegalArgument("ArrayBuffers can only be created from direct ByteBuffers")
    }
    mHybridData = initHybrid(byteBuffer)
  }

  private external fun initHybrid(buffer: ByteBuffer): HybridData

  fun isValid() = mHybridData.isValid

  external fun size(): Int

  /**
   * Reads primitive values from the given byte offset.
   *
   * Callers are responsible for ensuring the requested value fits within [size].
   */
  external fun readByte(position: Int): Byte
  external fun read2Byte(position: Int): Short
  external fun read4Byte(position: Int): Int
  external fun read8Byte(position: Int): Long
  external fun readFloat(position: Int): Float
  external fun readDouble(position: Int): Double

  /**
   * Returns a direct [ByteBuffer] for this ArrayBuffer's underlying data.
   *
   * Native-owned `ByteBufferArrayBufferStorage` returns a zero-copy direct buffer.
   * Native-retained typed-array views return an owned copy so the result may outlive this wrapper.
   * JavaScript-backed storage materializes once, may throw on runtime loss, timeout, or bounds
   * failure, and then returns native storage.
   */
  external fun toDirectBuffer(): ByteBuffer

  /**
   * Whether this buffer's visible byte range is backed by native memory that can be accessed
   * directly from native code without touching JavaScript heap memory.
   */
  external fun isNativeBacked(): Boolean

  /**
   * Provides scoped access to this buffer's visible bytes.
   *
   * The [ByteBuffer] passed to [body] is valid only for the duration of [body].
   * The body must not retain it, detach, transfer, or resize the JavaScript backing while it is live.
   * Callers must externally serialize scoped mutable access with `read*`, `data()`,
   * `toDirectBuffer()`, `jsiMutableBuffer()`, or `copy()` on the same instance. Unscoped access
   * to JavaScript-backed storage may throw during first materialization.
   */
  @Throws(Throwable::class)
  fun <R> withJSBytes(body: (ByteBuffer) -> R): R {
    @Suppress("UNCHECKED_CAST")
    return withJSBytes(
      JNIFunctionBody { args ->
        body((args[0] as ByteBuffer).asScopedReadOnlyBuffer())
      }
    ) as R
  }

  @Throws(Throwable::class)
  private external fun withJSBytes(body: JNIFunctionBody): Any?

  /**
   * Provides scoped access to this buffer's visible bytes without blocking the caller while
   * JavaScript-backed storage hops to the JavaScript thread.
   *
   * The [ByteBuffer] passed to [body] is valid only for the duration of [body].
   * The body must not retain it, detach, transfer, or resize the JavaScript backing while it is live.
   * If cancellation occurs before the queued body begins, the body does not run; cancellation after it
   * begins cannot roll it back.
   * Callers must externally serialize scoped mutable access with `read*`, `data()`,
   * `toDirectBuffer()`, `jsiMutableBuffer()`, or `copy()` on the same instance. Unscoped access
   * to JavaScript-backed storage may throw during first materialization.
   */
  @Throws(Throwable::class)
  suspend fun <R> withJSBytesAsync(body: (ByteBuffer) -> R): R {
    if (isNativeBacked()) {
      return withJSBytes(body)
    }
    return withScopedJSBytesAsync(
      schedule = { jniBody, callback, queueFailureCallback ->
        withJSBytesAsync(jniBody, callback, queueFailureCallback)
      },
      body = { buffer -> body(buffer.asScopedReadOnlyBuffer()) }
    )
  }

  private external fun withJSBytesAsync(
    body: JNIFunctionBody,
    callback: ArrayBufferScopedAccessAsyncCallback,
    queueFailureCallback: ArrayBufferScopedAccessAsyncQueueFailureCallback
  )

  /**
   * Provides scoped mutable access to this buffer's visible bytes.
   *
   * The [ByteBuffer] passed to [body] is valid only for the duration of [body].
   * The body must not retain it, detach, transfer, or resize the JavaScript backing while it is live.
   * Callers must externally serialize scoped mutable access with `read*`, `data()`,
   * `toDirectBuffer()`, `jsiMutableBuffer()`, or `copy()` on the same instance. Unscoped access
   * to JavaScript-backed storage may throw during first materialization. JavaScript-backed buffers
   * require real zero-copy access and never fall back to a mutable temporary copy.
   */
  @Throws(Throwable::class)
  fun <R> withMutableJSBytes(body: (ByteBuffer) -> R): R {
    @Suppress("UNCHECKED_CAST")
    return withJSBytes(
      JNIFunctionBody { args ->
        body(args[0] as ByteBuffer)
      }
    ) as R
  }

  /**
   * Provides scoped mutable access to this buffer's visible bytes without blocking the caller while
   * JavaScript-backed storage hops to the JavaScript thread.
   *
   * The [ByteBuffer] passed to [body] is valid only for the duration of [body].
   * The body must not retain it, detach, transfer, or resize the JavaScript backing while it is live.
   * If cancellation occurs before the queued body begins, the body does not run; cancellation after it
   * begins cannot roll it back.
   * Callers must externally serialize scoped mutable access with `read*`, `data()`,
   * `toDirectBuffer()`, `jsiMutableBuffer()`, or `copy()` on the same instance. Unscoped access
   * to JavaScript-backed storage may throw during first materialization. JavaScript-backed buffers
   * require real zero-copy access and never fall back to a mutable temporary copy.
   */
  @Throws(Throwable::class)
  suspend fun <R> withMutableJSBytesAsync(body: (ByteBuffer) -> R): R {
    if (isNativeBacked()) {
      return withMutableJSBytes(body)
    }
    return withScopedJSBytesAsync(
      schedule = { jniBody, callback, queueFailureCallback ->
        withJSBytesAsync(jniBody, callback, queueFailureCallback)
      },
      body = body
    )
  }

  private suspend fun <R> withScopedJSBytesAsync(
    schedule: (
      JNIFunctionBody,
      ArrayBufferScopedAccessAsyncCallback,
      ArrayBufferScopedAccessAsyncQueueFailureCallback
    ) -> Unit,
    body: (ByteBuffer) -> R
  ): R = suspendCancellableCoroutine { continuation ->
    fun resumeException(error: Throwable) {
      continuation.resumeWithException(error)
    }
    val callback = ArrayBufferScopedAccessAsyncCallback { result, error ->
      if (error != null) {
        resumeException(error)
      } else {
        @Suppress("UNCHECKED_CAST")
        continuation.resume(result as R)
      }
    }

    val queueFailureCallback = ArrayBufferScopedAccessAsyncQueueFailureCallback(::resumeException)

    try {
      schedule(
        JNIFunctionBody { args ->
          if (!continuation.isActive) {
            return@JNIFunctionBody null
          }
          body(args[0] as ByteBuffer)
        },
        callback,
        queueFailureCallback
      )
    } catch (error: Throwable) {
      resumeException(error)
    }
  }

  private fun ByteBuffer.asScopedReadOnlyBuffer(): ByteBuffer {
    // ByteBuffer.asReadOnlyBuffer() resets byte order to BIG_ENDIAN, so restore native order.
    return asReadOnlyBuffer().order(ByteOrder.nativeOrder())
  }

  /**
   * Creates a native-owned copy of this ArrayBuffer.
   */
  fun copy(): ArrayBuffer = copyOf(this)

  @Throws(Throwable::class)
  protected fun finalize() {
    mHybridData.resetNative()
  }

  override fun getHybridDataForJNIDeallocator(): HybridData {
    return mHybridData
  }

  companion object {
    /**
     * Allocate a new [ArrayBuffer] with the given [size].
     */
    fun allocate(size: Int): ArrayBuffer {
      val buffer = ByteBuffer.allocateDirect(size)
      return ArrayBuffer(buffer)
    }

    /**
     * Wrap the given [ByteBuffer] in a new **owning** `ArrayBuffer`.
     * The buffer must be direct, otherwise the function throws.
     * Use [ArrayBuffer.copyOf] for non-direct buffers.
     */
    fun wrap(byteBuffer: ByteBuffer): ArrayBuffer =
      ArrayBuffer(byteBuffer.apply { rewind() })

    /**
     * Copy given [ArrayBuffer] into a new native-owned `ArrayBuffer`.
     */
    fun copyOf(other: ArrayBuffer): ArrayBuffer =
      other.withJSBytes<ArrayBuffer> { scopedBytes ->
        copyOf(scopedBytes)
      }

    /**
     * Copy given [JavaScriptArrayBuffer] into a new native-owned `ArrayBuffer`.
     */
    fun copyOf(other: JavaScriptArrayBuffer): ArrayBuffer =
      copyOf(other.toDirectBuffer())

    /**
     * Copy given [NativeArrayBuffer] into a new native-owned `ArrayBuffer`.
     */
    @Suppress("DEPRECATION")
    fun copyOf(other: NativeArrayBuffer): ArrayBuffer =
      copyOf(other.toDirectBuffer())

    fun copyOf(byteBuffer: ByteBuffer): ArrayBuffer {
      val size = byteBuffer.run {
        rewind()
        remaining()
      }
      val newBuffer = ByteBuffer.allocateDirect(size).apply {
        put(byteBuffer)
        rewind()
      }
      byteBuffer.rewind()
      return ArrayBuffer(newBuffer)
    }
  }
}
