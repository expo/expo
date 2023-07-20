package expo.modules.kotlin.tracing

import androidx.tracing.Trace

/**
 * Wrap the specified [block] in calls to [Trace.beginSection] (with expo tag and the supplied [blockName])
 * and [Trace.endSection].
 *
 * @param blockName A name of the code section to appear in the trace.
 * @param block A block of code which is being traced.
 */
inline fun <T> trace(blockName: String, crossinline block: () -> T) =
  androidx.tracing.trace("[ExpoModulesCore] $blockName", block)
