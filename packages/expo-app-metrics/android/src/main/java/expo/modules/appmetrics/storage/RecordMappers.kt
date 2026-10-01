package expo.modules.appmetrics.storage

import expo.modules.appmetrics.records.LogEvent
import expo.modules.appmetrics.records.MetricRecord
import expo.modules.appmetrics.records.NetworkSpan

internal fun MetricRecord.toEntity(sessionId: String): Metric =
  Metric(
    sessionId = sessionId,
    timestamp = timestamp,
    category = category,
    name = name,
    value = value,
    routeName = routeName,
    updateId = updateId,
    params = params
  )

internal fun LogEvent.toEntity(sessionId: String): LogRecord =
  LogRecord(
    sessionId = sessionId,
    timestamp = timestamp,
    name = name,
    body = body,
    severity = severity,
    attributes = attributes,
    droppedAttributesCount = droppedAttributesCount
  )

// Trace and span ids come from the `Span` defaults, so each mapping generates new ones.
internal fun NetworkSpan.toEntity(sessionId: String): Span =
  Span(
    sessionId = sessionId,
    name = name,
    kind = kind,
    startTimestampMs = startTimestampMs,
    endTimestampMs = endTimestampMs,
    statusCode = statusCode,
    statusMessage = statusMessage,
    attributes = attributes,
    events = events
  )
