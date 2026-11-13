package expo.modules.appmetrics.crashreporting

/**
 * Maps a JVM stack trace into the cross-platform `CrashReport.CallStackTree` shape.
 */
object CallStackTreeBuilder {
  /**
   * Frame cap per stack. `StackOverflowError` traces routinely reach the JVM's
   * 1024-element limit; beyond this cap the repeating tail adds payload size
   * without diagnostic value, so it's replaced by a marker frame.
   */
  const val MAX_FRAMES = 256

  fun fromStackTrace(stackTrace: Array<StackTraceElement>): CrashReport.CallStackTree =
    fromSymbols(stackTrace.map { it.toString() })

  /** Builds the tree from already-formatted frame strings (the pending-crash-file path). */
  fun fromSymbols(symbols: List<String>): CrashReport.CallStackTree {
    val frames = symbols.take(MAX_FRAMES).map { symbol ->
      CrashReport.CallStackTree.Frame(symbol = symbol)
    }
    val truncatedCount = symbols.size - MAX_FRAMES
    val allFrames = if (truncatedCount > 0) {
      frames + CrashReport.CallStackTree.Frame(symbol = "… $truncatedCount more frames")
    } else {
      frames
    }
    return CrashReport.CallStackTree(
      callStacks = listOf(
        CrashReport.CallStackTree.CallStack(
          threadAttributed = true,
          callStackRootFrames = allFrames
        )
      )
    )
  }
}
