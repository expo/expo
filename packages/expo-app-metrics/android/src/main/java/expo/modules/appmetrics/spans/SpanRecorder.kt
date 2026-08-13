// Copyright 2025-present 650 Industries. All rights reserved.

package expo.modules.appmetrics.spans

import expo.modules.appmetrics.logevents.sanitizeLogEventAttributes
import expo.modules.appmetrics.storage.Span
import expo.modules.appmetrics.utils.JsonAny
import org.json.JSONArray
import org.json.JSONObject

/**
 * In-memory state of one in-flight span between `startSpan` and `end`. This is the testable
 * core behind the JS `Span` handle: it owns the attribute/event accumulation and the end-once
 * rule, and produces the write-once `Span` row when the span's life ends. Nothing touches the
 * database until then — the `spans` table stores only completed spans. Mirrors the iOS
 * `SpanRecorder`.
 *
 * Ids are minted here, at start: a child started while this span is in flight references
 * `traceId`/`spanId` before any row exists, and the row written at `end` carries the same
 * identity. Timestamps are passed in by the caller (the module glue supplies "now" defaults),
 * keeping the recorder deterministic.
 *
 * Thread-safety: JS calls arrive on the JS thread; the intrinsic lock guards the mutable tail
 * so a handle captured by concurrent callbacks can't corrupt state.
 */
class SpanRecorder(
  name: String,
  private val sessionId: String,
  parentTraceId: String? = null,
  val parentSpanId: String? = null,
  attributes: Map<String, Any?>? = null,
  private val startTimestampMs: Long
) {
  private data class PendingEvent(
    val name: String,
    val timeMs: Long,
    val attributes: Map<String, Any?>?
  )

  // A child continues its parent's trace; a root span starts a fresh one.
  val traceId: String = parentTraceId ?: Span.generateTraceId()
  val spanId: String = Span.generateSpanId()
  val name: String = name

  private val lock = Any()
  private val attributes: MutableMap<String, Any?> = mutableMapOf()
  private val events = mutableListOf<PendingEvent>()
  private var ended = false

  init {
    // Attributes go through the same validation as log-event attributes (empty keys, the
    // reserved `expo.*` namespace, and the per-record cap are dropped with a warning).
    sanitizeLogEventAttributes(attributes).attributes?.let {
      this.attributes.putAll(it)
    }
  }

  /**
   * Merges attributes into the span; keys set later win. Values are validated the same way as
   * at construction. No-op after `end`.
   */
  fun setAttributes(attributes: Map<String, Any?>) {
    val sanitized = sanitizeLogEventAttributes(attributes).attributes ?: return
    synchronized(lock) {
      if (ended) {
        return
      }
      this.attributes.putAll(sanitized)
    }
  }

  /**
   * Appends a point-in-time event. Events whose name trims to empty are dropped (the server
   * drops them anyway), as is anything past `MAX_EVENT_COUNT`. No-op after `end`.
   */
  fun addEvent(name: String, attributes: Map<String, Any?>?, timeMs: Long) {
    val trimmedName = name.trim()
    if (trimmedName.isEmpty()) {
      return
    }
    val sanitized = sanitizeLogEventAttributes(attributes).attributes
    synchronized(lock) {
      if (ended || events.size >= MAX_EVENT_COUNT) {
        return
      }
      events.add(PendingEvent(name = trimmedName, timeMs = timeMs, attributes = sanitized))
    }
  }

  /**
   * Ends the span exactly once and returns the completed row; every later call returns `null`.
   * `statusMessage` is only stored alongside an explicit status code — a message with no
   * status has no OTLP representation.
   */
  fun end(statusCode: Int?, statusMessage: String?, endTimestampMs: Long): Span? {
    val snapshot = synchronized(lock) {
      if (ended) {
        return null
      }
      ended = true
      Pair(attributes.toMap(), events.toList())
    }
    val (attributesSnapshot, eventsSnapshot) = snapshot
    return Span(
      sessionId = sessionId,
      traceId = traceId,
      spanId = spanId,
      parentSpanId = parentSpanId,
      name = name,
      kind = Span.INTERNAL_KIND,
      startTimestampMs = startTimestampMs,
      endTimestampMs = endTimestampMs,
      statusCode = statusCode,
      statusMessage = if (statusCode != null) statusMessage else null,
      attributes = attributesSnapshot.takeIf { it.isNotEmpty() }?.let { JsonAny.encodeMapToJsonString(it) },
      events = eventsSnapshot.takeIf { it.isNotEmpty() }?.let { encodeEvents(it) }
    )
  }

  private fun encodeEvents(events: List<PendingEvent>): String {
    val array = JSONArray()
    for (event in events) {
      val encoded = JSONObject()
      encoded.put("name", event.name)
      encoded.put("timeMs", event.timeMs)
      event.attributes?.takeIf { it.isNotEmpty() }?.let { attributes ->
        encoded.put("attributes", JSONObject(JsonAny.encodeMapToJsonString(attributes)))
      }
      array.put(encoded)
    }
    return array.toString()
  }

  companion object {
    /**
     * Upper bound on buffered events. The exporter truncates to the server's 32-event limit at
     * dispatch and reports the overflow as dropped; buffering somewhat beyond that keeps the
     * dropped count honest while bounding what a runaway caller can accumulate.
     */
    const val MAX_EVENT_COUNT = 128
  }
}
