@file:OptIn(ExperimentalStdlibApi::class)
@file:Suppress("FunctionName")

package expo.modules.kotlin.functions

import expo.modules.kotlin.types.toAnyType
import kotlin.reflect.typeOf

class AsyncFunctionBuilder(val name: String) {
  @PublishedApi
  internal var function: AnyFunction? = null

  @Deprecated(
    message = "The 'suspendBody' component was renamed to 'SuspendBody'.",
    replaceWith = ReplaceWith("SuspendBody(block)")
  )
  inline fun <reified R> suspendBody(crossinline block: suspend () -> R) = SuspendBody(block)

  inline fun <reified R> SuspendBody(crossinline block: suspend () -> R) {
    function = AsyncSuspendFunction(name, arrayOf()) { block() }
  }

  @Deprecated(
    message = "The 'suspendBody' component was renamed to 'SuspendBody'.",
    replaceWith = ReplaceWith("SuspendBody(block)")
  )
  inline fun <reified R, reified P0> suspendBody(crossinline block: suspend (p0: P0) -> R) = SuspendBody(block)

  inline fun <reified R, reified P0> SuspendBody(crossinline block: suspend (p0: P0) -> R) {
    function = AsyncSuspendFunction(name, arrayOf(typeOf<P0>().toAnyType())) { block(it[0] as P0) }
  }

  @Deprecated(
    message = "The 'suspendBody' component was renamed to 'SuspendBody'.",
    replaceWith = ReplaceWith("SuspendBody(block)")
  )
  inline fun <reified R, reified P0, reified P1> suspendBody(crossinline block: suspend (p0: P0, p1: P1) -> R) = SuspendBody(block)

  inline fun <reified R, reified P0, reified P1> SuspendBody(crossinline block: suspend (p0: P0, p1: P1) -> R) {
    function = AsyncSuspendFunction(name, arrayOf(typeOf<P0>().toAnyType())) { block(it[0] as P0, it[0] as P1) }
  }

  @Deprecated(
    message = "The 'suspendBody' component was renamed to 'SuspendBody'.",
    replaceWith = ReplaceWith("SuspendBody(block)")
  )
  inline fun <reified R, reified P0, reified P1, reified P2> suspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2) -> R) = SuspendBody(block)

  inline fun <reified R, reified P0, reified P1, reified P2> SuspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2) -> R) {
    function = AsyncSuspendFunction(name, arrayOf(typeOf<P0>().toAnyType())) { block(it[0] as P0, it[1] as P1, it[2] as P2) }
  }

  @Deprecated(
    message = "The 'suspendBody' component was renamed to 'SuspendBody'.",
    replaceWith = ReplaceWith("SuspendBody(block)")
  )
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3> suspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3) -> R) = SuspendBody(block)

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3> SuspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3) -> R) {
    function = AsyncSuspendFunction(name, arrayOf(typeOf<P0>().toAnyType())) { block(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3) }
  }

  @Deprecated(
    message = "The 'suspendBody' component was renamed to 'SuspendBody'.",
    replaceWith = ReplaceWith("SuspendBody(block)")
  )
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> suspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) -> R) = SuspendBody(block)

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> SuspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) -> R) {
    function = AsyncSuspendFunction(name, arrayOf(typeOf<P0>().toAnyType())) { block(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4) }
  }

  @Deprecated(
    message = "The 'suspendBody' component was renamed to 'SuspendBody'.",
    replaceWith = ReplaceWith("SuspendBody(block)")
  )
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> suspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) -> R) = SuspendBody(block)

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> SuspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) -> R) {
    function = AsyncSuspendFunction(name, arrayOf(typeOf<P0>().toAnyType())) { block(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5) }
  }

  @Deprecated(
    message = "The 'suspendBody' component was renamed to 'SuspendBody'.",
    replaceWith = ReplaceWith("SuspendBody(block)")
  )
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> suspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) -> R) = SuspendBody(block)

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> SuspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) -> R) {
    function = AsyncSuspendFunction(name, arrayOf(typeOf<P0>().toAnyType())) { block(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6) }
  }

  @Deprecated(
    message = "The 'suspendBody' component was renamed to 'SuspendBody'.",
    replaceWith = ReplaceWith("SuspendBody(block)")
  )
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> suspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) -> R) = SuspendBody(block)

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> SuspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) -> R) {
    function = AsyncSuspendFunction(name, arrayOf(typeOf<P0>().toAnyType())) { block(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6, it[7] as P7) }
  }

  internal fun build(): Pair<String, AnyFunction> {
    return name to requireNotNull(function)
  }
}

