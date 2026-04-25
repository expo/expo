package expo.modules.observe

import android.content.Context
import android.util.Log
import expo.modules.easclient.EASClientID
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

// TODO: Make this safe for concurrent usage
class EventDispatcher(
  val context: Context,
  val projectId: String,
  val baseUrl: String,
  private val useOpenTelemetry: Boolean = false,
  private val httpClient: OkHttpClient = OkHttpClient()
) {
  private fun endpointUrl(): String {
    val base = when (baseUrl.endsWith("/")) {
      true -> "${baseUrl}${projectId}"
      else -> "${baseUrl}/${projectId}"
    }
    return if (useOpenTelemetry) "$base/v1/metrics" else base
  }

  suspend fun dispatch(events: List<Event>) =
    suspendCancellableCoroutine { continuation ->
      if (events.isEmpty()) {
        continuation.resume(false)
        return@suspendCancellableCoroutine Unit
      }
      val easId = EASClientID(context).uuid.toString()
      try {
        val json = Json {
          prettyPrint = true
        }

        val body = if (useOpenTelemetry) {
          val otRequestBody = OTRequestBody(
            resourceMetrics = events.map { it.toOTEvent(easId) }
          )
          otRequestBody.toJson(prettyPrint = true)
        } else {
          val payload = Payload(
            easClientId = easId,
            events = events
          )
          json.encodeToString(Payload.serializer(), payload)
        }

        val endpointUrl = endpointUrl()

        Log.d(TAG, "Sending events to $endpointUrl")

        val request = Request
          .Builder()
          .url(endpointUrl)
          .post(body.toRequestBody("application/json".toMediaType()))
          .build()

        Log.d(TAG, body)

        val call = httpClient.newCall(request)

        continuation.invokeOnCancellation {
          call.cancel()
        }

        val response = call.execute()
        Log.d(TAG, "Server responded with: ${response.body?.string()}")

        continuation.resume(response.code in 200..299)
      } catch (e: Exception) {
        Log.w(
          TAG,
          "Dispatching the events has thrown an error: ${e.message}"
        )
        continuation.resumeWithException(e)
      }
    }

  companion object {
    private const val TAG = "EasObserve"
  }
}

@Serializable
data class Payload(
  val easClientId: String,
  val events: List<Event>
)
