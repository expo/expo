package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.DynamicCastException
import expo.modules.kotlin.exception.EnumNoSuchValueException
import expo.modules.kotlin.exception.IncompatibleArgTypeException
import expo.modules.kotlin.fastPrimaryConstructor
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.logger
import expo.modules.kotlin.toKClass
import kotlin.reflect.KClass

class EnumTypeConverter(
  private val enumClass: KClass<Enum<*>>
) : DynamicAwareTypeConverters<Enum<*>>() {
  private val enumConstants = requireNotNull(enumClass.java.enumConstants) {
    "Passed type is not an enum type"
  }.also {
    require(it.isNotEmpty()) {
      "Passed enum type is empty"
    }
  }

  private val primaryConstructor = requireNotNull(
    enumClass.fastPrimaryConstructor
  ) {
    "Cannot convert js value to enum without the primary constructor"
  }

  init {
    if (!Enumerable::class.java.isAssignableFrom(enumClass.java)) {
      logger.error("Enum '$enumClass' should inherit from ${Enumerable::class}.")
    }
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType.forEnum()

  override fun isTrivial() = false

  override fun convertFromDynamic(value: Dynamic, context: AppContext?, forceConversion: Boolean): Enum<*> {
    if (primaryConstructor.parameters.isEmpty()) {
      return convertEnumWithoutParameter(
        value.asString() ?: throw DynamicCastException(String::class),
        enumConstants
      )
    } else if (primaryConstructor.parameters.size == 1) {
      return convertEnumWithParameter(
        value,
        enumConstants,
        primaryConstructor.parameters.first().name!!
      )
    }

    throw IncompatibleArgTypeException(value.type.toKClass(), enumClass)
  }

  override fun convertFromAny(value: Any, context: AppContext?, forceConversion: Boolean): Enum<*> {
    if (primaryConstructor.parameters.isEmpty()) {
      return convertEnumWithoutParameter(value as String, enumConstants)
    } else if (primaryConstructor.parameters.size == 1) {
      return convertEnumWithParameter(
        value,
        enumConstants,
        primaryConstructor.parameters.first().name!!
      )
    }

    throw IncompatibleArgTypeException(value::class, enumClass)
  }

  /**
   * If the primary constructor doesn't take any parameters, we treat the name of each enum as a value.
   * So the jsValue has to contain string.
   */
  private fun convertEnumWithoutParameter(
    stringRepresentation: String,
    enumConstants: Array<out Enum<*>>
  ): Enum<*> {
    return enumConstants.find { it.name == stringRepresentation }
      ?: throw EnumNoSuchValueException(enumClass, enumConstants, stringRepresentation)
  }

  /**
   * If the primary constructor take one parameter, we treat this parameter as a enum value.
   * In that case, we handles two different types: Int and String.
   */
  private fun convertEnumWithParameter(
    jsValue: Any,
    enumConstants: Array<out Enum<*>>,
    parameterName: String
  ): Enum<*> {
    val filed = enumClass.java.getDeclaredField(parameterName)
    requireNotNull(filed) { "Cannot find a property for $parameterName parameter" }

    filed.isAccessible = true

    val parameterType = filed.type
    val jsUnwrapValue = jsValue.unwrapValue(parameterType)

    return requireNotNull(
      enumConstants.find {
        filed.get(it) == jsUnwrapValue
      }
    ) { "Couldn't convert '$jsValue' to ${enumClass.simpleName} where $parameterName is the enum parameter" }
  }

  private fun Any.unwrapValue(parameterType: Class<*>): Any? {
    if (this is Dynamic) {
      if (parameterType == String::class.java) {
        return asString()
      }

      return asInt()
    }

    if (parameterType == String::class.java) {
      return this as String
    }

    if (this is Double) {
      return toInt()
    }

    return this as Int
  }
}
