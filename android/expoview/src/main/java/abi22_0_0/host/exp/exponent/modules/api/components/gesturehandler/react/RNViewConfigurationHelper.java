package abi22_0_0.host.exp.exponent.modules.api.components.gesturehandler.react;

import android.view.View;
import android.view.ViewGroup;

import abi22_0_0.com.facebook.react.uimanager.ReactPointerEventsView;
import abi22_0_0.com.facebook.react.views.view.ReactViewGroup;
import abi22_0_0.host.exp.exponent.modules.api.components.gesturehandler.PointerEvents;
import abi22_0_0.host.exp.exponent.modules.api.components.gesturehandler.ViewConfigurationHelper;

public class RNViewConfigurationHelper implements ViewConfigurationHelper {

  @Override
  public PointerEvents getPointerEventsConfigForView(View view) {
    abi22_0_0.com.facebook.react.uimanager.PointerEvents pointerEvents;
    pointerEvents = view instanceof ReactPointerEventsView ?
            ((ReactPointerEventsView) view).getPointerEvents() :
        abi22_0_0.com.facebook.react.uimanager.PointerEvents.AUTO;

    // Views that are disabled should never be the target of pointer events. However, their children
    // can be because some views (SwipeRefreshLayout) use enabled but still have children that can
    // be valid targets.
    if (!view.isEnabled()) {
      if (pointerEvents == abi22_0_0.com.facebook.react.uimanager.PointerEvents.AUTO) {
        return PointerEvents.BOX_NONE;
      } else if (pointerEvents == abi22_0_0.com.facebook.react.uimanager.PointerEvents.BOX_ONLY) {
        return PointerEvents.NONE;
      }
    }

    switch (pointerEvents) {
      case BOX_ONLY: return PointerEvents.BOX_ONLY;
      case BOX_NONE: return PointerEvents.BOX_NONE;
      case NONE: return PointerEvents.NONE;
    }

    return PointerEvents.AUTO;
  }

  @Override
  public View getChildInDrawingOrderAtIndex(ViewGroup parent, int index) {
    if (parent instanceof ReactViewGroup) {
      return parent.getChildAt(((ReactViewGroup) parent).getZIndexMappedChildIndex(index));
    }
    return parent.getChildAt(index);
  }
}
