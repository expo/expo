---
'expo-observe': minor
---

Add a `span` option to `Observe.recordMetric` and a `recordMetric` method to `Span`, to link a custom metric to the span that measured it. Observe sends the trace ID and span ID with the value as an OpenTelemetry exemplar. The metrics database is recreated once after the update, so data that was not yet sent is lost.
