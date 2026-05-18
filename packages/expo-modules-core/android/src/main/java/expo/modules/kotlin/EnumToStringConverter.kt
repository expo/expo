package expo.modules.kotlin

import expo.modules.kotlin.types.Enumerable
import java.lang.reflect.Modifier

fun <T> T.convertToString(): String where T : Enum<T>, T : Enumerable {
  val enumClass = this::class.java
  return EnumToStringConverter(enumClass).convert(this)
}

@PublishedApi
internal class EnumToStringConverter<T : Enum<*>>(
  val enumClass: Class<out T>
) {
  val fields = enumClass
    .declaredFields
    .filter { !Modifier.isStatic(it.modifiers) && !it.isSynthetic }

  fun convert(enumValue: T): String {
    if (fields.isEmpty()) {
      return enumValue.name
    }

    if (fields.size != 1) {
      error("Can't convert $enumClass to string")
    }

    val field = fields.first()
    field.isAccessible = true
    val rawValue = field.get(enumValue) as? String

    requireNotNull(rawValue) {
      "The enum parameter has to be a string."
    }

    return rawValue
  }
}
