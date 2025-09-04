package expo.modules.kotlin

import expo.modules.kotlin.types.Enumerable
import kotlin.reflect.KProperty1
import kotlin.reflect.full.declaredMemberProperties

fun <T> T.convertToString(): String where T : Enum<T>, T : Enumerable {
  val enumClass = this::class
  val primaryConstructor = enumClass.fastPrimaryConstructor
  if (primaryConstructor?.parameters?.size == 1) {
    val parameterName = primaryConstructor.parameters.first().name
    val parameterProperty = enumClass
      .declaredMemberProperties
      .find { it.name == parameterName }

    requireNotNull(parameterProperty) { "Cannot find a property for $parameterName parameter" }
    require(parameterProperty.returnType.classifier == String::class) { "The enum parameter has to be a string." }

    @Suppress("UNCHECKED_CAST")
    return (parameterProperty as KProperty1<T, String>).get(this)
  }

  return this.name
}
