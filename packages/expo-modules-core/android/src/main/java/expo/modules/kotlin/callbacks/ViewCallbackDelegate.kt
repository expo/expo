@file:OptIn(ExperimentalStdlibApi::class)

package expo.modules.kotlin.callbacks

import android.view.View
import java.lang.ref.WeakReference
import kotlin.reflect.KProperty
import kotlin.reflect.KType
import kotlin.reflect.typeOf

typealias CoalescingKey<T> = (event: T) -> Short

class ViewCallbackDelegate<T>(
  private val type: KType,
  view: View,
  private val coalescingKey: CoalescingKey<T>?
) {
  private val viewHolder = WeakReference(view)
  internal var isValidated = false

  operator fun getValue(thisRef: View, property: KProperty<*>): Callback<T> {
    if (!isValidated) {
      throw IllegalStateException("You have to export this property as a callback in the `ViewManager`.")
    }

    val view = viewHolder.get()
      ?: throw IllegalStateException("Can't send an event from the view that is deallocated.")
    return ViewCallback(property.name, type, view, coalescingKey)
  }
}

/**
 * Creates a reference to the js callback.
 * @param coalescingKey a key generator used to determine which other events of this type this event can be coalesced with.
 * For example, touch move events should only be coalesced within a single gesture so a coalescing key there would be the unique gesture id.
 */
inline fun <reified T> View.callback(noinline coalescingKey: CoalescingKey<T>? = null): ViewCallbackDelegate<T> {
  return ViewCallbackDelegate(typeOf<T>(), this, coalescingKey)
}
