package expo.modules.kotlin.tracing

import androidx.tracing.Trace

/**
 * Wrap the specified [block] in calls to [Trace.beginSection] (with expo tag and the supplied [blockName])
 * and [Trace.endSection].
 *
 * @param blockName A name of the code section to appear in the trace.
 * @param block A block of code which is being traced.
 */
@PublishedApi
internal inline fun <T> trace(blockName: String, crossinline block: () -> T) =
  trace("ExpoModulesCore", blockName, block)

/**
 * Wrap the specified [block] in calls to [Trace.beginSection] (with provided tag and the supplied [blockName])
 * and [Trace.endSection].
 *
 * @param tag A name of the package where the trace was called
 * @param blockName A name of the code section to appear in the trace.
 * @param block A block of code which is being traced.
 */
inline fun <T> trace(tag: String, blockName: String, crossinline block: () -> T) =
  androidx.tracing.trace("[$tag] $blockName", block)

/**
 * Writes a trace message to indicate that a given section of code has begun.
 *
 * <p>This call must be followed by a corresponding call to {@link #endTraceBlock()} on the same
 * thread.
 */
inline fun beginTraceBlock(tag: String, blockName: String) {
  Trace.beginSection("[$tag] $blockName")
}

/**
 * Writes a trace message to indicate that a given section of code has ended.
 */
inline fun endTraceBlock() {
  Trace.endSection()
}

/**
 * Writes a trace message to indicate that a given section of code has begun.
 *
 * <p>Must be followed by a call to {@link #endAsyncTraceBlock(String, String, int)} with the same
 * tag, blockName and cookie.
 */
inline fun beginAsyncTraceBlock(tag: String, blockName: String, cookie: Int = 0) =
  Trace.beginAsyncSection("[$tag] $blockName", cookie)

/**
 * Writes a trace message to indicate that the current method has ended.
 */
inline fun endAsyncTraceBlock(tag: String, blockName: String, cookie: Int = 0) =
  Trace.endAsyncSection("[$tag] $blockName", cookie)
