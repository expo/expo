package expo.modules.kotlin.functions

import com.facebook.react.bridge.ReadableArray
import expo.modules.kotlin.ModuleHolder
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.ArgumentCastException
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.InvalidArgsNumberException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.iterator
import expo.modules.kotlin.recycle
import expo.modules.kotlin.types.AnyType
import expo.modules.kotlin.types.JSTypeConverter

abstract class AnyFunction(
  protected val name: String,
  private val desiredArgsTypes: Array<AnyType>
) {
  internal var isSync = false
    private set

  fun runSynchronously() = apply {
    isSync = true
  }

  @Throws(CodedException::class)
  internal fun callSync(module: ModuleHolder, args: ReadableArray): Any? {
    if (desiredArgsTypes.size != args.size()) {
      throw InvalidArgsNumberException(args.size(), desiredArgsTypes.size)
    }

    val convertedArgs = convertArgs(args)
    return callSyncImplementation(module, convertedArgs)
  }

  @Throws(CodedException::class)
  internal fun call(module: ModuleHolder, args: ReadableArray, promise: Promise) {
    if (desiredArgsTypes.size != args.size()) {
      throw InvalidArgsNumberException(args.size(), desiredArgsTypes.size)
    }

    val convertedArgs = convertArgs(args)
    callImplementation(module, convertedArgs, promise)
  }

  @Throws(CodedException::class)
  internal abstract fun callImplementation(holder: ModuleHolder, args: Array<out Any?>, promise: Promise)

  @Throws(CodedException::class)
  internal open fun callSyncImplementation(holder: ModuleHolder, args: Array<out Any?>): Any? {
    throw UnsupportedOperationException("The sync call is not supported yet!")
  }


  internal val argsCount get() = desiredArgsTypes.size

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
