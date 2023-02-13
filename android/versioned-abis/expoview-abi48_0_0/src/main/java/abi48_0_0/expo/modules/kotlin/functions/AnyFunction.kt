package abi48_0_0.expo.modules.kotlin.functions

import abi48_0_0.com.facebook.react.bridge.ReadableArray
import abi48_0_0.com.facebook.react.bridge.ReadableType
import abi48_0_0.expo.modules.kotlin.AppContext
import abi48_0_0.expo.modules.kotlin.exception.ArgumentCastException
import abi48_0_0.expo.modules.kotlin.exception.CodedException
import abi48_0_0.expo.modules.kotlin.exception.InvalidArgsNumberException
import abi48_0_0.expo.modules.kotlin.exception.exceptionDecorator
import abi48_0_0.expo.modules.kotlin.iterator
import abi48_0_0.expo.modules.kotlin.jni.ExpectedType
import abi48_0_0.expo.modules.kotlin.jni.JavaScriptModuleObject
import abi48_0_0.expo.modules.kotlin.recycle
import abi48_0_0.expo.modules.kotlin.types.AnyType

/**
 * Base class of all exported functions
 */
abstract class AnyFunction(
  protected val name: String,
  protected val desiredArgsTypes: Array<AnyType>
) {
  internal val argsCount get() = desiredArgsTypes.size

  /**
   * A minimum number of arguments the functions needs which equals to `argumentsCount` reduced by the number of trailing optional arguments.
   */
  internal val requiredArgumentsCount = run {
    val nonNullableArgIndex = desiredArgsTypes
      .reversed()
      .indexOfFirst { !it.kType.isMarkedNullable }
    if (nonNullableArgIndex < 0) {
      return@run desiredArgsTypes.size
    }

    return@run desiredArgsTypes.size - nonNullableArgIndex
  }

  /**
   * Tries to convert arguments from RN representation to expected types.
   *
   * @return An array of converted arguments
   * @throws `CodedException` if conversion isn't possible
   */
  @Throws(CodedException::class)
  protected fun convertArgs(args: ReadableArray): Array<out Any?> {
    if (requiredArgumentsCount > args.size() || args.size() > desiredArgsTypes.size) {
      throw InvalidArgsNumberException(args.size(), desiredArgsTypes.size, requiredArgumentsCount)
    }

    val finalArgs = Array<Any?>(desiredArgsTypes.size) { null }
    val argIterator = args.iterator()
    for (index in 0 until args.size()) {
      val desiredType = desiredArgsTypes[index]
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

  /**
   * Tries to convert arguments from [Any]? to expected types.
   *
   * @return An array of converted arguments
   * @throws `CodedException` if conversion isn't possible
   */
  @Throws(CodedException::class)
  protected fun convertArgs(args: Array<Any?>): Array<out Any?> {
    if (requiredArgumentsCount > args.size || args.size > desiredArgsTypes.size) {
      throw InvalidArgsNumberException(args.size, desiredArgsTypes.size, requiredArgumentsCount)
    }

    val finalArgs = Array<Any?>(desiredArgsTypes.size) { null }
    val argIterator = args.iterator()
    for (index in args.indices) {
      val element = argIterator.next()
      val desiredType = desiredArgsTypes[index]
      exceptionDecorator({ cause ->
        ArgumentCastException(desiredType.kType, index, ReadableType.String, cause)
      }) {
        finalArgs[index] = desiredType.convert(element)
      }
    }
    return finalArgs
  }

  /**
   * Attaches current function to the provided js object.
   */
  abstract fun attachToJSObject(appContext: AppContext, jsObject: JavaScriptModuleObject)

  fun getCppRequiredTypes(): List<ExpectedType> {
    return desiredArgsTypes.map { it.getCppRequiredTypes() }
  }
}
