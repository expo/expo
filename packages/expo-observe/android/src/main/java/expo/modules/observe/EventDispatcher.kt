package expo.modules.observe

import android.content.Context
import android.util.Log
import expo.modules.easclient.EASClientID
import kotlinx.coroutines.suspendCancellableCoroutine
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import kotlin.coroutines.resume

// TODO: Make this safe for concurrent usage
class EventDispatcher(
  val context: Context,
  val projectId: String,
  val baseUrl: String,
  private val httpClient: OkHttpClient = OkHttpClient()
) {
  private val baseProjectUrl: String
    get() = when (baseUrl.endsWith("/")) {
      true -> "${baseUrl}$projectId"
      else -> "$baseUrl/$projectId"
    }

  private fun metricsEndpointUrl(): String = "$baseProjectUrl/v1/metrics"

  private fun logsEndpointUrl(): String = "$baseProjectUrl/v1/logs"

  /**
   * POSTs `events` to the metrics endpoint and classifies the response per the OTLP retry
   * spec. Non-throwing: payload-encoding errors collapse to `NonRetryable` (same bytes will
   * fail again), transport errors collapse to `Retryable(null)` (transient by definition).
   */
  suspend fun dispatch(events: List<Event>): DispatchResult =
    suspendCancellableCoroutine { continuation ->
      if (events.isEmpty()) {
        // Empty input isn't a server response - signal success.
        continuation.resume(DispatchResult.Success)
        return@suspendCancellableCoroutine Unit
      }
      val easId = EASClientID(context).uuid.toString()
      val body = try {
        OTRequestBody(
          resourceMetrics = events.map { it.toOTEvent(easId) }
        ).toJson(prettyPrint = true)
      } catch (e: Exception) {
        Log.w(OBSERVE_TAG, "Encoding metrics request body failed: ${e.message}")
        continuation.resume(DispatchResult.NonRetryableFailure("encoding error: ${e.message}"))
        return@suspendCancellableCoroutine Unit
      }
      executePost(continuation, metricsEndpointUrl(), body)
    }

  /**
   * Dispatches log records to `{baseUrl}/{projectId}/v1/logs`. Always uses the
   * OTLP wire shape — there is no legacy logs endpoint.
   */
  suspend fun dispatchLogs(events: List<Event>): DispatchResult =
    suspendCancellableCoroutine { continuation ->
      val easId = EASClientID(context).uuid.toString()
      val resourceLogs = events
        .filter { it.logs.isNotEmpty() }
        .map { it.toOTResourceLogs(easId) }
      if (resourceLogs.isEmpty()) {
        continuation.resume(DispatchResult.Success)
        return@suspendCancellableCoroutine Unit
      }
      val body = try {
        OTLogsRequestBody(resourceLogs = resourceLogs).toJson(prettyPrint = true)
      } catch (e: Exception) {
        Log.w(OBSERVE_TAG, "Encoding logs request body failed: ${e.message}")
        continuation.resume(DispatchResult.NonRetryableFailure("encoding error: ${e.message}"))
        return@suspendCancellableCoroutine Unit
      }
      executePost(continuation, logsEndpointUrl(), body)
    }

  private fun executePost(
    continuation: kotlinx.coroutines.CancellableContinuation<DispatchResult>,
    endpointUrl: String,
    body: String
  ) {
    Log.d(OBSERVE_TAG, "Sending events to $endpointUrl")

    val request = Request
      .Builder()
      .url(endpointUrl)
      // Tells the expo-app-metrics network observer to skip this request so our own telemetry
      // uploads don't get logged back into the network-request stream. The interceptor strips
      // the header before forwarding so the server never sees it. The name is duplicated here
      // rather than imported: expo-observe must not depend on expo-app-metrics internals. Keep
      // it in sync with `INTERNAL_HEADER_NAME` in
      // `expo-app-metrics/android/.../networkrequests/NetworkRequestInterceptor.kt`.
      .addHeader("Expo-AppMetrics-Skip", "1")
      .post(body.toRequestBody("application/json".toMediaType()))
      .build()

    Log.d(OBSERVE_TAG, body)

    val call = httpClient.newCall(request)

    continuation.invokeOnCancellation {
      call.cancel()
    }

    val response = try {
      call.execute()
    } catch (e: Exception) {
      Log.w(OBSERVE_TAG, "Transport error talking to $endpointUrl: ${e.message}")
      continuation.resume(DispatchResult.RetryableFailure(retryAfterMs = null))
      return
    }

    val responseBody = response.body?.string()
    val retryAfterHeader = response.header("Retry-After")
    val result = DispatchUtils.classifyResponse(
      statusCode = response.code,
      retryAfterHeader = retryAfterHeader,
      responseBody = responseBody,
      bodyExcerpt = { DispatchUtils.bodyExcerpt(responseBody) }
    )

    when (result) {
      is DispatchResult.Success ->
        Log.d(OBSERVE_TAG, "Server responded successfully with ${response.code} and data: $responseBody")
      is DispatchResult.PartialSuccess ->
        Log.w(
          OBSERVE_TAG,
          "Server responded with ${response.code} (partial success, rejected " +
            "${result.partial.rejectedCount}: ${result.partial.errorMessage ?: "no error message"}) " +
            "and data: $responseBody"
        )
      is DispatchResult.RetryableFailure ->
        Log.w(OBSERVE_TAG, "Server responded with ${response.code} (retryable) and data: $responseBody")
      is DispatchResult.NonRetryableFailure ->
        Log.w(
          OBSERVE_TAG,
          "Server responded with ${response.code} (non-retryable, ${result.reason}) and data: $responseBody"
        )
    }

    continuation.resume(result)
  }
}