@Deprecated(
  message = "The 'coroutine' component was renamed to 'Coroutine'.",
  replaceWith = ReplaceWith("Coroutine(block)")
)
inline infix fun <reified R> AsyncFunctionBuilder.coroutine(crossinline block: suspend () -> R) = Coroutine(block)

@Deprecated(
  message = "The 'coroutine' component was renamed to 'Coroutine'.",
  replaceWith = ReplaceWith("Coroutine(block)")
)
inline infix fun <reified R, reified P0> AsyncFunctionBuilder.coroutine(crossinline block: suspend (P0) -> R) = Coroutine(block)

@Deprecated(
  message = "The 'coroutine' component was renamed to 'Coroutine'.",
  replaceWith = ReplaceWith("Coroutine(block)")
)
inline infix fun <reified R, reified P0, reified P1> AsyncFunctionBuilder.coroutine(crossinline block: suspend (P0, P1) -> R) = Coroutine(block)

@Deprecated(
  message = "The 'coroutine' component was renamed to 'Coroutine'.",
  replaceWith = ReplaceWith("Coroutine(block)")
)
inline infix fun <reified R, reified P0, reified P1, reified P2> AsyncFunctionBuilder.coroutine(crossinline block: suspend (P0, P1, P2) -> R) = Coroutine(block)

@Deprecated(
  message = "The 'coroutine' component was renamed to 'Coroutine'.",
  replaceWith = ReplaceWith("Coroutine(block)")
)
inline infix fun <reified R, reified P0, reified P1, reified P2, reified P3> AsyncFunctionBuilder.coroutine(crossinline block: suspend (P0, P1, P2, P3) -> R) = Coroutine(block)

@Deprecated(
  message = "The 'coroutine' component was renamed to 'Coroutine'.",
  replaceWith = ReplaceWith("Coroutine(block)")
)
inline infix fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> AsyncFunctionBuilder.coroutine(crossinline block: suspend (P0, P1, P2, P3, P4) -> R) = Coroutine(block)

@Deprecated(
  message = "The 'coroutine' component was renamed to 'Coroutine'.",
  replaceWith = ReplaceWith("Coroutine(block)")
)
inline infix fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> AsyncFunctionBuilder.coroutine(crossinline block: suspend (P0, P1, P2, P3, P4, P5) -> R) = Coroutine(block)

@Deprecated(
  message = "The 'coroutine' component was renamed to 'Coroutine'.",
  replaceWith = ReplaceWith("Coroutine(block)")
)
inline infix fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> AsyncFunctionBuilder.coroutine(crossinline block: suspend (P0, P1, P2, P3, P4, P5, P6) -> R) = Coroutine(block)

@Deprecated(
  message = "The 'coroutine' component was renamed to 'Coroutine'.",
  replaceWith = ReplaceWith("Coroutine(block)")
)
inline infix fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> AsyncFunctionBuilder.coroutine(crossinline block: suspend (P0, P1, P2, P3, P4, P5, P6, P7) -> R) = Coroutine(block)

inline infix fun <reified R> AsyncFunctionBuilder.Coroutine(crossinline block: suspend () -> R) = SuspendBody(block)
inline infix fun <reified R, reified P0> AsyncFunctionBuilder.Coroutine(crossinline block: suspend (P0) -> R) = SuspendBody(block)
inline infix fun <reified R, reified P0, reified P1> AsyncFunctionBuilder.Coroutine(crossinline block: suspend (P0, P1) -> R) = SuspendBody(block)
inline infix fun <reified R, reified P0, reified P1, reified P2> AsyncFunctionBuilder.Coroutine(crossinline block: suspend (P0, P1, P2) -> R) = SuspendBody(block)
inline infix fun <reified R, reified P0, reified P1, reified P2, reified P3> AsyncFunctionBuilder.Coroutine(crossinline block: suspend (P0, P1, P2, P3) -> R) = SuspendBody(block)
inline infix fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> AsyncFunctionBuilder.Coroutine(crossinline block: suspend (P0, P1, P2, P3, P4) -> R) = SuspendBody(block)
inline infix fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> AsyncFunctionBuilder.Coroutine(crossinline block: suspend (P0, P1, P2, P3, P4, P5) -> R) = SuspendBody(block)
inline infix fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> AsyncFunctionBuilder.Coroutine(crossinline block: suspend (P0, P1, P2, P3, P4, P5, P6) -> R) = SuspendBody(block)
inline infix fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> AsyncFunctionBuilder.Coroutine(crossinline block: suspend (P0, P1, P2, P3, P4, P5, P6, P7) -> R) = SuspendBody(block)
