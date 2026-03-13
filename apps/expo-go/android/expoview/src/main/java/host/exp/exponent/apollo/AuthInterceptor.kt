package host.exp.exponent.apollo

import com.apollographql.apollo.api.http.HttpRequest
import com.apollographql.apollo.api.http.HttpResponse
import com.apollographql.apollo.network.http.HttpInterceptor
import com.apollographql.apollo.network.http.HttpInterceptorChain
import host.exp.exponent.services.SessionRepository

class AuthInterceptor(private val sessionRepository: SessionRepository) : HttpInterceptor {
  override suspend fun intercept(request: HttpRequest, chain: HttpInterceptorChain): HttpResponse {
    val sessionSecret = sessionRepository.getSessionSecret()
      ?: return chain.proceed(request)

    val newRequest = request.newBuilder()
      .addHeader("expo-session", sessionSecret)
      .build()

    return chain.proceed(newRequest)
  }
}
