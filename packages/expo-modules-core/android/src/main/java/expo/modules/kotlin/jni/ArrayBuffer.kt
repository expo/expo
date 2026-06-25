package expo.modules.kotlin.jni

import com.facebook.jni.HybridData
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.exception.Exceptions
import java.nio.ByteBuffer
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.suspendCancellableCoroutine

enum class ArrayBufferJSBytesAccessPolicy {
  /**
   * Allows scoped read access even if an implementation needs to copy.
   */
  ALLOW_COPY,

  /**
   * Requires the scoped buffer to point at this ArrayBuffer's current backing storage.
   */
  REQUIRE_ZERO_COPY
}

@DoNotStrip
internal fun interface ArrayBufferScopedAccessAsyncCallback {
  @DoNotStrip
  fun invoke(result: Any?, error: Throwable?)
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
   * Returns a direct [ByteBuffer] that wraps this ArrayBuffer's underlying data.
   */
  fun toDirectBuffer(): ByteBuffer = toDirectBuffer(copyBorrowed = false)

  /**
   * Returns a direct [ByteBuffer] for this ArrayBuffer's underlying data.
   * When [copyBorrowed] is true, borrowed storage is copied into a new direct [ByteBuffer].
   */
  external fun toDirectBuffer(copyBorrowed: Boolean): ByteBuffer

  /**
   * Whether this buffer's visible byte range is backed by native memory that can be accessed
   * directly from native code without touching JavaScript heap memory.
   */
  external fun isNativeBacked(): Boolean

  /**
   * Provides scoped access to this buffer's visible bytes.
   *
   * The [ByteBuffer] passed to [body] is valid only for the duration of [body].
   * Do not store it, return it, or access it after [body] returns.
   */
  @Throws(Throwable::class)
  fun <R> withJSBytes(
    policy: ArrayBufferJSBytesAccessPolicy = ArrayBufferJSBytesAccessPolicy.ALLOW_COPY,
    body: (ByteBuffer) -> R
  ): R {
    @Suppress("UNCHECKED_CAST")
    return withJSBytes(policy.ordinal, JNIFunctionBody { args ->
      body(args[0] as ByteBuffer)
    }) as R
  }

  @Throws(Throwable::class)
  private external fun withJSBytes(policy: Int, body: JNIFunctionBody): Any?

  /**
   * Provides scoped access to this buffer's visible bytes without blocking the caller while
   * JavaScript-backed storage hops to the JavaScript thread.
   *
   * The [ByteBuffer] passed to [body] is valid only for the duration of [body].
   * Do not store it, return it, or access it after [body] returns.
   */
  @Throws(Throwable::class)
  suspend fun <R> withJSBytesAsync(
    policy: ArrayBufferJSBytesAccessPolicy = ArrayBufferJSBytesAccessPolicy.ALLOW_COPY,
    body: (ByteBuffer) -> R
  ): R {
    if (isNativeBacked()) {
      return withJSBytes(policy, body)
    }
    return withScopedJSBytesAsync(
      schedule = { jniBody, callback ->
        withJSBytesAsync(policy.ordinal, jniBody, callback)
      },
      body = body
    )
  }

  private external fun withJSBytesAsync(
    policy: Int,
    body: JNIFunctionBody,
    callback: ArrayBufferScopedAccessAsyncCallback
  )

  /**
   * Provides scoped mutable access to this buffer's visible bytes.
   *
   * The [ByteBuffer] passed to [body] is valid only for the duration of [body].
   * Do not store it, return it, or access it after [body] returns. JavaScript-backed
   * buffers require real zero-copy access and never fall back to a mutable temporary copy.
   */
  @Throws(Throwable::class)
  fun <R> withMutableJSBytes(body: (ByteBuffer) -> R): R {
    @Suppress("UNCHECKED_CAST")
    return withMutableJSBytes(JNIFunctionBody { args ->
      body(args[0] as ByteBuffer)
    }) as R
  }

  @Throws(Throwable::class)
  private external fun withMutableJSBytes(body: JNIFunctionBody): Any?

  /**
   * Provides scoped mutable access to this buffer's visible bytes without blocking the caller while
   * JavaScript-backed storage hops to the JavaScript thread.
   *
   * The [ByteBuffer] passed to [body] is valid only for the duration of [body].
   * Do not store it, return it, or access it after [body] returns. JavaScript-backed
   * buffers require real zero-copy access and never fall back to a mutable temporary copy.
   */
  @Throws(Throwable::class)
  suspend fun <R> withMutableJSBytesAsync(body: (ByteBuffer) -> R): R {
    return withJSBytesAsync(ArrayBufferJSBytesAccessPolicy.REQUIRE_ZERO_COPY, body)
  }

  private suspend fun <R> withScopedJSBytesAsync(
    schedule: (JNIFunctionBody, ArrayBufferScopedAccessAsyncCallback) -> Unit,
    body: (ByteBuffer) -> R
  ): R = suspendCancellableCoroutine { continuation ->
    val callback = ArrayBufferScopedAccessAsyncCallback { result, error ->
      if (!continuation.isActive) {
        return@ArrayBufferScopedAccessAsyncCallback
      }
      if (error != null) {
        continuation.resumeWithException(error)
      } else {
        @Suppress("UNCHECKED_CAST")
        continuation.resume(result as R)
      }
    }

    try {
      schedule(
        JNIFunctionBody { args ->
          body(args[0] as ByteBuffer)
        },
        callback
      )
    } catch (error: Throwable) {
      if (continuation.isActive) {
        continuation.resumeWithException(error)
      }
    }
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
      copyOf(other.toDirectBuffer())

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
