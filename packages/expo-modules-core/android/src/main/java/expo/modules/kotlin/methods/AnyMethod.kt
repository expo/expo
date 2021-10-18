package expo.modules.kotlin.methods

import com.facebook.react.bridge.ReadableArray
import expo.modules.core.Promise
import expo.modules.kotlin.iterator
import expo.modules.kotlin.modules.Module
import kotlin.reflect.full.isSubclassOf

abstract class AnyMethod(
  protected val name: String,
  private val desiredArgsTypes: Array<TypeInformation<*>>
) {
  private val moduleArgIndex = desiredArgsTypes.map { it.type }.indexOfFirst { it.kotlin.isSubclassOf(Module::class) }

  abstract fun call(module: Module, args: ReadableArray, promise: Promise)

  val argsCount get() = if (moduleArgIndex != -1) desiredArgsTypes.size - 1 else desiredArgsTypes.size

  protected fun castArguments(module: Module, args: ReadableArray): Array<out Any?> {
    val finalArgs = Array<Any?>(desiredArgsTypes.size) { null }
    if (moduleArgIndex != -1) {
      finalArgs[moduleArgIndex] = module
    }

    val argIterator = args.iterator()
    desiredArgsTypes
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
