package abi28_0_0.host.exp.exponent.modules.api.components.gesturehandler;

import android.view.View;
import android.view.ViewGroup;

public class ViewConfigurationHelperImpl implements ViewConfigurationHelper {

  @Override
  public PointerEventsConfig getPointerEventsConfigForView(View view) {
    return view.isEnabled() ? PointerEventsConfig.AUTO : PointerEventsConfig.NONE;
  }

  @Override
  public View getChildInDrawingOrderAtIndex(ViewGroup parent, int index) {
    return parent.getChildAt(index);
  }
}
