// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.kotlin.devtools

import android.util.Log
import okhttp3.Interceptor
import okhttp3.Request
import okhttp3.Response
import okhttp3.ResponseBody
import okhttp3.ResponseBody.Companion.asResponseBody
import okio.GzipSource
import okio.buffer
import java.io.IOException

private const val TAG = "ExpoNetworkInspector"

// Currently keeps the delegate fixed for ExpoRequestCdpInterceptor and be thread-safe
internal val delegate: ExpoNetworkInspectOkHttpInterceptorsDelegate = ExpoRequestCdpInterceptor

/**
 * The OkHttp network interceptor to log requests and the CDP events to the delegate
 */
@Suppress("unused")
class ExpoNetworkInspectOkHttpNetworkInterceptor : Interceptor {
  override fun intercept(chain: Interceptor.Chain): Response {
    val request = chain.request()
    val response = chain.proceed(request)
    try {
      val redirectResponse = request.tag(RedirectResponse::class.java)
      val requestId = redirectResponse?.requestId ?: request.hashCode().toString()
      delegate.willSendRequest(requestId, request, redirectResponse?.priorResponse)

      if (response.isRedirect) {
        response.request.tag(RedirectResponse::class.java)?.let {
          it.requestId = requestId
          it.priorResponse = response
        }
      } else {
        val body = peekResponseBody(response)
        delegate.didReceiveResponse(requestId, request, response, body)
        body?.close()
      }
    } catch (e: Exception) {
      Log.e(TAG, "Failed to send network request CDP event", e)
    }
    return response
  }

  companion object {
    const val MAX_BODY_SIZE = 1048576L
  }
}

/**
 * The OkHttp app interceptor to add custom tag for [RedirectResponse]
 */
@Suppress("unused")
class ExpoNetworkInspectOkHttpAppInterceptor : Interceptor {
  override fun intercept(chain: Interceptor.Chain): Response {
    return chain.proceed(
      chain.request().newBuilder()
        .tag(RedirectResponse::class.java, RedirectResponse())
        .build()
    )
  }
}

/**
 * The delegate to dispatch network request events
 */
internal interface ExpoNetworkInspectOkHttpInterceptorsDelegate {
  fun willSendRequest(
    requestId: String,
    request: Request,
    redirectResponse: Response?
  )

  fun didReceiveResponse(
    requestId: String,
    request: Request,
    response: Response,
    body: ResponseBody?
  )
}

/**
 * Custom property for redirect requests
 */
internal class RedirectResponse {
  var requestId: String? = null
  var priorResponse: Response? = null
}

/**
 * Peek response body that could send to CDP delegate.
 * Also uncompress gzip payload if necessary since OkHttp [Interceptor] does not uncompress payload for you.
 * @return null if the response body exceeds [byteCount]
 */
internal fun peekResponseBody(
  response: Response,
  byteCount: Long = ExpoNetworkInspectOkHttpNetworkInterceptor.MAX_BODY_SIZE
): ResponseBody? {
  val body = response.body ?: return null
  val peeked = body.source().peek()
  try {
    if (peeked.request(byteCount + 1)) {
      // When the request() returns true,
      // it means the source have more available bytes then [byteCount].
      return null
    }
  } catch (_: IOException) {}

  val encoding = response.header("Content-Encoding")
  val source = when {
    encoding.equals("gzip", ignoreCase = true) ->
      GzipSource(peeked).buffer().apply {
        request(byteCount)
      }
    else -> peeked
  }

  val buffer = okio.Buffer()
  buffer.write(source, minOf(byteCount, source.buffer.size))
  return buffer.asResponseBody(body.contentType(), buffer.size)
}
