package abi44_0_0.host.exp.exponent.modules.api.components.gesturehandler

import android.view.View
import android.view.ViewGroup

interface ViewConfigurationHelper {
  fun getPointerEventsConfigForView(view: View): PointerEventsConfig
  fun getChildInDrawingOrderAtIndex(parent: ViewGroup, index: Int): View
  fun isViewClippingChildren(view: ViewGroup): Boolean
}
