@file:Suppress("FunctionName")

package expo.modules.kotlin.classcomponent

import expo.modules.kotlin.functions.SyncFunctionComponent
import expo.modules.kotlin.objects.ObjectDefinitionBuilder
import expo.modules.kotlin.types.toAnyType
import kotlin.reflect.typeOf

class ClassComponentBuilder(val name: String) : ObjectDefinitionBuilder() {
  var constructor: SyncFunctionComponent? = null

  fun buildClass(): ClassDefinitionData {
    val objectData = buildObject()
    objectData.functions.forEach { it.canTakeOwner = true }
    return ClassDefinitionData(
      name,
      constructor ?: SyncFunctionComponent("constructor", arrayOf()) {},
      objectData,
    )
  }

  inline fun Constructor(
    crossinline body: () -> Unit
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf()) { body() }.also {
      constructor = it
    }
  }

  inline fun <reified R, reified P0> Constructor(
    crossinline body: (p0: P0) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf(typeOf<P0>().toAnyType())) { body(it[0] as P0) }.also {
      constructor = it
    }
  }

  inline fun <reified R, reified P0, reified P1> Constructor(
    crossinline body: (p0: P0, p1: P1) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType())) { body(it[0] as P0, it[1] as P1) }.also {
      constructor = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2> Constructor(
    crossinline body: (p0: P0, p1: P1, p2: P2) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2) }.also {
      constructor = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3> Constructor(
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3) }.also {
      constructor = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4> Constructor(
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4) }.also {
      constructor = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> Constructor(
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5) }.also {
      constructor = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> Constructor(
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType(), typeOf<P6>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6) }.also {
      constructor = it
    }
  }

  inline fun <reified R, reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> Constructor(
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) -> R
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf(typeOf<P0>().toAnyType(), typeOf<P1>().toAnyType(), typeOf<P2>().toAnyType(), typeOf<P3>().toAnyType(), typeOf<P4>().toAnyType(), typeOf<P5>().toAnyType(), typeOf<P6>().toAnyType(), typeOf<P7>().toAnyType())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6, it[7] as P7) }.also {
      constructor = it
    }
  }
}
