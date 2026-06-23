# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Add ObserveInteractiveMarker component ([#46909](https://github.com/expo/expo/pull/46909) by [@Ubax](https://github.com/Ubax))

### 🐛 Bug fixes

- [iOS] Classify OTLP dispatch responses per the OTLP retry spec. Non-retryable responses (400, 401, 403, 404, other non-listed codes, and `partial_success` with rejected records) now drop the batch and advance the cursor instead of looping forever; retryable responses (408, 429, 502, 503, 504, and transport errors) gate subsequent dispatches with the server-supplied `Retry-After` header or a jittered exponential backoff. ([@douglowder](https://github.com/douglowder))

### 💡 Others

- Remove the legacy non-OpenTelemetry dispatch path; metrics and logs are now always sent in the OTLP wire format. ([#47030](https://github.com/expo/expo/pull/47030) by [@tsapeta](https://github.com/tsapeta))
