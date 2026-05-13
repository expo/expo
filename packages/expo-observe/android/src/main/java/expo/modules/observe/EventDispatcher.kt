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
  private val baseProjectUrl: String
    get() = when (baseUrl.endsWith("/")) {
      true -> "${baseUrl}$projectId"
      else -> "$baseUrl/$projectId"
    }

  private fun metricsEndpointUrl(): String =
    if (useOpenTelemetry) "$baseProjectUrl/v1/metrics" else baseProjectUrl

  private fun logsEndpointUrl(): String = "$baseProjectUrl/v1/logs"

  suspend fun dispatch(events: List<Event>): Boolean =
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

        executePost(continuation, metricsEndpointUrl(), body)
      } catch (e: Exception) {
        Log.w(
          TAG,
          "Dispatching the events has thrown an error: ${e.message}"
        )
        continuation.resumeWithException(e)
      }
    }

  /**
   * Dispatches log records to `{baseUrl}/{projectId}/v1/logs`. Always uses the
   * OTLP wire shape — there is no legacy logs endpoint.
   */
  suspend fun dispatchLogs(events: List<Event>): Boolean =
    suspendCancellableCoroutine { continuation ->
      val easId = EASClientID(context).uuid.toString()
      val resourceLogs = events
        .filter { it.logs.isNotEmpty() }
        .map { it.toOTResourceLogs(easId) }
      if (resourceLogs.isEmpty()) {
        continuation.resume(false)
        return@suspendCancellableCoroutine Unit
      }
      try {
        val body = OTLogsRequestBody(resourceLogs = resourceLogs).toJson(prettyPrint = true)
        executePost(continuation, logsEndpointUrl(), body)
      } catch (e: Exception) {
        Log.w(
          TAG,
          "Dispatching the logs has thrown an error: ${e.message}"
        )
        continuation.resumeWithException(e)
      }
    }

  private fun executePost(
    continuation: kotlinx.coroutines.CancellableContinuation<Boolean>,
    endpointUrl: String,
    body: String
  ) {
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
