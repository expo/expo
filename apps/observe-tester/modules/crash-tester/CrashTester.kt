package expo.modules.crashtester

import android.os.Handler
import android.os.Looper
import android.os.Process
import android.system.Os
import android.system.OsConstants
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.types.Enumerable

/**
 * Crash kinds accepted by `triggerCrash`. Raw values match the TypeScript
 * `CrashKind` union (named after the iOS triggers); each maps to the closest
 * Android equivalent. The `rawValue: String` parameter must stay the only
 * primary-constructor argument — it's what Expo's `Enumerable` converter
 * inspects.
 */
enum class CrashKind(val rawValue: String) : Enumerable {
  /**
   * On Android: the process kills itself with SIGSEGV — a *signaled* death,
   * not a tombstoned native crash. Bare signals are outside the standalone
   * crash allowlist, so this kind tests process-death behavior but produces
   * no stored crash report.
   */
  BAD_ACCESS("badAccess"),
  FATAL_ERROR("fatalError"),
  DIVIDE_BY_ZERO("divideByZero"),
  FORCE_UNWRAP_NIL("forceUnwrapNil"),
  ARRAY_OUT_OF_BOUNDS("arrayOutOfBounds"),

  /** No ObjC on Android — throws a generic runtime exception instead. */
  OBJC_EXCEPTION("objcException"),
  STACK_OVERFLOW("stackOverflow")
}

/**
 * Inline module that exposes crash triggers to the observe-tester app. Test-only:
 * it intentionally crashes the process to exercise the crash-reporting pipeline.
 */
class CrashTester : Module() {
  override fun definition() = ModuleDefinition {
    Function("triggerCrash") { kind: CrashKind ->
      CrashTriggers.trigger(kind)
    }
  }
}

/**
 * Intentionally crashes the app to exercise the real crash-reporting pipeline.
 * Use only for testing.
 *
 * JVM kinds throw from a `Runnable` posted to the main looper — never from the
 * module function body, where expo-modules-core's exception decorator would
 * catch the throw and turn it into a JS error instead of a crash.
 */
object CrashTriggers {
  fun trigger(kind: CrashKind) {
    if (kind == CrashKind.BAD_ACCESS) {
      // Signal-based death is immediate; no JVM throw involved.
      Os.kill(Process.myPid(), OsConstants.SIGSEGV)
      return
    }
    Handler(Looper.getMainLooper()).post {
      throwFor(kind)
    }
  }

  private fun throwFor(kind: CrashKind): Nothing {
    when (kind) {
      CrashKind.FATAL_ERROR ->
        throw RuntimeException("Intentional crash for crash-reporting test")
      CrashKind.DIVIDE_BY_ZERO -> {
        // Computed denominator so the compiler can't reject a constant 1/0.
        val zero = "0".toInt()
        throw IllegalStateException("unreachable: ${1 / zero}")
      }
      CrashKind.FORCE_UNWRAP_NIL -> {
        val value: String? = null
        throw IllegalStateException("unreachable: ${value!!.length}")
      }
      CrashKind.ARRAY_OUT_OF_BOUNDS ->
        throw IllegalStateException("unreachable: ${emptyList<Int>()[5]}")
      CrashKind.OBJC_EXCEPTION ->
        throw IllegalStateException("Intentional exception for crash-reporting test")
      CrashKind.STACK_OVERFLOW ->
        overflow(0)
      CrashKind.BAD_ACCESS ->
        throw IllegalStateException("badAccess is signal-based and handled in trigger()")
    }
  }

  // Accumulates through the result so the recursion can't be optimized away.
  private fun overflow(depth: Int): Nothing {
    overflow(depth + 1)
  }
}
