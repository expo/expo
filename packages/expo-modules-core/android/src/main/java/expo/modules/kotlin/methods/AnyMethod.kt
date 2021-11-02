package expo.modules.kotlin.methods

import com.facebook.react.bridge.ReadableArray
import expo.modules.core.Promise
import expo.modules.kotlin.iterator
import expo.modules.kotlin.types.TypeConverterHelper
import kotlin.reflect.KType

abstract class AnyMethod(
  protected val name: String,
  private val desiredArgsTypes: Array<KType>
) {
  abstract fun call(args: ReadableArray, promise: Promise)

  val argsCount get() = desiredArgsTypes.size

  protected fun castArguments(args: ReadableArray): Array<out Any?> {
    val finalArgs = Array<Any?>(desiredArgsTypes.size) { null }
    val argIterator = args.iterator()
    desiredArgsTypes
      .withIndex()
      .forEach { (index, type) ->
        val dynamic = argIterator.next()
        val castedValue = TypeConverterHelper.convert(dynamic, type)

        finalArgs[index] = castedValue
      }
    return finalArgs
  }
}
