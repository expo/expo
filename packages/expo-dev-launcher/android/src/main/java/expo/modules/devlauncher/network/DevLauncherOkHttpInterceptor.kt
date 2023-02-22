package expo.modules.devlauncher.network

import okhttp3.Interceptor
import okhttp3.Response

@Suppress("unused")
class DevLauncherOkHttpInterceptor : Interceptor {
  override fun intercept(chain: Interceptor.Chain): Response {
    val request = chain.request()
    if (DevLauncherNetworkLogger.instance.shouldEmitEvents()) {
      val requestId = request.hashCode().toString()
      DevLauncherNetworkLogger.instance.emitNetworkWillBeSent(request, requestId)
      val response = chain.proceed(request)
      DevLauncherNetworkLogger.instance.emitNetworkResponse(request, requestId, response)
      return response
    }
    return chain.proceed(request)
  }
}