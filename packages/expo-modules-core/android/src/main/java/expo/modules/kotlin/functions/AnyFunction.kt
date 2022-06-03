package expo.modules.kotlin.functions

import com.facebook.react.bridge.ReadableArray
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.ArgumentCastException
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.InvalidArgsNumberException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.iterator
import expo.modules.kotlin.jni.JavaScriptModuleObject
import expo.modules.kotlin.recycle
import expo.modules.kotlin.types.AnyType

/**
 * Base class of all exported functions
 */
abstract class AnyFunction(
  protected val name: String,
  private val desiredArgsTypes: Array<AnyType>
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
   * Attaches current function to the provided js object.
   */
  abstract fun attachToJSObject(appContext: AppContext, jsObject: JavaScriptModuleObject)
}
