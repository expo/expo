package expo.modules.updates.loader

import okio.Buffer
import okio.BufferedSource
import okio.ByteString
import java.io.IOException
import java.util.HashMap
import kotlin.math.max

/**
 * Fork of {@link com.facebook.react.devsupport.MultipartStreamReader} that doesn't necessarily
 * expect a preamble (first boundary is not necessarily preceded by CRLF).
 */
class ExpoMultipartStreamReader(private val source: BufferedSource, private val boundary: String) {
  private var mLastProgressEvent: Long = 0

  interface ChunkListener {
    /** Invoked when a chunk of a multipart response is fully downloaded.  */
    @Throws(IOException::class)
    fun onChunkComplete(headers: Map<String, String>?, body: Buffer, isLastChunk: Boolean)

    /** Invoked as bytes of the current chunk are read.  */
    @Throws(IOException::class)
    fun onChunkProgress(headers: Map<String, String>, loaded: Long, total: Long)
  }

  private fun parseHeaders(data: Buffer): Map<String, String> {
    val headers: MutableMap<String, String> = HashMap()
    val text = data.readUtf8()
    val lines = text.split(CRLF.toRegex()).toTypedArray()
    for (line in lines) {
      val indexOfSeparator = line.indexOf(":")
      if (indexOfSeparator == -1) {
        continue
      }
      val key = line.substring(0, indexOfSeparator).trim { it <= ' ' }
      val value = line.substring(indexOfSeparator + 1).trim { it <= ' ' }
      headers[key] = value
    }
    return headers
  }

  @Throws(IOException::class)
  private fun emitChunk(chunk: Buffer, done: Boolean, listener: ChunkListener) {
    val marker = ByteString.encodeUtf8(CRLF + CRLF)
    val indexOfMarker = chunk.indexOf(marker)
    if (indexOfMarker == -1L) {
      listener.onChunkComplete(null, chunk, done)
    } else {
      val headers = Buffer()
      val body = Buffer()
      chunk.read(headers, indexOfMarker)
      chunk.skip(marker.size().toLong())
      chunk.readAll(body)
      listener.onChunkComplete(parseHeaders(headers), body, done)
    }
  }

  @Throws(IOException::class)
  private fun emitProgress(
    headers: Map<String, String>?, contentLength: Long, isFinal: Boolean, listener: ChunkListener?
  ) {
    if (headers == null || listener == null) {
      return
    }
    val currentTime = System.currentTimeMillis()
    if (currentTime - mLastProgressEvent > 16 || isFinal) {
      mLastProgressEvent = currentTime
      val headersContentLength = if (headers["Content-Length"] != null) headers["Content-Length"]!!
        .toLong() else 0
      listener.onChunkProgress(headers, contentLength, headersContentLength)
    }
  }

  /**
   * Reads all parts of the multipart response and execute the listener for each chunk received.
   *
   * @param listener Listener invoked when chunks are received.
   * @return If the read was successful
   */
  @Throws(IOException::class)
  fun readAllParts(listener: ChunkListener): Boolean {
    val delimiter = ByteString.encodeUtf8("--$boundary$CRLF")
    val closeDelimiter = ByteString.encodeUtf8("$CRLF--$boundary--$CRLF")
    val headersDelimiter = ByteString.encodeUtf8(CRLF + CRLF)

    val bufferLen = 4 * 1024
    var chunkStart: Long = 0
    var bytesSeen: Long = 0
    val content = Buffer()
    var currentHeaders: Map<String, String>? = null
    var currentHeadersLength: Long = 0

    while (true) {
      var isCloseDelimiter = false

      // Search only a subset of chunk that we haven't seen before + few bytes
      // to allow for the edge case when the delimiter is cut by read call.
      val searchStart = max(bytesSeen - closeDelimiter.size(), chunkStart)
      var indexOfDelimiter = content.indexOf(delimiter, searchStart)
      if (indexOfDelimiter == -1L) {
        isCloseDelimiter = true
        indexOfDelimiter = content.indexOf(closeDelimiter, searchStart)
      }

      if (indexOfDelimiter == -1L) {
        bytesSeen = content.size()

        if (currentHeaders == null) {
          val indexOfHeaders = content.indexOf(headersDelimiter, searchStart)
          if (indexOfHeaders >= 0) {
            source.read(content, indexOfHeaders)
            val headers = Buffer()
            content.copyTo(headers, searchStart, indexOfHeaders - searchStart)
            currentHeadersLength = headers.size() + headersDelimiter.size()
            currentHeaders = parseHeaders(headers)
          }
        } else {
          emitProgress(currentHeaders, content.size() - currentHeadersLength, false, listener)
        }

        val bytesRead = source.read(content, bufferLen.toLong())
        if (bytesRead <= 0) {
          return false
        }

        continue
      }

      val chunkEnd = indexOfDelimiter
      val length = chunkEnd - chunkStart

      // Ignore preamble
      if (chunkStart > 0) {
        val chunk = Buffer()
        content.skip(chunkStart)
        content.read(chunk, length)
        emitProgress(currentHeaders, chunk.size() - currentHeadersLength, true, listener)
        emitChunk(chunk, isCloseDelimiter, listener)
        currentHeaders = null
        currentHeadersLength = 0
      } else {
        content.skip(chunkEnd)
      }

      if (isCloseDelimiter) {
        return true
      }

      chunkStart = delimiter.size().toLong()
      bytesSeen = chunkStart
    }
  }

  companion object {
    // Standard line separator for HTTP.
    private const val CRLF = "\r\n"
  }
}