package expo.modules.appmetrics.crashreporting

import expo.modules.appmetrics.logevents.Severity
import expo.modules.appmetrics.logevents.truncateToMaxLength
import expo.modules.appmetrics.storage.LogRecord
import expo.modules.appmetrics.utils.JsonAny
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
  /**
   * The exact crash moment. iOS reports a diagnostic window (`timestampBegin`..`timestampEnd`);
   * Android knows the precise instant, so it emits only the start and the cross-platform
   * `timestampEnd` is resolved from it in JS.
   */
  val timestampBegin: String,
  /**
   * When this device processed the crash and constructed the report — the next
   * launch after the crash, not the crash moment itself.
   */
  val ingestedAt: String
) {
  fun toLogRecord(sessionId: String, details: CrashLogDetails = CrashLogDetails()): LogRecord {
    val attributes = buildMap<String, Any?> {
      put("exception.type", details.exceptionType ?: signal?.let(::signalName) ?: "NativeCrash")
      put("exception.message", terminationReason ?: exceptionReason ?: signal?.let(::signalName) ?: "Native crash")
      put("exception.stacktrace", renderStacktrace(details.stackFrames))
      put("expo.error.source", "nativeCrash")
      put("expo.error.is_fatal", true)
      signal?.let {
        put("expo.crash.signal", signalName(it))
        put("expo.crash.signal_number", it)
      }
      terminationReason?.let { put("expo.crash.termination_reason", it) }
    }
    return LogRecord(
      sessionId = sessionId,
      timestamp = timestampBegin,
      name = "native.exception",
      severity = Severity.FATAL.rawValue,
      attributes = JsonAny.encodeMapToJsonString(attributes)
    )
  }

  private fun renderStacktrace(stackFrames: List<String>?): String? {
    val callStacks = callStackTree?.callStacks.orEmpty()
    val attributedStacks = callStacks.filter { it.threadAttributed == true }
    val selectedStacks = attributedStacks.ifEmpty { callStacks }
    val frames = stackFrames ?: selectedStacks
      .flatMap { it.callStackRootFrames.orEmpty() }
      .map { it.symbol ?: "<unknown>" }
    if (frames.isEmpty()) {
      return null
    }
    val rendered = buildList {
      addAll(frames.take(MAX_LOG_STACK_FRAMES))
      if (frames.size > MAX_LOG_STACK_FRAMES) {
        add("… +${frames.size - MAX_LOG_STACK_FRAMES} more frames")
      }
    }.joinToString("\n")
    return truncateToMaxLength(
      rendered,
      MAX_LOG_STACKTRACE_LENGTH,
      "Native crash stack trace exceeded the maximum length and was truncated."
    )
  }

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
     * `crashTimestamp` is the crash moment; `ingestedAt` is when the report was
     * assembled on the next launch.
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
    private const val MAX_LOG_STACK_FRAMES = 25
    private const val MAX_LOG_STACKTRACE_LENGTH = 65_536

    private fun signalName(signal: Int): String =
      when (signal) {
        4 -> "SIGILL"
        5 -> "SIGTRAP"
        6 -> "SIGABRT"
        7 -> "SIGBUS"
        8 -> "SIGFPE"
        9 -> "SIGKILL"
        11 -> "SIGSEGV"
        15 -> "SIGTERM"
        else -> "SIG$signal"
      }
  }
}

data class CrashLogDetails(
  val exceptionType: String? = null,
  val stackFrames: List<String>? = null
)
