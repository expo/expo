package devmenu.com.swmansion.gesturehandler

import android.view.View
import java.util.*

class GestureHandlerRegistryImpl : GestureHandlerRegistry {
  private val handlers = WeakHashMap<View?, ArrayList<GestureHandler<*>>>()
  fun <T : GestureHandler<*>> registerHandlerForView(view: View?, handler: T): T {
    var listToAdd = handlers[view]
    if (listToAdd == null) {
      listToAdd = ArrayList(1)
      listToAdd.add(handler)
      handlers[view] = listToAdd
    } else {
      listToAdd.add(handler)
    }
    return handler
  }

  override fun getHandlersForView(view: View) = handlers[view]
}
