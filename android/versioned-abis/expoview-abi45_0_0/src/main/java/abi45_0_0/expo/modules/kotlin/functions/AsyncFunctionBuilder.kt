@file:OptIn(ExperimentalStdlibApi::class)

package abi45_0_0.expo.modules.kotlin.functions

import abi45_0_0.expo.modules.kotlin.types.toAnyType
import kotlin.reflect.typeOf

class AsyncFunctionBuilder(val name: String) {
  @PublishedApi
  internal var function: AnyFunction? = null

  inline fun <reified R> suspendBody(crossinline block: suspend () -> R) {
    function = AsyncSuspendFunction(name, arrayOf()) { block() }
  }

  inline fun <reified R, reified P0> suspendBody(crossinline block: suspend (p0: P0) -> R) {
    function = AsyncSuspendFunction(name, arrayOf(typeOf<P0>().toAnyType())) { block(it[0] as P0) }
  }

  inline fun <reified R, reified P0, reified P1> suspendBody(crossinline block: suspend (p0: P0, p1: P1) -> R) {
    function = AsyncSuspendFunction(name, arrayOf(typeOf<P0>().toAnyType())) { block(it[0] as P0, it[0] as P1) }
  }

  inline fun <reified R, reified P0, reified P1, reified P2> suspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2) -> R) {
    function = AsyncSuspendFunction(name, arrayOf(typeOf<P0>().toAnyType())) { block(it[0] as P0, it[1] as P1, it[2] as P2) }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3> suspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3) -> R) {
    function = AsyncSuspendFunction(name, arrayOf(typeOf<P0>().toAnyType())) { block(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3) }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> suspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) -> R) {
    function = AsyncSuspendFunction(name, arrayOf(typeOf<P0>().toAnyType())) { block(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4) }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> suspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) -> R) {
    function = AsyncSuspendFunction(name, arrayOf(typeOf<P0>().toAnyType())) { block(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5) }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> suspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) -> R) {
    function = AsyncSuspendFunction(name, arrayOf(typeOf<P0>().toAnyType())) { block(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6) }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> suspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) -> R) {
    function = AsyncSuspendFunction(name, arrayOf(typeOf<P0>().toAnyType())) { block(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6, it[7] as P7) }
  }

  internal fun build(): Pair<String, AnyFunction> {
    return name to requireNotNull(function)
  }
}

inline infix fun <reified R> AsyncFunctionBuilder.coroutine(crossinline block: suspend () -> R) = suspendBody(block)
inline infix fun <reified R, reified P0> AsyncFunctionBuilder.coroutine(crossinline block: suspend (P0) -> R) = suspendBody(block)
inline infix fun <reified R, reified P0, reified P1> AsyncFunctionBuilder.coroutine(crossinline block: suspend (P0, P1) -> R) = suspendBody(block)
inline infix fun <reified R, reified P0, reified P1, reified P2> AsyncFunctionBuilder.coroutine(crossinline block: suspend (P0, P1, P2) -> R) = suspendBody(block)
inline infix fun <reified R, reified P0, reified P1, reified P2, reified P3> AsyncFunctionBuilder.coroutine(crossinline block: suspend (P0, P1, P2, P3) -> R) = suspendBody(block)
inline infix fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> AsyncFunctionBuilder.coroutine(crossinline block: suspend (P0, P1, P2, P3, P4) -> R) = suspendBody(block)
inline infix fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> AsyncFunctionBuilder.coroutine(crossinline block: suspend (P0, P1, P2, P3, P4, P5) -> R) = suspendBody(block)
inline infix fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> AsyncFunctionBuilder.coroutine(crossinline block: suspend (P0, P1, P2, P3, P4, P5, P6) -> R) = suspendBody(block)
inline infix fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> AsyncFunctionBuilder.coroutine(crossinline block: suspend (P0, P1, P2, P3, P4, P5, P6, P7) -> R) = suspendBody(block)
