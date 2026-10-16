package expo.modules.audio.service

private const val DEFAULT_SEEK_INTERVAL_SECONDS = 10.0
private const val MIN_SEEK_INTERVAL_MS = 100L

internal fun seekIntervalMs(seconds: Double?): Long {
  val resolved = seconds?.takeIf { it.isFinite() } ?: DEFAULT_SEEK_INTERVAL_SECONDS
  return (resolved * 1000).toLong().coerceAtLeast(MIN_SEEK_INTERVAL_MS)
}
