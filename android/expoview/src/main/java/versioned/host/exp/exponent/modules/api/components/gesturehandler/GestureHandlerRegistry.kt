package versioned.host.exp.exponent.modules.api.components.gesturehandler

import android.view.View
import java.util.*

interface GestureHandlerRegistry {
  fun getHandlersForView(view: View): ArrayList<GestureHandler<*>>?
}
