package expo.modules.devlauncher.helpers

import java.lang.Exception
import java.lang.reflect.Field
import java.lang.reflect.Modifier

fun <T> Class<T>.getFieldInClassHierarchy(fieldName: String): Field? {
  var currentClass: Class<*>? = this
  var result: Field? = null
  while (currentClass != null && result == null) {
    try {
      result = currentClass.getDeclaredField(fieldName)
    } catch (e: Exception) {
    }
    currentClass = currentClass.superclass
  }
  return result
}

fun <T> Class<out T>.setProtectedDeclaredField(obj: T, filedName: String, newValue: Any, predicate: (Any?) -> Boolean = { true }) {
  val field = getDeclaredField(filedName)
  val modifiersField = Field::class.java.getDeclaredField("accessFlags")

  field.isAccessible = true
  modifiersField.isAccessible = true

  modifiersField.setInt(
    field,
    field.modifiers and Modifier.FINAL.inv()
  )

  if (!predicate.invoke(field.get(obj))) {
    return
  }

  field.set(obj, newValue)
}

fun <T, U> Class<out T>.getProtectedFieldValue(obj: T, filedName: String): U {
  val field = getDeclaredField(filedName)
  field.isAccessible = true

  @Suppress("UNCHECKED_CAST")
  return field.get(obj) as U
}
