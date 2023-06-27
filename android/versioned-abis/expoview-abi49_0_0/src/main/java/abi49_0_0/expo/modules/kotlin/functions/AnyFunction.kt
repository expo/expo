package abi49_0_0.expo.modules.kotlin.functions

import abi49_0_0.com.facebook.react.bridge.ReadableArray
import abi49_0_0.expo.modules.kotlin.AppContext
import abi49_0_0.expo.modules.kotlin.exception.ArgumentCastException
import abi49_0_0.expo.modules.kotlin.exception.CodedException
import abi49_0_0.expo.modules.kotlin.exception.InvalidArgsNumberException
import abi49_0_0.expo.modules.kotlin.exception.exceptionDecorator
import abi49_0_0.expo.modules.kotlin.iterator
import abi49_0_0.expo.modules.kotlin.jni.ExpectedType
import abi49_0_0.expo.modules.kotlin.jni.JavaScriptModuleObject
import abi49_0_0.expo.modules.kotlin.jni.JavaScriptObject
import abi49_0_0.expo.modules.kotlin.recycle
import abi49_0_0.expo.modules.kotlin.types.AnyType
import kotlin.reflect.KType
import kotlin.reflect.full.isSubtypeOf
import kotlin.reflect.typeOf

/**
 * Base class of all exported functions
 */
abstract class AnyFunction(
  protected val name: String,
  protected val desiredArgsTypes: Array<AnyType>
) {
  internal val argsCount get() = desiredArgsTypes.size

  internal var canTakeOwner: Boolean = false

  @PublishedApi
  internal var ownerType: KType? = null

  internal val takesOwner: Boolean
    get() = canTakeOwner &&
      desiredArgsTypes.firstOrNull()?.kType?.isSubtypeOf(typeOf<JavaScriptObject>()) == true ||
      (ownerType != null && desiredArgsTypes.firstOrNull()?.kType?.isSubtypeOf(ownerType!!) == true)

  /**
   * A minimum number of arguments the functions needs which equals to `argumentsCount` reduced by the number of trailing optional arguments.
   */
  internal val requiredArgumentsCount = run {
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
  abstract fun attachToJSObject(appContext: AppContext, jsObject: JavaScriptModuleObject)

  fun getCppRequiredTypes(): List<ExpectedType> {
    return desiredArgsTypes.map { it.getCppRequiredTypes() }
  }
}
