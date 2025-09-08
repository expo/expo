@file:Suppress("FunctionName")

package expo.modules.kotlin.classcomponent

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.component6
import expo.modules.kotlin.component7
import expo.modules.kotlin.component8
import expo.modules.kotlin.functions.SyncFunctionComponent
import expo.modules.kotlin.objects.ObjectDefinitionBuilder
import expo.modules.kotlin.objects.PropertyComponentBuilderWithThis
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.sharedobjects.isSharedObjectClass
import expo.modules.kotlin.sharedobjects.isSharedRefClass
import expo.modules.kotlin.traits.Trait
import expo.modules.kotlin.types.AnyType
import expo.modules.kotlin.types.TypeConverterProvider
import expo.modules.kotlin.types.enforceType
import expo.modules.kotlin.types.toAnyType
import expo.modules.kotlin.types.toArgsArray
import expo.modules.kotlin.types.toReturnType
import kotlin.reflect.KClass

class ClassComponentBuilder<SharedObjectType : Any>(
  private val appContext: AppContext,
  val name: String,
  private val ownerClass: KClass<SharedObjectType>,
  val ownerType: AnyType,
  converters: TypeConverterProvider? = null
) : ObjectDefinitionBuilder(converters) {
  var constructor: SyncFunctionComponent? = null
  val traits = mutableListOf<Trait<in SharedObjectType>>()

  fun buildClass(): ClassDefinitionData {
    val hasOwnerType = ownerClass != Unit::class
    val isSharedObject = hasOwnerType && ownerClass.isSharedObjectClass()
    val isSharedRef = hasOwnerType && ownerClass.isSharedRefClass()

    if (eventsDefinition != null && isSharedObject) {
      listOf("__expo_onStartListeningToEvent" to SharedObject::onStartListeningToEvent, "__expo_onStopListeningToEvent" to SharedObject::onStopListeningToEvent)
        .forEach { (name, listener) ->
          SyncFunctionComponent(name, arrayOf(ownerType, toAnyType<String>()), toReturnType<Unit>()) { (self, eventName) ->
            enforceType<SharedObject, String>(self, eventName)
            listener.invoke(self, eventName)
          }.also { function ->
            function.enumerable(false)
            syncFunctions[name] = function
          }
        }
    }

    val objectData = buildObject() + traits.map { t -> t.export(appContext) }.reduceOrNull { t1, t2 -> t1 + t2 }

    objectData.functions.forEach {
      it.ownerType = ownerType.kType
      it.canTakeOwner = true
    }

    // TODO: Add an empty constructor that throws when called from JS
    if (hasOwnerType && constructor == null && !isSharedRef) {
      throw IllegalArgumentException("constructor cannot be null")
    }

    val constructor = constructor ?: SyncFunctionComponent(
      "constructor",
      emptyArray(),
      toReturnType<Unit>()
    ) {}
    constructor.canTakeOwner = true
    constructor.ownerType = ownerType.kType

    return ClassDefinitionData(
      name,
      constructor,
      objectData,
      isSharedRef
    )
  }

  fun UseTrait(trait: Trait<in SharedObjectType>) {
    traits.add(trait)
  }

  inline fun Constructor(
    crossinline body: () -> SharedObjectType
  ): SyncFunctionComponent {
    // TODO(@lukmccall): figure out how to pass `SharedObjectType` to the function component as a return type
    return SyncFunctionComponent("constructor", emptyArray(), toReturnType<Any>()) { body() }.also {
      constructor = it
    }
  }

  inline fun <reified P0> Constructor(
    crossinline body: (p0: P0) -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", toArgsArray<P0>(converterProvider = converters), toReturnType<Any>()) { (p0) ->
      enforceType<P0>(p0)
      body(p0)
    }.also {
      constructor = it
    }
  }

  inline fun <reified P0, reified P1> Constructor(
    crossinline body: (p0: P0, p1: P1) -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", toArgsArray<P0, P1>(converterProvider = converters), toReturnType<Any>()) { (p0, p1) ->
      enforceType<P0, P1>(p0, p1)
      body(p0, p1)
    }.also {
      constructor = it
    }
  }

  inline fun <reified P0, reified P1, reified P2> Constructor(
    crossinline body: (p0: P0, p1: P1, p2: P2) -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", toArgsArray<P0, P1, P2>(converterProvider = converters), toReturnType<Any>()) { (p0, p1, p2) ->
      enforceType<P0, P1, P2>(p0, p1, p2)
      body(p0, p1, p2)
    }.also {
      constructor = it
    }
  }

  inline fun <reified P0, reified P1, reified P2, reified P3> Constructor(
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3) -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", toArgsArray<P0, P1, P2, P3>(converterProvider = converters), toReturnType<Any>()) { (p0, p1, p2, p3) ->
      enforceType<P0, P1, P2, P3>(p0, p1, p2, p3)
      body(p0, p1, p2, p3)
    }.also {
      constructor = it
    }
  }

  inline fun <reified P0, reified P1, reified P2, reified P3, reified P4> Constructor(
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", toArgsArray<P0, P1, P2, P3, P4>(converterProvider = converters), toReturnType<Any>()) { (p0, p1, p2, p3, p4) ->
      enforceType<P0, P1, P2, P3, P4>(p0, p1, p2, p3, p4)
      body(p0, p1, p2, p3, p4)
    }.also {
      constructor = it
    }
  }

  inline fun <reified P0, reified P1, reified P2, reified P3, reified P4, reified P5> Constructor(
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", toArgsArray<P0, P1, P2, P3, P4, P5>(converterProvider = converters), toReturnType<Any>()) { (p0, p1, p2, p3, p4, p5) ->
      enforceType<P0, P1, P2, P3, P4, P5>(p0, p1, p2, p3, p4, p5)
      body(p0, p1, p2, p3, p4, p5)
    }.also {
      constructor = it
    }
  }

  inline fun <reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6> Constructor(
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", toArgsArray<P0, P1, P2, P3, P4, P5, P6>(converterProvider = converters), toReturnType<Any>()) { (p0, p1, p2, p3, p4, p5, p6) ->
      enforceType<P0, P1, P2, P3, P4, P5, P6>(p0, p1, p2, p3, p4, p5, p6)
      body(p0, p1, p2, p3, p4, p5, p6)
    }.also {
      constructor = it
    }
  }

  inline fun <reified P0, reified P1, reified P2, reified P3, reified P4, reified P5, reified P6, reified P7> Constructor(
    crossinline body: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) -> SharedObjectType
  ): SyncFunctionComponent {
    return SyncFunctionComponent("constructor", toArgsArray<P0, P1, P2, P3, P4, P5, P6, P7>(converterProvider = converters), toReturnType<Any>()) { (p0, p1, p2, p3, p4, p5, p6, p7) ->
      enforceType<P0, P1, P2, P3, P4, P5, P6, P7>(p0, p1, p2, p3, p4, p5, p6, p7)
      body(p0, p1, p2, p3, p4, p5, p6, p7)
    }.also {
      constructor = it
    }
  }

  /**
   * Creates the read-only property whose getter takes the caller as an argument.
   */
  inline fun <reified T> Property(name: String, crossinline body: (owner: SharedObjectType) -> T): PropertyComponentBuilderWithThis<SharedObjectType> {
    return PropertyComponentBuilderWithThis<SharedObjectType>(ownerType.kType, name).also {
      it.get(body)
      properties[name] = it
    }
  }

  override fun Property(name: String): PropertyComponentBuilderWithThis<SharedObjectType> {
    return PropertyComponentBuilderWithThis<SharedObjectType>(ownerType.kType, name).also {
      properties[name] = it
    }
  }
}
