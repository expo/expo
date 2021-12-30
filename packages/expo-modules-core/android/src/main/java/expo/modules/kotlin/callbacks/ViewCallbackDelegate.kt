@file:OptIn(ExperimentalStdlibApi::class)

package expo.modules.kotlin.callbacks

import android.view.View
import java.lang.ref.WeakReference
import kotlin.reflect.KProperty
import kotlin.reflect.KType
import kotlin.reflect.typeOf

class ViewCallbackDelegate<T>(private val type: KType, view: View) {
  private val viewHolder = WeakReference(view)
  internal var isValidated = false

  operator fun getValue(thisRef: View, property: KProperty<*>): Callback<T> {
    if (!isValidated) {
      throw IllegalStateException("You have to export this property as a callback in the `ViewManager`.")
    }

    val view = viewHolder.get() ?: throw IllegalStateException("Can't send an event from the view that is deallocated.")
    return ViewCallback(property.name, type, view)
  }
}

inline fun <reified T> View.callback(): ViewCallbackDelegate<T> {
  return ViewCallbackDelegate(typeOf<T>(), this)
}
