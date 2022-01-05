package expo.modules.kotlin.methods

import com.facebook.react.bridge.ReadableArray
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.ArgumentCastException
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.InvalidArgsNumberException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.iterator
import expo.modules.kotlin.recycle
import expo.modules.kotlin.types.AnyType

abstract class AnyMethod(
  protected val name: String,
  private val desiredArgsTypes: Array<AnyType>
) {
  @Throws(CodedException::class)
  fun call(args: ReadableArray, promise: Promise) {
    if (desiredArgsTypes.size != args.size()) {
      throw InvalidArgsNumberException(args.size(), desiredArgsTypes.size)
    }

    val convertedArgs = convertArgs(args)
    callImplementation(convertedArgs, promise)
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
      .forEach { (index, desiredType) ->
        argIterator.next().recycle {
          exceptionDecorator({ cause ->
            ArgumentCastException(desiredType.kType, index, type, cause)
          }) {
            finalArgs[index] = desiredType.convert(this)
          }
        }
      }
    return finalArgs
  }
}
