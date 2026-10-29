package expo.modules.blob

import io.github.expo.modules.v2.Enumerable
import io.github.expo.modules.v2.ExpoSharedObject
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Record
import io.github.expo.modules.v2.SharedObject
import io.github.expo.modules.v2.jsi.JavaScriptValue
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import kotlin.math.max
import kotlin.math.min

internal const val DEFAULT_TYPE = ""

@ExpoSharedObject
internal class Blob(val blobParts: List<InternalBlobPart> = listOf(), rawType: String = DEFAULT_TYPE) : SharedObject() {
  @JS
  constructor(blobParts: List<JavaScriptValue>?, options: BlobOptionsBag?) : this(
    blobParts.orEmpty().internal((options ?: BlobOptionsBag()).endings == EndingType.NATIVE),
    (options ?: BlobOptionsBag()).type
  )

  @JS
  val size: Int by lazy {
    blobParts.sumOf { it.size() }
  }

  @JS
  val type = if (validType(rawType)) {
    rawType.lowercase()
  } else {
    DEFAULT_TYPE
  }

  override fun getAdditionalMemoryPressure(): Int {
    return size
  }

  fun bytesToStream(byteStream: ByteArrayOutputStream) {
    for (blobPart in blobParts) {
      blobPart.bytesToStream(byteStream)
    }
  }

  fun bytes(): ByteArray {
    val byteStream = ByteArrayOutputStream(size)
    bytesToStream(byteStream)
    return byteStream.toByteArray()
  }

  @JS("slice")
  fun jsSlice(start: Int?, end: Int?, contentType: String?): Blob {
    var sliceStart: Int = start ?: 0
    var sliceEnd: Int = end ?: size
    if (sliceStart < 0) {
      sliceStart = max(size + sliceStart, 0)
    } else {
      sliceStart = min(sliceStart, size)
    }
    if (sliceEnd < 0) {
      sliceEnd = max(size + sliceEnd, 0)
    } else {
      sliceEnd = min(sliceEnd, size)
    }
    return slice(sliceStart, sliceEnd, contentType ?: "")
  }

  @JS("bytes")
  suspend fun bytesAsync(): ByteArray = withContext(Dispatchers.Default) {
    bytes()
  }

  @JS
  suspend fun text(): String = withContext(Dispatchers.Default) {
    bytes().decodeToString()
  }

  private fun InternalBlobPart.offsetSlice(start: Int, end: Int, offset: Int): InternalBlobPart {
    val startIndex: Int = max(start - offset, 0)
    val endIndex: Int = min(end - offset, size())
    if (startIndex == 0 && endIndex == size()) {
      return this
    }
    return when (this) {
      is InternalBlobPart.StringWrapper -> InternalBlobPart.BufferWrapper(cachedBytes.slice(startIndex..<endIndex).toByteArray())
      is InternalBlobPart.BlobWrapper -> InternalBlobPart.BlobWrapper(blob.slice(startIndex, endIndex, ""))
      is InternalBlobPart.BufferWrapper -> InternalBlobPart.BufferWrapper(buffer.slice(startIndex..<endIndex).toByteArray())
    }
  }

  fun slice(start: Int, end: Int, contentType: String): Blob {
    if (start <= 0 && end >= size) {
      return Blob(blobParts, contentType)
    }
    if (start >= end) {
      return Blob(listOf(), contentType)
    }
    var i = 0
    val bps = mutableListOf<InternalBlobPart>()
    for (blobPart in blobParts) {
      if (i + blobPart.size() <= start) {
        i += blobPart.size()
        continue
      }
      if (i >= end) {
        break
      }
      bps.add(blobPart.offsetSlice(start, end, i))
      i += blobPart.size()
    }

    return Blob(bps, contentType)
  }
}

private fun validType(type: String): Boolean {
  for (char in type) {
    if (char.code < 0x20 || char.code > 0x7E) {
      return false
    }
  }
  return true
}

private fun String.toNativeNewlines(): String {
  val result = StringBuilder(length)
  var prevCR = false
  for (char in this) {
    if (char == '\r') {
      result.append('\n')
      prevCR = true
      continue
    }
    if (!prevCR || char != '\n') {
      result.append(char)
    }
    prevCR = false
  }
  return result.toString()
}

// A blob part is a string, a `Blob` or a typed array. The values belong to JavaScript, so a typed
// array's bytes are copied before the constructor returns.
internal fun List<JavaScriptValue>.internal(nativeNewlines: Boolean): List<InternalBlobPart> {
  return this.map { blobPart: JavaScriptValue ->
    if (blobPart.isString()) {
      blobPart.getString().let {
        val str = if (nativeNewlines) {
          it.toNativeNewlines()
        } else {
          it
        }
        InternalBlobPart.StringWrapper(str)
      }
    } else {
      val obj = blobPart.takeIf { it.isObject() }?.getObject()
        ?: throw InvalidBlobPartException(blobPart.kind())
      val blob = obj.nativeInstance() as? Blob
      if (blob != null) {
        InternalBlobPart.BlobWrapper(blob)
      } else {
        val buffer = obj.getArrayBufferViewBytes()
          ?: throw InvalidBlobPartException(blobPart.kind())
        InternalBlobPart.BufferWrapper(ByteArray(buffer.remaining()).also { buffer.duplicate().get(it) })
      }
    }
  }
}

internal sealed class InternalBlobPart {
  class StringWrapper(string: String) : InternalBlobPart() {
    val cachedBytes: ByteArray by lazy {
      string.toByteArray()
    }
  }

  data class BlobWrapper(val blob: Blob) : InternalBlobPart()
  data class BufferWrapper(val buffer: ByteArray) : InternalBlobPart()

  fun size(): Int {
    return when (this) {
      is StringWrapper -> cachedBytes.size
      is BlobWrapper -> blob.size
      is BufferWrapper -> buffer.size
    }
  }

  fun bytesToStream(byteStream: ByteArrayOutputStream) {
    when (this) {
      is StringWrapper -> byteStream.write(cachedBytes)
      is BlobWrapper -> blob.bytesToStream(byteStream)
      is BufferWrapper -> byteStream.write(buffer)
    }
  }
}

internal enum class EndingType(val str: String) : Enumerable {
  TRANSPARENT("transparent"),
  NATIVE("native")
}

@Record
internal data class BlobOptionsBag(
  val type: String = DEFAULT_TYPE,
  val endings: EndingType = EndingType.TRANSPARENT
)
