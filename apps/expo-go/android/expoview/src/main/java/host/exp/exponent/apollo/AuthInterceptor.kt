package host.exp.exponent.apollo

import com.apollographql.apollo.api.http.HttpRequest
import com.apollographql.apollo.api.http.HttpResponse
import com.apollographql.apollo.network.http.HttpInterceptor
import com.apollographql.apollo.network.http.HttpInterceptorChain

// TODO(@lukmccall): Replace with actual session management implementation
fun interface SessionManager {
  fun getSessionSecret(): String?
}

class AuthInterceptor(private val sessionManager: SessionManager) : HttpInterceptor {
  override suspend fun intercept(request: HttpRequest, chain: HttpInterceptorChain): HttpResponse {
    val sessionSecret = sessionManager.getSessionSecret()
      ?: return chain.proceed(request)

    val newRequest = request.newBuilder()
      .addHeader("expo-session", sessionSecret)
      .build()

    return chain.proceed(newRequest)
  }
}
