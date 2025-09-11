package expo.modules.blob

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.typedarray.TypedArray
import expo.modules.kotlin.types.EitherOfThree
import expo.modules.kotlin.types.Enumerable
import java.io.ByteArrayOutputStream
import kotlin.math.max
import kotlin.math.min

internal const val DEFAULT_TYPE = ""

internal class Blob(val blobParts: List<InternalBlobPart> = listOf(), rawType: String = DEFAULT_TYPE) : SharedObject() {
  val size: Int by lazy {
    blobParts.sumOf { it.size() }
  }

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

internal typealias BlobPart = EitherOfThree<String, Blob, TypedArray>

private fun TypedArray.bytes(): ByteArray {
  val byteArray = ByteArray(this.byteLength)

  for (i in 0..<this.byteLength) {
    byteArray[i] = this.readByte(i)
  }

  return byteArray
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

internal fun List<BlobPart>.internal(nativeNewlines: Boolean): List<InternalBlobPart> {
  return this.map { blobPart: BlobPart ->
    if (blobPart.`is`(String::class)) {
      blobPart.get(String::class).let {
        val str = if (nativeNewlines) {
          it.toNativeNewlines()
        } else {
          it
        }
        InternalBlobPart.StringWrapper(str)
      }
    } else if (blobPart.`is`(Blob::class)) {
      blobPart.get(Blob::class).let {
        InternalBlobPart.BlobWrapper(it)
      }
    } else {
      blobPart.get(TypedArray::class).let {
        InternalBlobPart.BufferWrapper(it.bytes())
      }
    }
  }
}

internal fun makeBlob(blobParts: List<BlobPart>?, options: BlobOptionsBag?): Blob {
  val safeBlobParts = blobParts ?: listOf()
  val safeOptions = options ?: BlobOptionsBag()
  return Blob(safeBlobParts.internal(safeOptions.endings == EndingType.NATIVE), safeOptions.type)
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

internal class BlobOptionsBag : Record {
  @Field
  val type: String = DEFAULT_TYPE

  @Field
  val endings: EndingType = EndingType.TRANSPARENT
}
