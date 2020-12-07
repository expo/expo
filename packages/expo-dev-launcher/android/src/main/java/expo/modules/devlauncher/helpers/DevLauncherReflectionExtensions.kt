package expo.modules.devlauncher.helpers

import java.lang.Exception
import java.lang.reflect.Field

fun <T> Class<T>.getFieldInClassHierarchy(fieldName: String): Field? {
  var currentClass: Class<*>? = this
  var result: Field? = null
  while (currentClass != null && result == null) {
    try {
      result = currentClass.getDeclaredField(fieldName)
    } catch (e: Exception) {}
    currentClass = currentClass.superclass
  }
  return result
}
