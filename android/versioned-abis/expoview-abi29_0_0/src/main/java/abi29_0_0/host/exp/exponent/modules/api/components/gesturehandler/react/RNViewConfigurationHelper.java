package abi29_0_0.host.exp.exponent.modules.api.components.gesturehandler.react;

import android.view.View;
import android.view.ViewGroup;

import abi29_0_0.com.facebook.react.uimanager.PointerEvents;
import abi29_0_0.com.facebook.react.uimanager.ReactPointerEventsView;
import abi29_0_0.com.facebook.react.views.view.ReactViewGroup;
import abi29_0_0.host.exp.exponent.modules.api.components.gesturehandler.PointerEventsConfig;
import abi29_0_0.host.exp.exponent.modules.api.components.gesturehandler.ViewConfigurationHelper;

public class RNViewConfigurationHelper implements ViewConfigurationHelper {

  @Override
  public PointerEventsConfig getPointerEventsConfigForView(View view) {
    PointerEvents pointerEvents;
    pointerEvents = view instanceof ReactPointerEventsView ?
            ((ReactPointerEventsView) view).getPointerEvents() :
            PointerEvents.AUTO;

    // Views that are disabled should never be the target of pointer events. However, their children
    // can be because some views (SwipeRefreshLayout) use enabled but still have children that can
    // be valid targets.
    if (!view.isEnabled()) {
      if (pointerEvents == PointerEvents.AUTO) {
        return PointerEventsConfig.BOX_NONE;
      } else if (pointerEvents == PointerEvents.BOX_ONLY) {
        return PointerEventsConfig.NONE;
      }
    }

    switch (pointerEvents) {
      case BOX_ONLY: return PointerEventsConfig.BOX_ONLY;
      case BOX_NONE: return PointerEventsConfig.BOX_NONE;
      case NONE: return PointerEventsConfig.NONE;
    }

    return PointerEventsConfig.AUTO;
  }

  @Override
  public View getChildInDrawingOrderAtIndex(ViewGroup parent, int index) {
    if (parent instanceof ReactViewGroup) {
      return parent.getChildAt(((ReactViewGroup) parent).getZIndexMappedChildIndex(index));
    }
    return parent.getChildAt(index);
  }
}
