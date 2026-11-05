// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.kotlin.devtools

import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.modules.network.InspectorNetworkReporter
import okhttp3.Headers
import okhttp3.Interceptor
import okhttp3.MediaType
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.Response
import okhttp3.ResponseBody
import okio.Buffer
import okio.BufferedSource
import okio.ForwardingSource
import okio.Source
import okio.buffer
import java.io.IOException
import java.util.UUID

/**
 * The React Native DevTools request id of an OkHttp request, set as a request tag. An id created
 * from JS with `__NETWORK_REPORTER__.createDevToolsRequestId()` makes DevTools show that JS call
 * stack as the request's initiator.
 */
class DevToolsRequestId(val value: String)

/**
 * An OkHttp application interceptor that reports each request to React Native's core network
 * reporter (`InspectorNetworkReporter`), which backs the React Native DevTools Network panel and
 * the Web Performance APIs. For networking stacks that bypass React Native's `NetworkingModule`.
 *
 * A request tagged with [DevToolsRequestId] is reported under that id. Requests reported here are
 * skipped by Expo's network inspector, so they reach DevTools once.
 */
class ExpoNetworkReporter internal constructor(
  private val sink: Sink
) : Interceptor {
  constructor() : this(InspectorSink)

  override fun intercept(chain: Interceptor.Chain): Response {
    val request = chain.request().newBuilder().tag(Reported::class.java, Reported).build()
    val requestId = request.tag(DevToolsRequestId::class.java)?.value ?: UUID.randomUUID().toString()

    sink.reportRequestStart(requestId, request)
    val response = try {
      chain.proceed(request)
    } catch (e: IOException) {
      sink.reportRequestFailed(requestId, cancelled = chain.call().isCanceled())
      throw e
    }
    sink.reportResponseStart(requestId, response)

    val body = response.body
    if (body == null || body.contentLength() == 0L) {
      sink.reportResponseEnd(requestId, encodedDataLength = 0, body = null)
      return response
    }
    return response.newBuilder()
      .body(ReportingResponseBody(body, requestId, sink))
      .build()
  }

  /**
   * The calls into `InspectorNetworkReporter`, so tests can record them without React Native's
   * native library.
   */
  internal interface Sink {
    fun reportRequestStart(requestId: String, request: Request)
    fun reportResponseStart(requestId: String, response: Response)
    fun reportDataReceived(requestId: String, dataLength: Int)
    fun reportResponseEnd(requestId: String, encodedDataLength: Long, body: StoredBody?)
    fun reportRequestFailed(requestId: String, cancelled: Boolean)

    /** Whether to keep response bodies for the Network panel. */
    val storesResponseBodies: Boolean
  }

  /** A response body kept for the Network panel, as text or as base64. */
  internal class StoredBody(val data: String, val base64Encoded: Boolean)

  private object Reported

  @OptIn(UnstableReactNativeAPI::class)
  private object InspectorSink : Sink {
    override fun reportRequestStart(requestId: String, request: Request) {
      val headers = request.headers.toMap()
      InspectorNetworkReporter.reportRequestStart(
        requestId,
        request.url.toString(),
        request.method,
        headers,
        requestBodyPreview(request.body),
        0
      )
      InspectorNetworkReporter.reportConnectionTiming(requestId, headers)
    }

    override fun reportResponseStart(requestId: String, response: Response) {
      InspectorNetworkReporter.reportResponseStart(
        requestId,
        response.request.url.toString(),
        response.code,
        response.headers.toMap(),
        response.body?.contentLength() ?: -1
      )
    }

    override fun reportDataReceived(requestId: String, dataLength: Int) {
      if (InspectorNetworkReporter.isDebuggingEnabled()) {
        InspectorNetworkReporter.reportDataReceivedImpl(requestId, dataLength)
      }
    }

    override fun reportResponseEnd(requestId: String, encodedDataLength: Long, body: StoredBody?) {
      if (body != null) {
        if (body.base64Encoded) {
          InspectorNetworkReporter.maybeStoreResponseBody(requestId, body.data, true)
        } else {
          // Flushed to the reporter by `reportResponseEnd`.
          InspectorNetworkReporter.maybeStoreResponseBodyIncremental(requestId, body.data)
        }
      }
      InspectorNetworkReporter.reportResponseEnd(requestId, encodedDataLength)
    }

    override fun reportRequestFailed(requestId: String, cancelled: Boolean) {
      InspectorNetworkReporter.reportRequestFailed(requestId, cancelled)
    }

    override val storesResponseBodies: Boolean
      get() = InspectorNetworkReporter.isDebuggingEnabled()
  }

  companion object {
    /** The largest response or request body kept for the Network panel, in bytes. */
    const val MAX_BODY_SIZE = 1_048_576L

    /** Whether [request] is reported by an [ExpoNetworkReporter] in its client. */
    fun isReported(request: Request): Boolean = request.tag(Reported::class.java) != null

    internal fun isTextContentType(mediaType: MediaType?): Boolean {
      if (mediaType == null) {
        return false
      }
      if (mediaType.type == "text") {
        return true
      }
      return mediaType.type == "application" && (
        mediaType.subtype in textApplicationSubtypes || mediaType.subtype.endsWith("+json") || mediaType.subtype.endsWith("+xml")
        )
    }

    private val textApplicationSubtypes = setOf("json", "xml", "javascript", "x-www-form-urlencoded")

    private fun Headers.toMap(): Map<String, String> {
      val map = mutableMapOf<String, String>()
      for (index in 0 until size) {
        val name = name(index)
        val previous = map[name]
        map[name] = if (previous == null) value(index) else "$previous, ${value(index)}"
      }
      return map
    }

    private fun requestBodyPreview(body: RequestBody?): String {
      if (body == null || body.isOneShot() || body.isDuplex()) {
        return ""
      }
      val length = body.contentLength()
      if (length < 0 || length > MAX_BODY_SIZE || !isTextContentType(body.contentType())) {
        return ""
      }
      return try {
        Buffer().also(body::writeTo).readUtf8()
      } catch (e: IOException) {
        ""
      }
    }
  }
}

