package expo.modules.kotlin.modules

import expo.modules.kotlin.types.Enumerable
import kotlin.reflect.KProperty1
import kotlin.reflect.full.declaredMemberProperties
import kotlin.reflect.full.primaryConstructor

internal fun <T> convertEnumToString(enumValue: T): String where T : Enumerable, T : Enum<T> {
  val enumClass = enumValue::class
  val primaryConstructor = enumClass.primaryConstructor
  if (primaryConstructor?.parameters?.size == 1) {
    val parameterName = primaryConstructor.parameters.first().name
    val parameterProperty = enumClass
      .declaredMemberProperties
      .find { it.name == parameterName }

    requireNotNull(parameterProperty) { "Cannot find a property for $parameterName parameter" }
    require(parameterProperty.returnType.classifier == String::class) { "The enum parameter has to be a string." }

    @Suppress("UNCHECKED_CAST")
    return (parameterProperty as KProperty1<T, String>).get(enumValue)
  }

  return enumValue.name
}
