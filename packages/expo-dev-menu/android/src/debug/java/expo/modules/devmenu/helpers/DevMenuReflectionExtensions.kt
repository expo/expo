package expo.modules.devmenu.helpers

import android.annotation.SuppressLint
import java.lang.reflect.Field
import java.lang.reflect.Modifier

@Suppress("UNCHECKED_CAST")
fun <T, R> Class<out T>.getPrivateDeclaredFieldValue(filedName: String, obj: T): R {
  val field = getDeclaredField(filedName)
  field.isAccessible = true
  return field.get(obj) as R
}

@SuppressLint("DiscouragedPrivateApi")
fun <T> Class<out T>.setPrivateDeclaredFieldValue(filedName: String, obj: T, newValue: Any) {
  val field = getDeclaredField(filedName)
  val modifiersField = Field::class.java.getDeclaredField("accessFlags")

  field.isAccessible = true
  modifiersField.isAccessible = true

  modifiersField.setInt(
    field,
    field.modifiers and Modifier.FINAL.inv()
  )

  field.set(obj, newValue)
}
