@file:Suppress("FunctionName")

package expo.modules.kotlin.functions

import expo.modules.kotlin.component6
import expo.modules.kotlin.component7
import expo.modules.kotlin.component8
import expo.modules.kotlin.Promise
import expo.modules.kotlin.types.enforceType
import expo.modules.kotlin.types.toArgsArray

class AsyncFunctionBuilder(@PublishedApi internal val name: String) {
  @PublishedApi
  internal var asyncFunctionComponent: BaseAsyncFunctionComponent? = null

  inline fun <reified R> SuspendBody(crossinline block: suspend () -> R): BaseAsyncFunctionComponent {
    return SuspendFunctionComponent(name, emptyArray()) { block() }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0> SuspendBody(crossinline block: suspend (p0: P0) -> R): SuspendFunctionComponent {
    return SuspendFunctionComponent(name, toArgsArray<P0>()) { (p0) ->
      enforceType<P0>(p0)
      block(p0)
    }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1> SuspendBody(crossinline block: suspend (p0: P0, p1: P1) -> R): SuspendFunctionComponent {
    return SuspendFunctionComponent(name, toArgsArray<P0, P1>()) { (p0, p1) ->
      enforceType<P0, P1>(p0, p1)
      block(p0, p1)
    }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2> SuspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2) -> R): SuspendFunctionComponent {
    return SuspendFunctionComponent(name, toArgsArray<P0, P1, P2>()) { (p0, p1, p2) ->
      enforceType<P0, P1, P2>(p0, p1, p2)
      block(p0, p1, p2)
    }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3> SuspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3) -> R): SuspendFunctionComponent {
    return SuspendFunctionComponent(name, toArgsArray<P0, P1, P2, P3>()) { (p0, p1, p2, p3) ->
      enforceType<P0, P1, P2, P3>(p0, p1, p2, p3)
      block(p0, p1, p2, p3)
    }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> SuspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) -> R): SuspendFunctionComponent {
    return SuspendFunctionComponent(name, toArgsArray<P0, P1, P2, P3, P4>()) { (p0, p1, p2, p3, p4) ->
      enforceType<P0, P1, P2, P3, P4>(p0, p1, p2, p3, p4)
      block(p0, p1, p2, p3, p4)
    }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> SuspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) -> R): SuspendFunctionComponent {
    return SuspendFunctionComponent(name, toArgsArray<P0, P1, P2, P3, P4, P5>()) { (p0, p1, p2, p3, p4, p5) ->
      enforceType<P0, P1, P2, P3, P4, P5>(p0, p1, p2, p3, p4, p5)
      block(p0, p1, p2, p3, p4, p5)
    }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> SuspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) -> R): SuspendFunctionComponent {
    return SuspendFunctionComponent(name, toArgsArray<P0, P1, P2, P3, P4, P5, P6>()) { (p0, p1, p2, p3, p4, p5, p6) ->
      enforceType<P0, P1, P2, P3, P4, P5, P6>(p0, p1, p2, p3, p4, p5, p6)
      block(p0, p1, p2, p3, p4, p5, p6)
    }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> SuspendBody(crossinline block: suspend (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) -> R): SuspendFunctionComponent {
    return SuspendFunctionComponent(name, toArgsArray<P0, P1, P2, P3, P4, P5, P6, P7>()) { (p0, p1, p2, p3, p4, p5, p6, p7) ->
      enforceType<P0, P1, P2, P3, P4, P5, P6, P7>(p0, p1, p2, p3, p4, p5, p6, p7)
      block(p0, p1, p2, p3, p4, p5, p6, p7)
    }.also {
      asyncFunctionComponent = it
    }
  }

  @JvmName("AsyncBodyWithoutArgs")
  inline fun AsyncBody(crossinline body: () -> Any?): AsyncFunction {
    return createAsyncFunctionComponent(name, emptyArray()) { body() }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R> AsyncBody(crossinline body: () -> R): AsyncFunction {
    return createAsyncFunctionComponent(name, emptyArray()) { body() }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0> AsyncBody(crossinline body: (p0: P0) -> R): AsyncFunction {
    return if (P0::class == Promise::class) {
      AsyncFunctionWithPromiseComponent(name, emptyArray()) { _, promise -> body(promise as P0) }
    } else {
      createAsyncFunctionComponent(name, toArgsArray<P0>()) { (p0) ->
        enforceType<P0>(p0)
        body(p0)
      }
    }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1> AsyncBody(crossinline body: (p0: P0, p1: P1) -> R): AsyncFunction {
    return createAsyncFunctionComponent(name, toArgsArray<P0, P1>()) { (p0, p1) ->
      enforceType<P0, P1>(p0, p1)
      body(p0, p1)
    }.also {
      asyncFunctionComponent = it
    }
  }

  @JvmName("AsyncFunctionWithPromise")
  inline fun <reified R, reified P0> AsyncBody(crossinline body: (p0: P0, p1: Promise) -> R): AsyncFunction {
    return AsyncFunctionWithPromiseComponent(name, toArgsArray<P0>()) { (p0), promise ->
      enforceType<P0>(p0)
      body(p0, promise)
    }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2> AsyncBody(crossinline body: (p0: P0, p1: P1, p2: P2) -> R): AsyncFunction {
    return createAsyncFunctionComponent(name, toArgsArray<P0, P1, P2>()) { (p0, p1, p2) ->
      enforceType<P0, P1, P2>(p0, p1, p2)
      body(p0, p1, p2)
    }.also {
      asyncFunctionComponent = it
    }
  }

  @JvmName("AsyncFunctionWithPromise")
  inline fun <reified R, reified P0, reified P1> AsyncBody(crossinline body: (p0: P0, p1: P1, p2: Promise) -> R): AsyncFunction {
    return AsyncFunctionWithPromiseComponent(name, toArgsArray<P0, P1>()) { (p0, p1), promise ->
      enforceType<P0, P1>(p0, p1)
      body(p0, p1, promise)
    }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3> AsyncBody(crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3) -> R): AsyncFunction {
    return createAsyncFunctionComponent(name, toArgsArray<P0, P1, P2, P3>()) { (p0, p1, p2, p3) ->
      enforceType<P0, P1, P2, P3>(p0, p1, p2, p3)
      body(p0, p1, p2, p3)
    }.also {
      asyncFunctionComponent = it
    }
  }

  @JvmName("AsyncFunctionWithPromise")
  inline fun <reified R, reified P0, reified P1, reified P2> AsyncBody(crossinline body: (p0: P0, p1: P1, p2: P2, p3: Promise) -> R): AsyncFunction {
    return AsyncFunctionWithPromiseComponent(name, toArgsArray<P0, P1, P2>()) { (p0, p1, p2), promise ->
      enforceType<P0, P1, P2>(p0, p1, p2)
      body(p0, p1, p2, promise)
    }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> AsyncBody(crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) -> R): AsyncFunction {
    return createAsyncFunctionComponent(name, toArgsArray<P0, P1, P2, P3, P4>()) { (p0, p1, p2, p3, p4) ->
      enforceType<P0, P1, P2, P3, P4>(p0, p1, p2, p3, p4)
      body(p0, p1, p2, p3, p4)
    }.also {
      asyncFunctionComponent = it
    }
  }

  @JvmName("AsyncFunctionWithPromise")
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3> AsyncBody(crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: Promise) -> R): AsyncFunction {
    return AsyncFunctionWithPromiseComponent(name, toArgsArray<P0, P1, P2, P3>()) { (p0, p1, p2, p3), promise ->
      enforceType<P0, P1, P2, P3>(p0, p1, p2, p3)
      body(p0, p1, p2, p3, promise)
    }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> AsyncBody(crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) -> R): AsyncFunction {
    return createAsyncFunctionComponent(name, toArgsArray<P0, P1, P2, P3, P4, P5>()) { (p0, p1, p2, p3, p4, p5) ->
      enforceType<P0, P1, P2, P3, P4, P5>(p0, p1, p2, p3, p4, p5)
      body(p0, p1, p2, p3, p4, p5)
    }.also {
      asyncFunctionComponent = it
    }
  }

  @JvmName("AsyncFunctionWithPromise")
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> AsyncBody(crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: Promise) -> R): AsyncFunction {
    return AsyncFunctionWithPromiseComponent(name, toArgsArray<P0, P1, P2, P3, P4>()) { (p0, p1, p2, p3, p4), promise ->
      enforceType<P0, P1, P2, P3, P4>(p0, p1, p2, p3, p4)
      body(p0, p1, p2, p3, p4, promise)
    }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> AsyncBody(crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) -> R): AsyncFunction {
    return createAsyncFunctionComponent(name, toArgsArray<P0, P1, P2, P3, P4, P5, P6>()) { (p0, p1, p2, p3, p4, p5, p6) ->
      enforceType<P0, P1, P2, P3, P4, P5, P6>(p0, p1, p2, p3, p4, p5, p6)
      body(p0, p1, p2, p3, p4, p5, p6)
    }.also {
      asyncFunctionComponent = it
    }
  }

  @JvmName("AsyncFunctionWithPromise")
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> AsyncBody(crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: Promise) -> R): AsyncFunction {
    return AsyncFunctionWithPromiseComponent(name, toArgsArray<P0, P1, P2, P3, P4, P5>()) { (p0, p1, p2, p3, p4, p5), promise ->
      enforceType<P0, P1, P2, P3, P4, P5>(p0, p1, p2, p3, p4, p5)
      body(p0, p1, p2, p3, p4, p5, promise)
    }.also {
      asyncFunctionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> AsyncBody(crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) -> R): AsyncFunction {
    return createAsyncFunctionComponent(name, toArgsArray<P0, P1, P2, P3, P4, P5, P6, P7>()) { (p0, p1, p2, p3, p4, p5, p6, p7) ->
      enforceType<P0, P1, P2, P3, P4, P5, P6, P7>(p0, p1, p2, p3, p4, p5, p6, p7)
      body(p0, p1, p2, p3, p4, p5, p6, p7)
    }.also {
      asyncFunctionComponent = it
    }
  }

  @JvmName("AsyncFunctionWithPromise")
  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> AsyncBody(crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: Promise) -> R): AsyncFunction {
    return AsyncFunctionWithPromiseComponent(name, toArgsArray<P0, P1, P2, P3, P4, P5, P6>()) { (p0, p1, p2, p3, p4, p5, p6), promise ->
      enforceType<P0, P1, P2, P3, P4, P5, P6>(p0, p1, p2, p3, p4, p5, p6)
      body(p0, p1, p2, p3, p4, p5, p6, promise)
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
