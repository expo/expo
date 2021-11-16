package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.exception.IncompatibleArgTypeException
import expo.modules.kotlin.toKType
import kotlin.reflect.KClass
import kotlin.reflect.full.createType
import kotlin.reflect.full.declaredMemberProperties
import kotlin.reflect.full.primaryConstructor

class EnumTypeConverter(
  private val enumClass: KClass<Enum<*>>,
  isOptional: Boolean
) : TypeConverter<Enum<*>>(isOptional) {
  override fun convertNonOptional(value: Dynamic): Enum<*> {
    @Suppress("UNCHECKED_CAST")
    val enumConstants = requireNotNull(enumClass.java.enumConstants) {
      "Passed type is not an enum type."
    }
    require(enumConstants.isNotEmpty()) {
      "Passed enum type is empty."
    }

    val primaryConstructor = requireNotNull(enumClass.primaryConstructor) {
      "Cannot convert js value to enum without the primary constructor."
    }

    if (primaryConstructor.parameters.isEmpty()) {
      return convertEnumWithoutParameter(value, enumConstants)
    } else if (primaryConstructor.parameters.size == 1) {
      return convertEnumWithParameter(
        value,
        enumConstants,
        primaryConstructor.parameters.first().name!!
      )
    }

    throw IncompatibleArgTypeException(value.type.toKType(), enumClass.createType())
  }

  /**
   * If the primary constructor doesn't take any parameters, we treat the name of each enum as a value.
   * So the jsValue has to contain string.
   */
  private fun convertEnumWithoutParameter(
    jsValue: Dynamic,
    enumConstants: Array<out Enum<*>>
  ): Enum<*> {
    val unwrappedJsValue = jsValue.asString()
    return requireNotNull(
      enumConstants.find { it.name == unwrappedJsValue }
    ) { "Couldn't convert ${jsValue.asString()} to ${enumClass.simpleName}." }
  }

  /**
   * If the primary constructor take one parameter, we treat this parameter as a enum value.
   * In that case, we handles two different types: Int and String.
   */
  private fun convertEnumWithParameter(
    jsValue: Dynamic,
    enumConstants: Array<out Enum<*>>,
    parameterName: String
  ): Enum<*> {
    // To obtain the value of parameter, we have to find a property that is connected with this parameter.
    @Suppress("UNCHECKED_CAST")
    val parameterProperty = enumClass
      .declaredMemberProperties
      .find { it.name == parameterName }
    requireNotNull(parameterProperty) { "Cannot find a property for $parameterName parameter." }

    val parameterType = parameterProperty.returnType.classifier
    val jsUnwrapValue = if (parameterType == String::class) {
      jsValue.asString()
    } else {
      jsValue.asInt()
    }

    return requireNotNull(
      enumConstants.find {
        parameterProperty.get(it) == jsUnwrapValue
      }
    ) { "Couldn't convert ${jsValue.asString()} to ${enumClass.simpleName} where $parameterName is the enum parameter. " }
  }
}
