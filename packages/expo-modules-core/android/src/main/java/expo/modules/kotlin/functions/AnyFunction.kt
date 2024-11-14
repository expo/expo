package expo.modules.kotlin.functions

import com.facebook.react.bridge.ReadableArray
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.ArgumentCastException
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.InvalidArgsNumberException
import expo.modules.kotlin.exception.exceptionDecorator
import expo.modules.kotlin.iterator
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.jni.decorators.JSDecoratorsBridgingObject
import expo.modules.kotlin.recycle
import expo.modules.kotlin.types.AnyType
import kotlin.reflect.KClass
import kotlin.reflect.KType

/**
 * Base class of all exported functions
 */
abstract class AnyFunction(
  protected val name: String,
  protected val desiredArgsTypes: Array<AnyType>
) {
  @PublishedApi
  internal var canTakeOwner: Boolean = false

  @PublishedApi
  internal var ownerType: KType? = null

  internal var isEnumerable: Boolean = true

  internal val takesOwner: Boolean
    get() {
      if (canTakeOwner) {
        val firstArgumentType = desiredArgsTypes.firstOrNull()?.kType?.classifier as? KClass<*>
          ?: return false

        if (firstArgumentType == JavaScriptObject::class) {
          return true
        }

        val ownerClass = ownerType?.classifier as? KClass<*> ?: return false

        return firstArgumentType == ownerClass
      }
      return false
    }

  /**
   * A minimum number of arguments the functions needs which equals to `argumentsCount` reduced by the number of trailing optional arguments.
   */
  private val requiredArgumentsCount = run {
    val nonNullableArgIndex = desiredArgsTypes
      .reversed()
      .indexOfFirst { !it.kType.isMarkedNullable }
    if (nonNullableArgIndex < 0) {
      return@run 0
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
          ArgumentCastException(desiredType.kType, index, type.toString(), cause)
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
  protected fun convertArgs(args: Array<Any?>, appContext: AppContext? = null): Array<out Any?> {
    if (requiredArgumentsCount > args.size || args.size > desiredArgsTypes.size) {
      throw InvalidArgsNumberException(args.size, desiredArgsTypes.size, requiredArgumentsCount)
    }

    val finalArgs = Array<Any?>(desiredArgsTypes.size) { null }
    val argIterator = args.iterator()
    for (index in args.indices) {
      val element = argIterator.next()
      val desiredType = desiredArgsTypes[index]
      exceptionDecorator({ cause ->
        ArgumentCastException(desiredType.kType, index, element?.javaClass.toString(), cause)
      }) {
        finalArgs[index] = desiredType.convert(element, appContext)
      }
    }
    return finalArgs
  }

  /**
   * Attaches current function to the provided js object.
   */
  abstract fun attachToJSObject(appContext: AppContext, jsObject: JSDecoratorsBridgingObject, moduleName: String)

  internal fun getCppRequiredTypes(): List<ExpectedType> {
    return desiredArgsTypes.map { it.getCppRequiredTypes() }
  }

  fun enumerable(isEnumerable: Boolean = true) = apply {
    this.isEnumerable = isEnumerable
  }
}
