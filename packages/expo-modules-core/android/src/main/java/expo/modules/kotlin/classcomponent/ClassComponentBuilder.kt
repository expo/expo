@file:Suppress("FunctionName")

package expo.modules.kotlin.classcomponent

import expo.modules.kotlin.functions.SyncFunctionComponent
import expo.modules.kotlin.objects.ObjectDefinitionBuilder
import expo.modules.kotlin.objects.PropertyComponentBuilderWithThis
import expo.modules.kotlin.sharedobjects.SharedRef
import expo.modules.kotlin.types.toAnyType
import kotlin.reflect.KClass
import kotlin.reflect.KType
import kotlin.reflect.full.isSubclassOf

class ClassComponentBuilder<SharedObjectType : Any>(
  val name: String,
  private val ownerClass: KClass<SharedObjectType>,
  val ownerType: KType
) : ObjectDefinitionBuilder() {
  var constructor: SyncFunctionComponent? = null

  fun buildClass(): ClassDefinitionData {
    val objectData = buildObject()
    objectData.functions.forEach {
      it.ownerType = ownerType
      it.canTakeOwner = true
    }

    val hasSharedObject = ownerClass !== Unit::class // TODO: Add an empty constructor that throws when called from JS
    if (hasSharedObject && constructor == null && !ownerClass.isSubclassOf(SharedRef::class)) {
      throw IllegalArgumentException("constructor cannot be null")
    }

    val constructor = constructor ?: SyncFunctionComponent("constructor", emptyArray()) {}
    constructor.canTakeOwner = true
    constructor.ownerType = ownerType
    return ClassDefinitionData(
      name,
      constructor,
      objectData
    )
  }

  inline fun Constructor(
    crossinline body: () -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", emptyArray()) { body() }.also {
      constructor = it
    }
  }

  inline fun <reified P0> Constructor(
    crossinline body: (p0: P0) -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf(toAnyType<P0>())) { body(it[0] as P0) }.also {
      constructor = it
    }
  }

  inline fun <reified P0, reified P1> Constructor(
    crossinline body: (p0: P0, p1: P1) -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf(toAnyType<P0>(), toAnyType<P1>())) { body(it[0] as P0, it[1] as P1) }.also {
      constructor = it
    }
  }

  inline fun <reified P0, reified P1, reified P2> Constructor(
    crossinline body: (p0: P0, p1: P1, p2: P2) -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>())) { body(it[0] as P0, it[1] as P1, it[2] as P2) }.also {
      constructor = it
    }
  }

  inline fun <reified P0, reified P1, reified P2, reified P3> Constructor(
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3) -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>(), toAnyType<P3>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3) }.also {
      constructor = it
    }
  }

  inline fun <reified P0, reified P1, reified P2, reified P3, reified P4> Constructor(
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>(), toAnyType<P3>(), toAnyType<P4>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4) }.also {
      constructor = it
    }
  }

  inline fun <reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> Constructor(
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>(), toAnyType<P3>(), toAnyType<P4>(), toAnyType<P5>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5) }.also {
      constructor = it
    }
  }

  inline fun <reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> Constructor(
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>(), toAnyType<P3>(), toAnyType<P4>(), toAnyType<P5>(), toAnyType<P6>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6) }.also {
      constructor = it
    }
  }

  inline fun <reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> Constructor(
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", arrayOf(toAnyType<P0>(), toAnyType<P1>(), toAnyType<P2>(), toAnyType<P3>(), toAnyType<P4>(), toAnyType<P5>(), toAnyType<P6>(), toAnyType<P7>())) { body(it[0] as P0, it[1] as P1, it[2] as P2, it[3] as P3, it[4] as P4, it[5] as P5, it[6] as P6, it[7] as P7) }.also {
      constructor = it
    }
  }

  /**
   * Creates the read-only property whose getter takes the caller as an argument.
   */
  inline fun <T> Property(name: String, crossinline body: (owner: SharedObjectType) -> T): PropertyComponentBuilderWithThis<SharedObjectType> {
    return PropertyComponentBuilderWithThis<SharedObjectType>(ownerType, name).also {
      it.get(body)
      properties[name] = it
    }
  }

  override fun Property(name: String): PropertyComponentBuilderWithThis<SharedObjectType> {
    return PropertyComponentBuilderWithThis<SharedObjectType>(ownerType, name).also {
      properties[name] = it
    }
  }
}