/**
 * Reports the bytes read from a response body, and its end once the body is exhausted or closed.
 */
private class ReportingResponseBody(
  private val delegate: ResponseBody,
  private val requestId: String,
  private val sink: ExpoNetworkReporter.Sink
) : ResponseBody() {
  private val source = ReportingSource(delegate.source()).buffer()

  override fun contentType(): MediaType? = delegate.contentType()

  override fun contentLength(): Long = delegate.contentLength()

  override fun source(): BufferedSource = source

  private inner class ReportingSource(source: Source) : ForwardingSource(source) {
    private var bytesRead = 0L
    private var finished = false
    private val stored = Buffer()
    private var storedExceedsLimit = !sink.storesResponseBodies

    override fun read(buffer: Buffer, byteCount: Long): Long {
      val read = try {
        super.read(buffer, byteCount)
      } catch (e: IOException) {
        fail(cancelled = e.message == "Canceled")
        throw e
      }
      if (read == -1L) {
        finish()
        return read
      }
      bytesRead += read
      sink.reportDataReceived(requestId, read.toInt())
      if (!storedExceedsLimit) {
        if (stored.size + read <= ExpoNetworkReporter.MAX_BODY_SIZE) {
          buffer.copyTo(stored, buffer.size - read, read)
        } else {
          storedExceedsLimit = true
          stored.clear()
        }
      }
      return read
    }

    override fun close() {
      finish()
      super.close()
    }

    private fun finish() {
      if (finished) {
        return
      }
      finished = true
      val body = if (storedExceedsLimit || stored.size == 0L) {
        null
      } else if (ExpoNetworkReporter.isTextContentType(this@ReportingResponseBody.delegate.contentType())) {
        ExpoNetworkReporter.StoredBody(stored.readUtf8(), base64Encoded = false)
      } else {
        ExpoNetworkReporter.StoredBody(stored.readByteString().base64(), base64Encoded = true)
      }
      sink.reportResponseEnd(requestId, bytesRead, body)
    }

    private fun fail(cancelled: Boolean) {
      if (finished) {
        return
      }
      finished = true
      stored.clear()
      sink.reportRequestFailed(requestId, cancelled)
    }
  }
}
