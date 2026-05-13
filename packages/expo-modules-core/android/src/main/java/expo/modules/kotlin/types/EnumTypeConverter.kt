package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.DynamicCastException
import expo.modules.kotlin.exception.EnumNoSuchValueException
import expo.modules.kotlin.exception.IncompatibleArgTypeException
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.logger
import expo.modules.kotlin.toClass
import java.lang.reflect.Field
import java.lang.reflect.Modifier

class EnumTypeConverter(
  private val enumClass: Class<out Enum<*>>
) : DynamicAwareTypeConverters<Enum<*>>() {
  private val enumConstants = requireNotNull(enumClass.enumConstants) {
    "Passed type is not an enum type"
  }.also {
    require(it.isNotEmpty()) {
      "Passed enum type is empty"
    }
  }

  private val userFields: List<Field> =
    enumClass.declaredFields.filter { !Modifier.isStatic(it.modifiers) && !it.isSynthetic }

  init {
    if (!Enumerable::class.java.isAssignableFrom(enumClass)) {
      logger.error("Enum '${enumClass.simpleName}' should inherit from ${Enumerable::class}.")
    }
  }

  override fun getCppRequiredTypes(): ExpectedType = ExpectedType.forEnum()

  override fun isTrivial() = false

  override fun convertFromDynamic(value: Dynamic, context: AppContext?, forceConversion: Boolean): Enum<*> {
    if (userFields.isEmpty()) {
      return convertEnumWithoutParameter(
        value.asString() ?: throw DynamicCastException(String::class.java),
        enumConstants
      )
    } else if (userFields.size == 1) {
      return convertEnumWithParameter(
        value,
        enumConstants,
        userFields.first()
      )
    }

    throw IncompatibleArgTypeException(value.type.toClass(), enumClass)
  }

  override fun convertFromAny(value: Any, context: AppContext?, forceConversion: Boolean): Enum<*> {
    if (userFields.isEmpty()) {
      return convertEnumWithoutParameter(value as String, enumConstants)
    } else if (userFields.size == 1) {
      return convertEnumWithParameter(
        value,
        enumConstants,
        userFields.first()
      )
    }

    throw IncompatibleArgTypeException(value.javaClass, enumClass)
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
   * If the primary constructor take one parameter, we treat this parameter as an enum value.
   * In that case, we handle two different types: Int and String.
   */
  private fun convertEnumWithParameter(
    jsValue: Any,
    enumConstants: Array<out Enum<*>>,
    field: Field
  ): Enum<*> {
    field.isAccessible = true

    val parameterType = field.type
    val jsUnwrapValue = jsValue.unwrapValue(parameterType)

    return requireNotNull(
      enumConstants.find {
        field.get(it) == jsUnwrapValue
      }
    ) { "Couldn't convert '$jsValue' to ${enumClass.simpleName} where ${field.name} is the enum parameter" }
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
