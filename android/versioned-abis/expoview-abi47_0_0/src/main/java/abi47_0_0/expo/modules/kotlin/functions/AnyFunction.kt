package abi47_0_0.expo.modules.kotlin.functions

import abi47_0_0.com.facebook.react.bridge.ReadableArray
import abi47_0_0.com.facebook.react.bridge.ReadableType
import abi47_0_0.expo.modules.kotlin.AppContext
import abi47_0_0.expo.modules.kotlin.exception.ArgumentCastException
import abi47_0_0.expo.modules.kotlin.exception.CodedException
import abi47_0_0.expo.modules.kotlin.exception.InvalidArgsNumberException
import abi47_0_0.expo.modules.kotlin.exception.exceptionDecorator
import abi47_0_0.expo.modules.kotlin.iterator
import abi47_0_0.expo.modules.kotlin.jni.ExpectedType
import abi47_0_0.expo.modules.kotlin.jni.JavaScriptModuleObject
import abi47_0_0.expo.modules.kotlin.recycle
import abi47_0_0.expo.modules.kotlin.types.AnyType

/**
 * Base class of all exported functions
 */
abstract class AnyFunction(
  protected val name: String,
  protected val desiredArgsTypes: Array<AnyType>
) {
  internal val argsCount get() = desiredArgsTypes.size

  /**
   * Tries to convert arguments from RN representation to expected types.
   *
   * @return An array of converted arguments
   * @throws `CodedException` if conversion isn't possible
   */
  @Throws(CodedException::class)
  protected fun convertArgs(args: ReadableArray): Array<out Any?> {
    if (desiredArgsTypes.size != args.size()) {
      throw InvalidArgsNumberException(args.size(), desiredArgsTypes.size)
    }

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

  /**
   * Tries to convert arguments from [Any]? to expected types.
   *
   * @return An array of converted arguments
   * @throws `CodedException` if conversion isn't possible
   */
  @Throws(CodedException::class)
  protected fun convertArgs(args: Array<Any?>): Array<out Any?> {
    if (desiredArgsTypes.size != args.size) {
      throw InvalidArgsNumberException(args.size, desiredArgsTypes.size)
    }

    val finalArgs = Array<Any?>(desiredArgsTypes.size) { null }
    val argIterator = args.iterator()
    desiredArgsTypes
      .withIndex()
      .forEach { (index, desiredType) ->
        val element = argIterator.next()

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
  internal abstract fun attachToJSObject(appContext: AppContext, jsObject: JavaScriptModuleObject)

  fun getCppRequiredTypes(): List<ExpectedType> {
    return desiredArgsTypes.map { it.getCppRequiredTypes() }
  }
}
