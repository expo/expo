@file:Suppress("FunctionName")

package expo.modules.kotlin.functions

import expo.modules.kotlin.Promise
import expo.modules.kotlin.types.toAnyType

class AsyncFunctionBuilder(@PublishedApi internal val name: String) {
  @PublishedApi
  internal var asyncFunctionComponent: BaseAsyncFunctionComponent? = null

  inline fun <reified R> SuspendBody(crossinline block: suspend () -> R): BaseAsyncFunctionComponent {
    return SuspendFunctionComponent(name, emptyArray()) { block() }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0> SuspendBody(crossinline block: suspend (p0: P0) -> R): SuspendFunctionComponent {
    return SuspendFunctionComponent(name, arrayOf(toAnyType<P0>())) { block(it[0] as P0) }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1> SuspendBody(crossinline block: suspend (p0: P0, p1: P1) -> R): SuspendFunctionComponent {
    return SuspendFunctionComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>())) { block(it[0] as P0, it[1] as P1) }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2> SuspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2) -> R): SuspendFunctionComponent {
    return SuspendFunctionComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>())) { block(it[0] as P0, it[1] as P1, it[2] as P2) }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3> SuspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3) -> R): SuspendFunctionComponent {
    return SuspendFunctionComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>(), toAnyType<P3>())) { block(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3) }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> SuspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) -> R): SuspendFunctionComponent {
    return SuspendFunctionComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>(), toAnyType<P3>(), toAnyType<P4>())) { block(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4) }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> SuspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) -> R): SuspendFunctionComponent {
    return SuspendFunctionComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>(), toAnyType<P3>(), toAnyType<P4>(), toAnyType<P5>())) { block(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5) }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> SuspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) -> R): SuspendFunctionComponent {
    return SuspendFunctionComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>(), toAnyType<P3>(), toAnyType<P4>(), toAnyType<P5>(), toAnyType<P6>())) { block(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6) }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> SuspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) -> R): SuspendFunctionComponent {
    return SuspendFunctionComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>(), toAnyType<P3>(), toAnyType<P4>(), toAnyType<P5>(), toAnyType<P6>(), toAnyType<P7>())) { block(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6, it[7] as P7) }.also {
      asyncFunctionComponent = it
    }
  }

  @JvmName("AsyncBodyWithoutArgs")
  inline fun AsyncBody(crossinline body: () -> Any?): AsyncFunction {
    return AsyncFunctionComponent(name, emptyArray()) { body() }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R> AsyncBody(crossinline body: () -> R): AsyncFunction {
    return AsyncFunctionComponent(name, emptyArray()) { body() }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0> AsyncBody(crossinline body: (p0: P0) -> R): AsyncFunction {
    return if (P0::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, emptyArray()) { _, promise -> body(promise as P0) }
    } else {
      AsyncFunctionComponent(name, arrayOf(toAnyType<P0>())) { body(it[0] as P0) }
    }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1> AsyncBody(crossinline body: (p0: P0, p1: P1) -> R): AsyncFunction {
    return if (P1::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf(toAnyType<P0>())) { args, promise -> body(args[0] as P0, promise as P1) }
    } else {
      AsyncFunctionComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>())) { body(it[0] as P0, it[1] as P1) }
    }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2> AsyncBody(crossinline body: (p0: P0, p1: P1, p2: P2) -> R): AsyncFunction {
    return if (P2::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>())) { args, promise -> body(args[0] as P0, args[1] as P1, promise as P2) }
    } else {
      AsyncFunctionComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>())) { body(it[0] as P0, it[1] as P1, it[2] as P2) }
    }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3> AsyncBody(crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3) -> R): AsyncFunction {
    return if (P3::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, promise as P3) }
    } else {
      AsyncFunctionComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>(), toAnyType<P3>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3) }
    }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> AsyncBody(crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) -> R): AsyncFunction {
    return if (P4::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>(), toAnyType<P3>())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, promise as P4) }
    } else {
      AsyncFunctionComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>(), toAnyType<P3>(), toAnyType<P4>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4) }
    }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> AsyncBody(crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) -> R): AsyncFunction {
    return if (P5::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>(), toAnyType<P3>(), toAnyType<P4>())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, args[4] as P4, promise as P5) }
    } else {
      AsyncFunctionComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>(), toAnyType<P3>(), toAnyType<P4>(), toAnyType<P5>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5) }
    }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> AsyncBody(crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) -> R): AsyncFunction {
    return if (P6::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>(), toAnyType<P3>(), toAnyType<P4>(), toAnyType<P5>())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, args[4] as P4, args[5] as P5, promise as P6) }
    } else {
      AsyncFunctionComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>(), toAnyType<P3>(), toAnyType<P4>(), toAnyType<P5>(), toAnyType<P6>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6) }
    }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> AsyncBody(crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) -> R): AsyncFunction {
    return if (P7::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>(), toAnyType<P3>(), toAnyType<P4>(), toAnyType<P5>(), toAnyType<P6>())) { args, promise -> body(args[0] as P0, args[1] as P1, args[2] as P2, args[3] as P3, args[4] as P4, args[5] as P5, args[6] as P6, promise as P7) }
    } else {
      AsyncFunctionComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>(), toAnyType<P3>(), toAnyType<P4>(), toAnyType<P5>(), toAnyType<P6>(), toAnyType<P7>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6, it[7] as P7) }
    }.also {
      asyncFunctionComponent = it
    }
  }

  internal fun build() = requireNotNull(asyncFunctionComponent)
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
