package expo.modules.appmetrics.sink

import expo.modules.appmetrics.AppMetadata

/** A session at the moment it starts. For expo-observe. Not a stable API. */
data class SessionInfo(
  val id: String,
  val type: String,
  // ISO 8601 date string
  val startTimestamp: String,
  val metadata: AppMetadata?
)
