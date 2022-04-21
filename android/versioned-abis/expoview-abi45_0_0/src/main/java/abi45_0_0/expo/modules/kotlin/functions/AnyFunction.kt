package abi45_0_0.expo.modules.kotlin.functions

import abi45_0_0.com.facebook.react.bridge.ReadableArray
import abi45_0_0.expo.modules.kotlin.ModuleHolder
import abi45_0_0.expo.modules.kotlin.Promise
import abi45_0_0.expo.modules.kotlin.exception.ArgumentCastException
import abi45_0_0.expo.modules.kotlin.exception.CodedException
import abi45_0_0.expo.modules.kotlin.exception.InvalidArgsNumberException
import abi45_0_0.expo.modules.kotlin.exception.exceptionDecorator
import abi45_0_0.expo.modules.kotlin.iterator
import abi45_0_0.expo.modules.kotlin.recycle
import abi45_0_0.expo.modules.kotlin.types.AnyType

abstract class AnyFunction(
  protected val name: String,
  private val desiredArgsTypes: Array<AnyType>
) {
  @Throws(CodedException::class)
  fun call(module: ModuleHolder, args: ReadableArray, promise: Promise) {
    if (desiredArgsTypes.size != args.size()) {
      throw InvalidArgsNumberException(args.size(), desiredArgsTypes.size)
    }

    val convertedArgs = convertArgs(args)
    callImplementation(module, convertedArgs, promise)
  }

  @Throws(CodedException::class)
  internal abstract fun callImplementation(holder: ModuleHolder, args: Array<out Any?>, promise: Promise)

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
