package host.exp.exponent.services

import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import kotlin.reflect.KType
import kotlin.reflect.javaType

const val apiV2BaseUrl = "https://exp.host/--/api/v2/"

class RESTApiClient(private val sessionRepository: SessionRepository) {
  private val client = OkHttpClient()
  private val gson = Gson()

  @OptIn(ExperimentalStdlibApi::class)
  suspend fun <T> sendAuthenticatedApiV2Request(route: String, type: KType): T {
    val sessionSecret = sessionRepository.getSessionSecret()
      ?: throw IllegalStateException("Must be logged in to perform request")

    val url = apiV2BaseUrl + route

    val request = Request.Builder()
      .url(url)
      // TODO: Re-add SDK version header
      .addHeader("Expo-SDK-Version", "54")
      .addHeader("Expo-Platform", "android")
      .addHeader("Expo-Session", sessionSecret)
      .get()
      .build()

    // Execute the request on a background thread
    return withContext(Dispatchers.IO) {
      client.newCall(request).execute().use { response ->
        if (!response.isSuccessful) {
          throw IOException("Unexpected code ${response.code} from ${response.request.url}")
        }

        val responseBody = response.body?.string()
          ?: throw IOException("Empty response body from ${response.request.url}")

        // Deserialize the JSON response into the specified type
        gson.fromJson(responseBody, type.javaType)
      }
    }
  }

  @OptIn(ExperimentalStdlibApi::class)
  suspend fun <T, B> sendUnauthenticatedApiV2Request(route: String, type: KType, body: B? = null): T {
    val url = apiV2BaseUrl + route

    val requestBuilder = Request.Builder().url(url)

    if (body != null) {
      val jsonBody = gson.toJson(body)
      requestBuilder.post(jsonBody.toRequestBody("application/json; charset=utf-8".toMediaType()))
    } else {
      requestBuilder.get()
    }

    val request = requestBuilder.build()

    // Execute the request on a background thread
    return withContext(Dispatchers.IO) {
      client.newCall(request).execute().use { response ->
        if (!response.isSuccessful) {
          val errorBody = response.body?.string()
          throw IOException("Unexpected code ${response.code} from ${response.request.url}. Body: $errorBody")
        }

        val responseBody = response.body?.string()
          ?: throw IOException("Empty response body from ${response.request.url}")

        // Deserialize the JSON response into the specified type
        gson.fromJson(responseBody, type.javaType)
      }
    }
  }
}
