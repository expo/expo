package expo.modules.kotlin.methods

import com.facebook.react.bridge.ReadableArray
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.InvalidArgsNumberException
import expo.modules.kotlin.exception.UnexpectedException
import expo.modules.kotlin.iterator
import expo.modules.kotlin.types.TypeConverterHelper
import kotlin.jvm.Throws
import kotlin.reflect.KType

abstract class AnyMethod(
  protected val name: String,
  private val desiredArgsTypes: Array<KType>
) {
  fun call(args: ReadableArray, promise: Promise) {
    if (desiredArgsTypes.size != args.size()) {
      promise.reject(InvalidArgsNumberException(args.size(), desiredArgsTypes.size))
      return
    }
    try {
      val convertedArgs = convertArgs(args)
      callImplementation(convertedArgs, promise)
    } catch (codedError: CodedException) {
      promise.reject(codedError)
    } catch (e: Throwable) {
      promise.reject(UnexpectedException(e))
    }
  }

  @Throws(CodedException::class)
  internal abstract fun callImplementation(args: Array<out Any?>, promise: Promise)

  val argsCount get() = desiredArgsTypes.size

  @Throws(CodedException::class)
  private fun convertArgs(args: ReadableArray): Array<out Any?> {
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
