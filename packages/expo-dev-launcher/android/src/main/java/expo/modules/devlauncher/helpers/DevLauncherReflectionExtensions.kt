package expo.modules.devlauncher.helpers

import java.lang.Exception
import java.lang.reflect.Field
import java.lang.reflect.Modifier
import expo.modules.devmenu.helpers.removeFinalModifier

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
  removeFinalModifier(field)
  field.isAccessible = true

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
