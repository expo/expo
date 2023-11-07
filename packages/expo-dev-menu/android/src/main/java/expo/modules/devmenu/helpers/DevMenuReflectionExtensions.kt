package expo.modules.devmenu.helpers

import android.os.Build
import java.lang.reflect.Field
import java.lang.reflect.Modifier

@Suppress("UNCHECKED_CAST")
fun <T, R> Class<out T>.getPrivateDeclaredFieldValue(filedName: String, obj: T): R {
  val field = getDeclaredField(filedName)
  field.isAccessible = true
  return field.get(obj) as R
}

fun <T> Class<out T>.setPrivateDeclaredFieldValue(filedName: String, obj: T, newValue: Any) {
  val field = getDeclaredField(filedName)
  removeFinalModifier(field)
  field.isAccessible = true
  field.set(obj, newValue)
}

@Suppress("DiscouragedPrivateApi")
fun removeFinalModifier(field: Field) {
  if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
    val artField = Field::class.java.getDeclaredField("artField")
    artField.isAccessible = true
    val modifiers = Class.forName("java.lang.reflect.ArtField").getDeclaredField("accessFlags")
    modifiers.isAccessible = true
    modifiers.setInt(artField.get(field), field.modifiers and Modifier.FINAL.inv())
    return
  }

  val modifiers = Field::class.java.getDeclaredField("accessFlags")
  modifiers.isAccessible = true
  modifiers.setInt(field, field.modifiers and Modifier.FINAL.inv())
}
