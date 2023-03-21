package expo.modules.devlauncher.network

import okhttp3.Interceptor
import okhttp3.Response

/**
 * The OkHttp network interceptor to log requests and the CDP events to [DevLauncherNetworkLogger]
 */
@Suppress("unused")
class DevLauncherOkHttpNetworkInterceptor : Interceptor {
  override fun intercept(chain: Interceptor.Chain): Response {
    if (!DevLauncherNetworkLogger.instance.shouldEmitEvents()) {
      return chain.proceed(chain.request());
    }
    val request = chain.request()
    val redirectResponse = request.tag(RedirectResponse::class.java)
    val requestId = redirectResponse?.requestId ?: request.hashCode().toString()
    DevLauncherNetworkLogger.instance.emitNetworkWillBeSent(request, requestId, redirectResponse?.priorResponse)

    val response = chain.proceed(request)

    if (response.isRedirect) {
      response.request().tag(RedirectResponse::class.java)?.let {
        it.requestId = requestId
        it.priorResponse = response
      }
    } else {
      DevLauncherNetworkLogger.instance.emitNetworkResponse(request, requestId, response)
      DevLauncherNetworkLogger.instance.emitNetworkDidReceiveBody(requestId, response)
    }
    return response
  }
}

/**
 * The OkHttp app interceptor to add custom tag for [RedirectResponse]
 */
@Suppress("unused")
class DevLauncherOkHttpAppInterceptor : Interceptor {
  override fun intercept(chain: Interceptor.Chain): Response {
    if (!DevLauncherNetworkLogger.instance.shouldEmitEvents()) {
      return chain.proceed(chain.request());
    }
    return chain.proceed(chain.request().newBuilder()
      .tag(RedirectResponse::class.java, RedirectResponse())
      .build()
    )
  }
}

/**
 * Custom property for redirect requests
 */
internal class RedirectResponse {
  var requestId: String? = null
  var priorResponse: Response? = null
}
