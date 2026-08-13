// Copyright 2025-present 650 Industries. All rights reserved.

package expo.modules.appmetrics.networkrequests

import expo.modules.appmetrics.spans.SpanWriter
import expo.modules.appmetrics.storage.Span
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import org.json.JSONArray
import org.json.JSONObject

/**
 * Routes completed requests from `NetworkRequestMonitor` into the `spans` table, attributed to
 * the main session. This is the first span producer: it converts each request into a generic
 * `Span` following the OTel HTTP semantic conventions, so the export layer (`expo-observe`)
 * ships spans without knowing what produced them. Unlike the in-memory ring buffer, the rows
 * survive process death until they're dispatched, pruned with their session, or displaced past
 * the table's row cap. Mirrors the iOS `NetworkRequestPersistence`.
 *
 * Installed on the monitor once the module created the main session (see `AppMetricsModule`);
 * the monitor calls `persist` directly for every completion it records. Deliberately not a
 * `NetworkRequestObserverDelegate`: persistence is part of the pipeline, not an observer, and
 * the delegate contract (weak registration, `shouldObserveRequest` filtering) doesn't apply.
 */
class NetworkRequestPersistence(
  private val writer: SpanWriter,
  initialConfiguration: NetworkSpansConfiguration = NetworkSpansConfiguration(),
  /**
   * A plain value, not a provider: the id is constant for a persistence instance (it is
   * constructed after the main session exists), and resolving it eagerly means the monitor's
   * record path — OkHttp dispatcher threads — never calls back into module state that a
   * teardown could have invalidated.
   */
  private val sessionId: String
) {
  /**
   * Capture-time recording policy. Volatile because the monitor calls in from OkHttp dispatcher
   * threads while JS reconfigures from the modules queue. Checked before each insert so a change
   * takes effect for future requests immediately; rows persisted earlier are untouched.
   */
  @Volatile
  private var configuration: NetworkSpansConfiguration = initialConfiguration

  /**
   * Applies a new recording policy to subsequent requests. Called when JS reconfigures
   * `traces.network`; the caller persists the value separately.
   */
  fun setConfiguration(configuration: NetworkSpansConfiguration) {
    this.configuration = configuration
  }

  /**
   * Persists one completed request as a span: applies the recording policy, maps the snapshot
   * onto the generic row shape, and hands it to the shared writer.
   */
  fun persist(request: NetworkRequest) {
    if (!configuration.allows(request.url, request.method)) {
      return
    }
    val span = request.toSpan(sessionId) ?: return
    writer.write(span)
  }

  /**
   * Persists the monitor's buffered startup requests. The producer runs lazily inside the
   * writer's single batch coroutine: the install path runs on the module's serial queue during
   * startup, competing with the session INSERT and crash-report processing, so converting up
   * to 200 requests inline (JSON serialization, URL parsing) and queueing one coroutine per
   * row there would be the most expensive way to do it.
   */
  fun persistBuffered(requests: List<NetworkRequest>, onComplete: () -> Unit = {}) {
    if (requests.isEmpty()) {
      return
    }
    writer.writeAll {
      requests.mapNotNull { request ->
        request.takeIf { configuration.allows(it.url, it.method) }?.toSpan(sessionId)
      }
      // Deliberately not in a `finally`: a cancelled batch must not report completion, so the
      // caller can retry the drain on the next install.
      onComplete()
    }
  }
}

/**
 * Builds a span from a completed request snapshot, per the OTel HTTP semantic conventions for a
 * client span: the span is named after the method, a transport failure or a 4xx/5xx response
 * makes it an ERROR, and each redirect hop becomes an `http.redirect` event.
 *
 * The attribute keys mirror the set the ingestion endpoint extracts into dedicated columns
 * (`http.request.method`, `url.full`, `server.address`, ...). `url.full` is redacted here, at
 * the instrumentation, as the conventions require: userinfo credentials and the default
 * sensitive query values never reach disk or the wire (ingestion redacts again as defense in
 * depth). An intentionally cancelled request keeps its span but stays UNSET with no
 * `error.type`, per the conventions. `error.type` must stay low-cardinality: the captured
 * exception class for a transport failure, or the bare status code when the response itself
 * was the error; the localized `errorDescription` goes to the status message instead.
 *
 * Returns `null` when the snapshot carries no usable timestamps — without either endpoint of
 * the request window there is nothing to anchor a span to.
 */
