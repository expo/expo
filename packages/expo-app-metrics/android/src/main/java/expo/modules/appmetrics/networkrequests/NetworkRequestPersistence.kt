// Copyright 2025-present 650 Industries. All rights reserved.

package expo.modules.appmetrics.networkrequests

import expo.modules.appmetrics.spans.SpanWriter
import expo.modules.appmetrics.storage.Span
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import org.json.JSONArray
import org.json.JSONObject
import java.net.URLDecoder

/**
 * Records completed network requests as trace spans in the `spans` table.
 *
 * Mirrors the iOS `NetworkRequestPersistence`.
 */
class NetworkRequestPersistence(
  private val writer: SpanWriter,
  initialConfiguration: NetworkSpansConfiguration = NetworkSpansConfiguration(),
  // A plain value rather than a provider: the id is constant for an instance, and resolving it
  // eagerly keeps the monitor's record path off module state a teardown could have invalidated.
  private val sessionId: String
) {
  /**
   * Capture-time recording policy. Volatile because the monitor calls in from OkHttp dispatcher
   * threads while JS reconfigures from the modules queue.
   */
  @Volatile
  private var configuration: NetworkSpansConfiguration = initialConfiguration

  /**
   * Applies a new recording policy. Affects future requests only; rows already written stay.
   */
  fun setConfiguration(configuration: NetworkSpansConfiguration) {
    this.configuration = configuration
  }

  /**
   * Records one completed request as a span.
   */
  fun persist(request: NetworkRequest) {
    // Checked before dispatching: a request the policy excludes costs nothing beyond this.
    if (!configuration.allows(request.url, request.method)) {
      return
    }
    // Converts on the writer's scope, not here: this runs on an OkHttp dispatcher thread for
    // every completed request, and `persistBuffered` defers the same work for the same reason.
    writer.write { request.toSpan(sessionId) }
  }

  /**
   * Records the monitor's buffered startup requests as one batch.
   *
   * `onComplete` runs only if the batch finished, so a canceled one can be retried.
   */
  fun persistBuffered(requests: List<NetworkRequest>, onComplete: () -> Unit = {}) {
    if (requests.isEmpty()) {
      return
    }
    // The conversion runs lazily inside the writer's batch coroutine: the install path shares
    // the module's serial queue with the session INSERT and crash-report processing, so
    // converting up to 200 requests there would be the most expensive place to do it.
    writer.writeAll(onComplete) {
      requests.mapNotNull { request ->
        request.takeIf { configuration.allows(it.url, it.method) }?.toSpan(sessionId)
      }
    }
  }
}

/**
 * Maps a completed request onto a client span, per the OTel HTTP semantic conventions.
 *
 * The attribute keys are the set the ingestion endpoint extracts into dedicated columns.
 * Returns `null` when the snapshot has no usable timestamps, leaving nothing to anchor a span to.
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
  // Not a semconv attribute: a cached response is timestamped and byte-counted like a download,
  // so without this a large cache hit reads as an impossible transfer rate. Omitted when nothing
  // classified the fetch, so its absence never implies a network load.
  fetchType?.let { type ->
    attributes.put("expo.http.resource.fetch_type", type.attributeValue)
  }
  val httpErrorStatus = (statusCode ?: 0) >= 400
  // Must stay low-cardinality, so never the localized description.
  val resolvedErrorType = when {
    // A cancellation is not a failure, per the conventions.
    canceled -> null
    // The status code wins when the server answered: iOS resolves it the same way.
    httpErrorStatus -> statusCode?.toString()
    else -> errorType
  }
  resolvedErrorType?.let { value ->
    attributes.put("error.type", value)
  }

  val failed = !canceled && (errorDescription != null || errorType != null || httpErrorStatus)
  // A deliberate deviation: the conventions model redirects as resent spans
  // (`http.request.resend_count`), but this pipeline records one span per chain.
  val events = JSONArray()
  for (redirect in redirects) {
    val event = JSONObject()
    event.put("name", "expo.http.redirect")
    // An OTLP event outside its own span has no valid place on the timeline. Without a time the
    // exporter anchors it to the span start.
    redirect.respondedAtMs?.takeIf { it in resolvedStart..resolvedEnd }?.let { respondedAtMs ->
      event.put("timeMs", respondedAtMs)
    }
    // `expo.`-namespaced: the naming guidelines advise against application-specific names under
    // a semconv namespace. The status code reuses the registry attribute it matches.
    val eventAttributes = JSONObject()
    eventAttributes.put("expo.http.redirect.from", redirect.fromUrl)
    eventAttributes.put("expo.http.redirect.to", redirect.toUrl)
    eventAttributes.put("http.response.status_code", redirect.statusCode)
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

/**
 * The conventions' known method set: RFC 9110's methods plus PATCH and QUERY, matched
 * case-sensitively as the conventions require.
 */
private val KNOWN_HTTP_METHODS = setOf(
  "GET", "HEAD", "POST", "PUT", "DELETE", "CONNECT", "OPTIONS", "TRACE", "PATCH", "QUERY"
)

/** The conventions' default-sensitive `url.full` parameters, plus the legacy S3 pair. */
private val SENSITIVE_QUERY_PARAMETERS = setOf(
  "awsaccesskeyid",
  "signature",
  "sig",
  "x-amz-signature",
  "x-amz-credential",
  "x-amz-security-token",
  "x-goog-signature"
)

/**
 * Redacts userinfo and default-sensitive query values, so secrets never reach disk or the wire.
 */
private fun redactedUrlFull(url: String, parsed: okhttp3.HttpUrl?): String {
  // An unparseable URL can't prove it carries no secrets, so drop the query outright.
  // `parsed` is passed in so each URL is parsed once on the OkHttp dispatcher thread.
  if (parsed == null) {
    return url.substringBefore('?')
  }
  val builder = parsed.newBuilder()
  if (parsed.encodedUsername.isNotEmpty() || parsed.encodedPassword.isNotEmpty()) {
    builder.username("REDACTED")
    builder.password("REDACTED")
  }
  // Spliced as a string because every OkHttp builder route moves the parameter to the end of
  // the query, and `url.full` is the key URL analysis groups on.
  parsed.encodedQuery?.let { encodedQuery ->
    val redacted = encodedQuery
      .split('&')
      .joinToString("&") { pair ->
        val separator = pair.indexOf('=')
        // No `=` means a valueless parameter (`?sig`), which carries no secret to redact.
        if (separator < 0) {
          return@joinToString pair
        }
        val name = pair.substring(0, separator)
        // Match the decoded name: a server reads `%73ig` as `sig`.
        val decodedName = try {
          URLDecoder.decode(name, "UTF-8")
        } catch (e: IllegalArgumentException) {
          // A malformed escape cannot be decoded; fall back to the raw name rather than drop it.
          name
        }
        if (decodedName.lowercase() in SENSITIVE_QUERY_PARAMETERS) "$name=REDACTED" else pair
      }
    if (redacted != encodedQuery) {
      builder.encodedQuery(redacted)
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
