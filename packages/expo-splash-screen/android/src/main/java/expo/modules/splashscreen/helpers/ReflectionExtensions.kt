package expo.modules.splashscreen.helpers

import java.lang.reflect.Field
import java.lang.reflect.Modifier

// From `expo-dev-launcher/android/src/main/java/expo/modules/devlauncher/helpers/DevLauncherReflectionExtensions.kt`
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
