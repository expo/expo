@file:OptIn(ExperimentalStdlibApi::class)
@file:Suppress("FunctionName")

package expo.modules.kotlin.functions

import expo.modules.kotlin.types.toAnyType
import kotlin.reflect.typeOf

class AsyncFunctionBuilder(@PublishedApi internal val name: String) {
  @PublishedApi
  internal var suspendFunctionComponent: SuspendFunctionComponent? = null

  inline fun <reified R> SuspendBody(crossinline block: suspend () -> R): SuspendFunctionComponent {
    return SuspendFunctionComponent(name, arrayOf()) { block() }.also {
      suspendFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0> SuspendBody(crossinline block: suspend (p0: P0) -> R): SuspendFunctionComponent {
    return SuspendFunctionComponent(name, arrayOf(typeOf<P0>().toAnyType())) { block(it[0] as P0) }.also {
      suspendFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1> SuspendBody(crossinline block: suspend (p0: P0, p1: P1) -> R): SuspendFunctionComponent {
    return SuspendFunctionComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType())) { block(it[0] as P0, it[1] as P1) }.also {
      suspendFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2> SuspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2) -> R): SuspendFunctionComponent {
    return SuspendFunctionComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType())) { block(it[0] as P0, it[1] as P1, it[2] as P2) }.also {
      suspendFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3> SuspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3) -> R): SuspendFunctionComponent {
    return SuspendFunctionComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType())) { block(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3) }.also {
      suspendFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> SuspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) -> R): SuspendFunctionComponent {
    return SuspendFunctionComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType())) { block(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4) }.also {
      suspendFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> SuspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) -> R): SuspendFunctionComponent {
    return SuspendFunctionComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType())) { block(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5) }.also {
      suspendFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> SuspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) -> R): SuspendFunctionComponent {
    return SuspendFunctionComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType(), typeOf<P6>().toAnyType())) { block(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6) }.also {
      suspendFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> SuspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) -> R): SuspendFunctionComponent {
    return SuspendFunctionComponent(name, arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType(), typeOf<P6>().toAnyType(), typeOf<P7>().toAnyType())) { block(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6, it[7] as P7) }.also {
      suspendFunctionComponent = it
    }
  }

  internal fun build() = requireNotNull(suspendFunctionComponent)
}

inline infix fun <reified R> AsyncFunctionBuilder.Coroutine(crossinline block: suspend () -> R) = SuspendBody(block)
inline infix fun <reified R, reified P0> AsyncFunctionBuilder.Coroutine(crossinline block: suspend (P0) -> R) = SuspendBody(block)
inline infix fun <reified R, reified P0, reified P1> AsyncFunctionBuilder.Coroutine(crossinline block: suspend (P0, P1) -> R) = SuspendBody(block)
inline infix fun <reified R, reified P0, reified P1, reified P2> AsyncFunctionBuilder.Coroutine(crossinline block: suspend (P0, P1, P2) -> R) = SuspendBody(block)
inline infix fun <reified R, reified P0, reified P1, reified P2, reified P3> AsyncFunctionBuilder.Coroutine(crossinline block: suspend (P0, P1, P2, P3) -> R) = SuspendBody(block)
inline infix fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> AsyncFunctionBuilder.Coroutine(crossinline block: suspend (P0, P1, P2, P3, P4) -> R) = SuspendBody(block)
inline infix fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> AsyncFunctionBuilder.Coroutine(crossinline block: suspend (P0, P1, P2, P3, P4, P5) -> R) = SuspendBody(block)
inline infix fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> AsyncFunctionBuilder.Coroutine(crossinline block: suspend (P0, P1, P2, P3, P4, P5, P6) -> R) = SuspendBody(block)
inline infix fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> AsyncFunctionBuilder.Coroutine(crossinline block: suspend (P0, P1, P2, P3, P4, P5, P6, P7) -> R) = SuspendBody(block)
