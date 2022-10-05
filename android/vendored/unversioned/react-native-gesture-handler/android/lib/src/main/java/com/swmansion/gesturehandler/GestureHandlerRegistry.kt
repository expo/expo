package com.swmansion.gesturehandler

import android.view.View
import java.util.*

interface GestureHandlerRegistry {
  fun getHandlersForView(view: View): ArrayList<GestureHandler<*>>?
}
