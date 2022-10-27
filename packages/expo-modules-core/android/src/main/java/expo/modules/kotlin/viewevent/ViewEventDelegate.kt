@file:OptIn(ExperimentalStdlibApi::class)

package expo.modules.kotlin.viewevent

import android.view.View
import java.lang.ref.WeakReference
import kotlin.reflect.KProperty
import kotlin.reflect.KType
import kotlin.reflect.typeOf

typealias CoalescingKey<T> = (event: T) -> Short

class ViewEventDelegate<T>(
  private val type: KType,
  view: View,
  private val coalescingKey: CoalescingKey<T>?
) {
  private val viewHolder = WeakReference(view)
  internal var isValidated = false

  operator fun getValue(thisRef: View, property: KProperty<*>): ViewEventCallback<T> {
    if (!isValidated) {
      throw IllegalStateException("You have to export '${property.name}' property as a event in the `View` component")
    }

    val view = viewHolder.get()
      ?: throw IllegalStateException("Can't send the '${property.name}' event from the view that is deallocated")
    return ViewEvent(property.name, type, view, coalescingKey)
  }
}

/**
 * Creates a reference to the js callback.
 * @param coalescingKey a key generator used to determine which other events of this type this event can be coalesced with.
 * For example, touch move events should only be coalesced within a single gesture so a coalescing key there would be the unique gesture id.
 */
@Suppress("FunctionName")
inline fun <reified T> View.EventDispatcher(noinline coalescingKey: CoalescingKey<T>? = null): ViewEventDelegate<T> {
  return ViewEventDelegate(typeOf<T>(), this, coalescingKey)
}

@JvmName("MapEventDispatcher")
@Suppress("FunctionName")
fun View.EventDispatcher(coalescingKey: CoalescingKey<Map<String, Any>>? = null): ViewEventDelegate<Map<String, Any>> {
  return ViewEventDelegate(typeOf<Map<String, Any>>(), this, coalescingKey)
}
