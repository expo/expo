package expo.modules.devlauncher.services

import androidx.core.net.toUri
import expo.modules.devlauncher.helpers.await
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject

private const val restEndpoint = "https://exp.host/--/api/v2"

data class DevelopmentSession(
  val description: String,
  val source: String,
  val url: String
) {
  constructor(json: JSONObject) : this(
    description = json.getString("description"),
    source = json.getString("source"),
    url = json.getString("url").let { url ->
      val parsed = url.toUri()

      if (parsed.host != "expo-development-client") {
        return@let url
      }

      val urlParameter = parsed.getQueryParameter("url")
      urlParameter ?: url
    }
  )
}

class HttpClientService() {
  private var currentSession: String? = null

  val httpClient = OkHttpClient.Builder()
    .addInterceptor { chain ->
      val originalRequest = chain.request()
      val session = currentSession
      if (session == null || !originalRequest.url.toString().startsWith(restEndpoint)) {
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

  suspend fun fetchDevelopmentSession(): List<DevelopmentSession> {
    if (currentSession === null) {
      return emptyList()
    }

    val request = Request.Builder()
      .url("$restEndpoint/development-sessions")
      .header("content-type", "application/json")
      .build()

    val response = request.await(httpClient)

    if (!response.isSuccessful) {
      throw IllegalStateException("Failed to fetch development session: ${response.code} ${response.message}")
    }

    val body = response.body?.string()
    if (body == null) {
      return emptyList()
    }

    return buildList {
      val json = JSONObject(body)
      val data = json.getJSONArray("data")
      for (index in 0 until data.length()) {
        val item = data.getJSONObject(index)
        add(DevelopmentSession(json = item))
      }
    }
  }
}
