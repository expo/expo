package expo.modules.kotlin.methods

import com.facebook.react.bridge.ReadableArray
import expo.modules.core.Promise
import expo.modules.kotlin.iterator
import expo.modules.kotlin.modules.Module
import kotlin.reflect.full.isSubclassOf

abstract class AnyMethod(
  protected val name: String,
  private val desireArgsTypes: Array<TypeInformation<*>>
) {
  private val moduleArgIndex = desireArgsTypes.map { it.type }.indexOfFirst { it.kotlin.isSubclassOf(Module::class) }

  abstract fun call(module: Module, args: ReadableArray, promise: Promise)

  val argsCount get() = if (moduleArgIndex != -1) desireArgsTypes.size - 1 else desireArgsTypes.size

  protected fun castArguments(module: Module, args: ReadableArray): Array<out Any?> {
    val finalArgs = Array<Any?>(desireArgsTypes.size) { null }
    if (moduleArgIndex != -1) {
      finalArgs[moduleArgIndex] = module
    }

    val argIterator = args.iterator()
    desireArgsTypes
      .withIndex()
      .forEach { (index, type) ->
        if (finalArgs[index] != null) {
          return@forEach
        }

        val dynamic = argIterator.next()
        val castedValue = TypeMapper.cast(dynamic, type)

        finalArgs[index] = castedValue
      }
    return finalArgs
  }
}

class PromiseMethod(
  name: String,
  argsType: Array<TypeInformation<*>>,
  private val body: (args: Array<out Any?>, promise: Promise) -> Any
) : AnyMethod(name, argsType) {

  override fun call(module: Module, args: ReadableArray, promise: Promise) {
    body(castArguments(module, args), promise)
  }
}

class Method(
  name: String,
  argsType: Array<TypeInformation<*>>,
  private val body: (args: Array<out Any?>) -> Any
) : AnyMethod(name, argsType) {
  constructor(
    name: String,
    argsType: Array<Class<*>>,
    body: (args: Array<out Any?>) -> Any
  ) : this(name, argsType.map { TypeInformation(it, false) }.toTypedArray(), body)

  override fun call(module: Module, args: ReadableArray, promise: Promise) {
    try {
      promise.resolve(body(castArguments(module, args)))
    } catch (e: Throwable) {
      promise.reject("ExpoModuleCore", e.message, e)
    }
  }
}
