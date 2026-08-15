package expo.modules.devlauncher.services

import com.facebook.react.modules.network.OkHttpClientProvider

class HttpClientService {
  private var currentSession: String? = null

  val httpClient = OkHttpClientProvider
    .getOkHttpClient()
    .newBuilder()
    .addInterceptor { chain ->
      val originalRequest = chain.request()
      val session = currentSession
      val url = originalRequest.url.toString()
      val needsSession = url.startsWith(graphQLEndpoint)
      if (session == null || !needsSession) {
        return@addInterceptor chain.proceed(originalRequest)
      }

      val newRequest = originalRequest.newBuilder()
        .header("expo-session", session)
        .build()
      chain.proceed(newRequest)
    }
    .build()

  internal fun setSession(sessionSecret: String?) {
    currentSession = sessionSecret
  }
}
