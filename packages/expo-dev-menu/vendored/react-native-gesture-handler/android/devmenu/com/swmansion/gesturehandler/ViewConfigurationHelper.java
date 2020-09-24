package devmenu.com.swmansion.gesturehandler;

import android.view.View;
import android.view.ViewGroup;

public interface ViewConfigurationHelper {
  PointerEventsConfig getPointerEventsConfigForView(View view);
  View getChildInDrawingOrderAtIndex(ViewGroup parent, int index);
  boolean isViewClippingChildren(ViewGroup view);
}
