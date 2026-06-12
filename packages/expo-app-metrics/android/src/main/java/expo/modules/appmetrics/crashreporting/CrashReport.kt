package expo.modules.appmetrics.crashreporting

import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

@Serializable
data class CrashReport(
  /** Unix signal number (e.g. SIGSEGV = 11), from `ApplicationExitInfo.getStatus()` for native crashes. */
  val signal: Int? = null,
  /** Human-readable description of the termination, from `ApplicationExitInfo.getDescription()`. */
  val terminationReason: String? = null,
  /** Exception summary. */
  val exceptionReason: String? = null,
  /** Call stack of the crashing thread. */
  val callStackTree: CallStackTree? = null,
  /** App version at the time of the crash. */
  val appVersion: String,
  /** Crash window start. Android knows the exact crash moment, so begin == end. */
  val timestampBegin: String,
  /** Crash window end. Android knows the exact crash moment, so begin == end. */
  val timestampEnd: String,
  /**
   * When this device processed the crash and constructed the report — the next
   * launch after the crash, not the crash moment itself.
   */
  val ingestedAt: String
) {
  @Serializable
  data class CallStackTree(
    val callStacks: List<CallStack>? = null
  ) {
    @Serializable
    data class CallStack(
      val threadAttributed: Boolean? = null,
      val callStackRootFrames: List<Frame>? = null
    )

    @Serializable
    data class Frame(
      val symbol: String? = null
    )
  }

  fun encodeToJsonString(): String = json.encodeToString(this)

  companion object {
    private val json = Json {
      ignoreUnknownKeys = true
      explicitNulls = false
    }

    fun decodeFromJsonString(payload: String): CrashReport? =
      runCatching { json.decodeFromString<CrashReport>(payload) }.getOrNull()

    /**
     * Builds a report from a JVM throwable caught by the uncaught-exception handler.
     * `crashTimestamp` is the crash moment (used as a zero-width window); `ingestedAt`
     * is when the report was assembled on the next launch.
     */
    fun fromThrowable(
      throwable: Throwable,
      crashTimestamp: String,
      ingestedAt: String,
      appVersion: String
    ): CrashReport =
      CrashReport(
        exceptionReason = composeMessage(throwable),
        callStackTree = CallStackTreeBuilder.fromStackTrace(throwable.stackTrace),
        appVersion = appVersion,
        timestampBegin = crashTimestamp,
        timestampEnd = crashTimestamp,
        ingestedAt = ingestedAt
      )

    /**
     * `Throwable.toString()` plus the cause chain — the root cause is usually
     * the diagnostic that matters, and `toString()` alone drops it. Mirrors the
     * `Caused by:` lines of `printStackTrace`. Depth-capped defensively against
     * cyclic cause chains.
     */
    fun composeMessage(throwable: Throwable): String {
      val message = StringBuilder(throwable.toString())
      var cause = throwable.cause
      var depth = 0
      while (cause != null && depth < MAX_CAUSE_DEPTH) {
        message.append("\nCaused by: ").append(cause.toString())
        cause = cause.cause
        depth++
      }
      return message.toString()
    }

    private const val MAX_CAUSE_DEPTH = 5
  }
}
