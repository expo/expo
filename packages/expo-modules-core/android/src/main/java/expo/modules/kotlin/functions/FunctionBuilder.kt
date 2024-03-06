@file:Suppress("FunctionName")

package expo.modules.kotlin.functions

import expo.modules.kotlin.types.toAnyType

class FunctionBuilder(@PublishedApi internal val name: String) {
  @PublishedApi
  internal var functionComponent: SyncFunctionComponent? = null

  @JvmName("BodyWithoutArgs")
  inline fun Body(
    crossinline body: () -> Any?
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, emptyArray()) { body() }.also {
      functionComponent = it
    }
  }

  inline fun <reified R> Body(
    name: String,
    crossinline body: () -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, emptyArray()) { body() }.also {
      functionComponent = it
    }
  }

  inline fun <reified R, reified P0> Body(
    name: String,
    crossinline body: (p0: P0) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, arrayOf(toAnyType<P0>())) { body(it[0] as P0) }.also {
      functionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1> Body(
    name: String,
    crossinline body: (p0: P0, p1: P1) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>())) { body(it[0] as P0, it[1] as P1) }.also {
      functionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2> Body(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>())) { body(it[0] as P0, it[1] as P1, it[2] as P2) }.also {
      functionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3> Body(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>(), toAnyType<P3>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3) }.also {
      functionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> Body(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>(), toAnyType<P3>(), toAnyType<P4>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4) }.also {
      functionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> Body(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>(), toAnyType<P3>(), toAnyType<P4>(), toAnyType<P5>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5) }.also {
      functionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> Body(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>(), toAnyType<P3>(), toAnyType<P4>(), toAnyType<P5>(), toAnyType<P6>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6) }.also {
      functionComponent = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> Body(
    name: String,
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent(name, arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>(), toAnyType<P3>(), toAnyType<P4>(), toAnyType<P5>(), toAnyType<P6>(), toAnyType<P7>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6, it[7] as P7) }.also {
      functionComponent = it
    }
  }

  internal fun build() = requireNotNull(functionComponent)
}
