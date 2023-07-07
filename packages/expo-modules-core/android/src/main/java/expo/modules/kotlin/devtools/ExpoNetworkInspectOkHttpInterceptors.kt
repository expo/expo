// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.kotlin.devtools

import android.util.Log
import okhttp3.Interceptor
import okhttp3.Request
import okhttp3.Response

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
        delegate.didReceiveResponse(requestId, request, response)
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
  fun willSendRequest(requestId: String, request: Request, redirectResponse: Response?)

  fun didReceiveResponse(requestId: String, request: Request, response: Response)
}

/**
 * Custom property for redirect requests
 */
internal class RedirectResponse {
  var requestId: String? = null
  var priorResponse: Response? = null
}
