package abi44_0_0.host.exp.exponent.modules.api.components.gesturehandler

import android.view.View
import java.util.*

interface GestureHandlerRegistry {
  fun getHandlersForView(view: View): ArrayList<GestureHandler<*>>?
}
