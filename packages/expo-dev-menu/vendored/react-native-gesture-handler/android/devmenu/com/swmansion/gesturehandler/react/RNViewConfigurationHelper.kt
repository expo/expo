package devmenu.com.swmansion.gesturehandler.react

import android.view.View
import android.view.ViewGroup
import com.facebook.react.uimanager.PointerEvents
import com.facebook.react.uimanager.ReactPointerEventsView
import com.facebook.react.views.view.ReactViewGroup
import devmenu.com.swmansion.gesturehandler.PointerEventsConfig
import devmenu.com.swmansion.gesturehandler.ViewConfigurationHelper

class RNViewConfigurationHelper : ViewConfigurationHelper {
  override fun getPointerEventsConfigForView(view: View): PointerEventsConfig {
    val pointerEvents: PointerEvents =
      if (view is ReactPointerEventsView) {
        (view as ReactPointerEventsView).pointerEvents
      } else PointerEvents.AUTO

    // Views that are disabled should never be the target of pointer events. However, their children
    // can be because some views (SwipeRefreshLayout) use enabled but still have children that can
    // be valid targets.
    if (!view.isEnabled) {
      if (pointerEvents == PointerEvents.AUTO) {
        return PointerEventsConfig.BOX_NONE
      } else if (pointerEvents == PointerEvents.BOX_ONLY) {
        return PointerEventsConfig.NONE
      }
    }

    return when (pointerEvents) {
      PointerEvents.BOX_ONLY -> PointerEventsConfig.BOX_ONLY
      PointerEvents.BOX_NONE -> PointerEventsConfig.BOX_NONE
      PointerEvents.NONE -> PointerEventsConfig.NONE
      PointerEvents.AUTO -> PointerEventsConfig.AUTO
    }
  }

  override fun getChildInDrawingOrderAtIndex(parent: ViewGroup, index: Int): View {
    return if (parent is ReactViewGroup) {
      parent.getChildAt(parent.getZIndexMappedChildIndex(index))
    } else parent.getChildAt(index)
  }

  override fun isViewClippingChildren(view: ViewGroup): Boolean {
    if (view.clipChildren) {
      return true
    }
    return if (view is ReactViewGroup) {
      "hidden" == view.overflow
    } else false
  }
}
