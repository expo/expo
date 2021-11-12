package expo.modules.kotlin.types

import com.facebook.react.bridge.Dynamic
import expo.modules.kotlin.exception.IncompatibleArgTypeException
import expo.modules.kotlin.toKType
import kotlin.reflect.KProperty1
import kotlin.reflect.full.declaredMemberProperties
import kotlin.reflect.full.primaryConstructor

class EnumTypeConverter : TypeConverter {
  override fun canHandleConversion(toType: KClassTypeWrapper): Boolean =
    toType.classifier.java.isEnum

  override fun convert(jsValue: Dynamic, toType: KClassTypeWrapper): Any {
    @Suppress("UNCHECKED_CAST")
    val enumConstants = requireNotNull((toType.classifier.java as? Class<Enum<*>>)?.enumConstants) {
      "Passed type is not an enum type."
    }
    require(enumConstants.isNotEmpty()) {
      "Passed enum type is empty."
    }

    val primaryConstructor = requireNotNull(toType.classifier.primaryConstructor) {
      "Cannot convert js value to enum without the primary constructor."
    }

    if (primaryConstructor.parameters.isEmpty()) {
      return convertEnumWithoutParameter(jsValue, toType, enumConstants)
    } else if (primaryConstructor.parameters.size == 1) {
      return convertEnumWithParameter(
        jsValue,
        toType,
        enumConstants,
        primaryConstructor.parameters.first().name!!
      )
    }

    throw IncompatibleArgTypeException(jsValue.type.toKType(), toType)
  }

  /**
   * If the primary constructor doesn't take any parameters, we treat the name of each enum as a value.
   * So the jsValue has to contain string.
   */
  private fun convertEnumWithoutParameter(
    jsValue: Dynamic,
    toType: KClassTypeWrapper,
    enumConstants: Array<out Enum<*>>
  ): Any {
    val unwrappedJsValue = jsValue.asString()
    return requireNotNull(
      enumConstants.find { it.name == unwrappedJsValue }
    ) { "Couldn't convert ${jsValue.asString()} to ${toType.classifier.simpleName}." }
  }

  /**
   * If the primary constructor take one parameter, we treat this parameter as a enum value.
   * In that case, we handles two different types: Int and String.
   */
  private fun convertEnumWithParameter(
    jsValue: Dynamic,
    toType: KClassTypeWrapper,
    enumConstants: Array<out Enum<*>>,
    parameterName: String
  ): Any {
    // To obtain the value of parameter, we have to find a property that is connected with this parameter.
    @Suppress("UNCHECKED_CAST")
    val parameterProperty = toType
      .classifier
      .declaredMemberProperties
      .find { it.name == parameterName } as? KProperty1<Enum<*>, *>
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
    ) { "Couldn't convert ${jsValue.asString()} to ${toType.classifier.simpleName} where $parameterName is the enum parameter. " }
  }
}
