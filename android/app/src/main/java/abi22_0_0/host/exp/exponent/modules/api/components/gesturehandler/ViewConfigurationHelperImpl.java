package abi22_0_0.host.exp.exponent.modules.api.components.gesturehandler;

import android.view.View;
import android.view.ViewGroup;

public class ViewConfigurationHelperImpl implements ViewConfigurationHelper {

  @Override
  public PointerEvents getPointerEventsConfigForView(View view) {
    return view.isEnabled() ? PointerEvents.AUTO : PointerEvents.NONE;
  }

  @Override
  public View getChildInDrawingOrderAtIndex(ViewGroup parent, int index) {
    return parent.getChildAt(index);
  }
}
