@file:Suppress("FunctionName")

package expo.modules.kotlin.classcomponent

import expo.modules.kotlin.functions.SyncFunctionComponent
import expo.modules.kotlin.objects.ObjectDefinitionBuilder
import expo.modules.kotlin.types.toAnyType
import kotlin.reflect.KClass
import kotlin.reflect.KType
import kotlin.reflect.typeOf

class ClassComponentBuilder<SharedObjectType : Any>(
  val name: String,
  private val ownerClass: KClass<SharedObjectType>,
  private val ownerType: KType
) : ObjectDefinitionBuilder() {
  var constructor: SyncFunctionComponent? = null

  fun buildClass(): ClassDefinitionData {
    val objectData = buildObject()
    objectData.functions.forEach {
      it.ownerType = ownerType
      it.canTakeOwner = true
    }

    val hasSharedObject = ownerClass !== Unit::class
    if (hasSharedObject && constructor == null) {
      throw IllegalArgumentException("constructor cannot be null")
    }

    val constructor = constructor ?: SyncFunctionComponent("constructor", arrayOf()) {}
    constructor.canTakeOwner = true

    return ClassDefinitionData(
      name,
      constructor,
      objectData,
    )
  }

  inline fun Constructor(
    crossinline body: () -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf()) { body() }.also {
      constructor = it
    }
  }

  inline fun <reified P0> Constructor(
    crossinline body: (p0: P0) -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf({ typeOf<P0>() }.toAnyType<P0>())) { body(it[0] as P0) }.also {
      constructor = it
    }
  }

  inline fun <reified P0, reified P1> Constructor(
    crossinline body: (p0: P0, p1: P1) -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>())) { body(it[0] as P0, it[1] as P1) }.also {
      constructor = it
    }
  }

  inline fun <reified P0, reified P1, reified P2> Constructor(
    crossinline body: (p0: P0, p1: P1, p2: P2) -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>())) { body(it[0] as P0, it[1] as P1, it[2] as P2) }.also {
      constructor = it
    }
  }

  inline fun <reified P0, reified P1, reified P2, reified P3> Constructor(
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3) -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3) }.also {
      constructor = it
    }
  }

  inline fun <reified P0, reified P1, reified P2, reified P3, reified P4> Constructor(
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>(), { typeOf<P4>() }.toAnyType<P4>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4) }.also {
      constructor = it
    }
  }

  inline fun <reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> Constructor(
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>(), { typeOf<P4>() }.toAnyType<P4>(), { typeOf<P5>() }.toAnyType<P5>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5) }.also {
      constructor = it
    }
  }

  inline fun <reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> Constructor(
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>(), { typeOf<P4>() }.toAnyType<P4>(), { typeOf<P5>() }.toAnyType<P5>(), { typeOf<P6>() }.toAnyType<P6>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6) }.also {
      constructor = it
    }
  }

  inline fun <reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> Constructor(
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf({ typeOf<P0>() }.toAnyType<P0>(), { typeOf<P1>() }.toAnyType<P1>(), { typeOf<P2>() }.toAnyType<P2>(), { typeOf<P3>() }.toAnyType<P3>(), { typeOf<P4>() }.toAnyType<P4>(), { typeOf<P5>() }.toAnyType<P5>(), { typeOf<P6>() }.toAnyType<P6>(), { typeOf<P7>() }.toAnyType<P7>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6, it[7] as P7) }.also {
      constructor = it
    }
  }
}
