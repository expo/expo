@file:OptIn(ExperimentalStdlibApi::class)

package expo.modules.kotlin.callbacks

import android.view.View
import java.lang.ref.WeakReference
import kotlin.reflect.KProperty
import kotlin.reflect.KType
import kotlin.reflect.typeOf

class ViewCallbackDelegate<T>(private val type: KType, view: View) {
  private val viewHolder = WeakReference(view)
  internal var wasValidated = false

  operator fun getValue(thisRef: View, property: KProperty<*>): Callback<T> {
    if (!wasValidated) {
      throw IllegalStateException("You have to export this property as a callback in the `ViewManager`.")
    }

    val view = viewHolder.get() ?: throw IllegalStateException("Can't send event from view which was deallocated.")
    return ViewCallback(property.name, type, view)
  }
}

inline fun <reified T> View.callback(): ViewCallbackDelegate<T> {
  return ViewCallbackDelegate(typeOf<T>(), this)
}
