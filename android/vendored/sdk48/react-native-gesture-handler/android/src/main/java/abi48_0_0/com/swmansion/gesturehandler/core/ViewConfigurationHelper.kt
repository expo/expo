package abi48_0_0.com.swmansion.gesturehandler.core

import android.view.View
import android.view.ViewGroup

interface ViewConfigurationHelper {
  fun getPointerEventsConfigForView(view: View): PointerEventsConfig
  fun getChildInDrawingOrderAtIndex(parent: ViewGroup, index: Int): View
  fun isViewClippingChildren(view: ViewGroup): Boolean
}