internal fun NetworkRequest.toSpan(sessionId: String): Span? {
  val start = timings.fetchStart?.time
  val end = timings.responseEnd?.time
  val durationMs = (timings.totalDuration * 1_000).toLong()
  val resolvedStart = start ?: end?.minus(durationMs) ?: return null
  val resolvedEnd = end ?: start?.plus(durationMs) ?: return null

  val attributes = JSONObject()
  // Case-sensitive per the conventions: an unknown or nonstandard method becomes `_OTHER`
  // (verbatim value preserved in `http.request.method_original`) and names the span `HTTP`,
  // so caller-controlled verbs can't mint unbounded span names.
  val isKnownMethod = method in KNOWN_HTTP_METHODS
  attributes.put("http.request.method", if (isKnownMethod) method else "_OTHER")
  if (!isKnownMethod) {
    attributes.put("http.request.method_original", method)
  }
  val parsedUrl = url.toHttpUrlOrNull()
  attributes.put("url.full", redactedUrlFull(url, parsedUrl))
  parsedUrl?.host?.let { host ->
    attributes.put("server.address", host)
  }
  // `HttpUrl.port` already resolves the scheme default when the URL carries no explicit port.
  parsedUrl?.port?.let { port ->
    attributes.put("server.port", port)
  }
  statusCode?.let { code ->
    attributes.put("http.response.status_code", code)
  }
  semconvProtocolVersion(networkProtocol)?.let { version ->
    attributes.put("network.protocol.version", version)
  }
  requestBytesSent?.let { bytes ->
    attributes.put("http.request.size", bytes)
  }
  responseBytesReceived?.let { bytes ->
    attributes.put("http.response.size", bytes)
  }
  val httpErrorStatus = (statusCode ?: 0) >= 400
  // An intentional cancellation is not a failure: status stays UNSET and `error.type` is
  // never set, per the conventions.
  val resolvedErrorType = if (cancelled) {
    null
  } else {
    errorType ?: statusCode?.toString().takeIf { httpErrorStatus }
  }
  resolvedErrorType?.let { value ->
    attributes.put("error.type", value)
  }

  val failed = !cancelled && (errorDescription != null || errorType != null || httpErrorStatus)
  // The conventions model redirects as resent spans (`http.request.resend_count`), not events;
  // one span per chain is a deliberate deviation for this pipeline. The event name is
  // `expo.`-prefixed because semconv reserves the bare `http.` namespace for itself.
  val events = JSONArray()
  for (redirect in redirects) {
    val event = JSONObject()
    event.put("name", "expo.http.redirect")
    val eventAttributes = JSONObject()
    eventAttributes.put("from", redirect.fromUrl)
    eventAttributes.put("to", redirect.toUrl)
    eventAttributes.put("statusCode", redirect.statusCode)
    event.put("attributes", eventAttributes)
    events.put(event)
  }

  return Span(
    sessionId = sessionId,
    name = if (isKnownMethod) method else "HTTP",
    kind = Span.CLIENT_KIND,
    startTimestampMs = resolvedStart,
    endTimestampMs = resolvedEnd,
    statusCode = if (failed) Span.STATUS_ERROR else null,
    statusMessage = if (failed) errorDescription else null,
    attributes = attributes.toString(),
    events = if (events.length() > 0) events.toString() else null
  )
}

/** The standard method set per RFC 9110, matched case-sensitively as the conventions require. */
private val KNOWN_HTTP_METHODS = setOf("GET", "HEAD", "POST", "PUT", "DELETE", "CONNECT", "OPTIONS", "TRACE", "PATCH")

/**
 * Query parameter names whose values are redacted by default, per the conventions' list for
 * `url.full` (signed-URL secrets: S3 presigned, GCS signed, SAS-style tokens). Compared
 * case-insensitively.
 */
private val SENSITIVE_QUERY_PARAMETERS = setOf("awsaccesskeyid", "signature", "sig", "x-amz-signature", "x-goog-signature")

/**
 * `url.full` with userinfo credentials replaced by `REDACTED:REDACTED` and default-sensitive
 * query values replaced by `REDACTED`, per the conventions — redaction is the instrumentation's
 * job, so secrets never reach the on-device database or the wire.
 */
private fun redactedUrlFull(url: String, parsed: okhttp3.HttpUrl?): String {
  // An unparseable URL can't prove it carries no secrets; drop the query outright. The parsed
  // form is passed in so `toSpan` parses each URL once — it runs on the OkHttp dispatcher
  // thread for every completed request, and per row in the backfill batch.
  if (parsed == null) {
    return url.substringBefore('?')
  }
  val builder = parsed.newBuilder()
  if (parsed.encodedUsername.isNotEmpty() || parsed.encodedPassword.isNotEmpty()) {
    builder.username("REDACTED")
    builder.password("REDACTED")
  }
  for (name in parsed.queryParameterNames) {
    if (name.lowercase() in SENSITIVE_QUERY_PARAMETERS) {
      builder.removeAllQueryParameters(name)
      builder.addQueryParameter(name, "REDACTED")
    }
  }
  return builder.build().toString()
}

/**
 * Bare protocol version per semconv's `network.protocol.version` ("1.1", "2", "3"), mapped from
 * the ALPN-style names OkHttp reports ("http/1.1", "h2", "h3"). Unrecognized values pass through
 * verbatim rather than being dropped.
 */
private fun semconvProtocolVersion(networkProtocol: String?): String? = when {
  networkProtocol == null -> null
  networkProtocol == "h2" -> "2"
  networkProtocol == "h3" -> "3"
  networkProtocol.startsWith("http/") -> networkProtocol.removePrefix("http/")
  else -> networkProtocol
}
