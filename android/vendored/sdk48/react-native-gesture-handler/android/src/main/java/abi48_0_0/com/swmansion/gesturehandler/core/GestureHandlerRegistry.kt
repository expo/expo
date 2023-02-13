package abi48_0_0.com.swmansion.gesturehandler.core

import android.view.View
import java.util.*

interface GestureHandlerRegistry {
  fun getHandlersForView(view: View): ArrayList<GestureHandler<*>>?
}
