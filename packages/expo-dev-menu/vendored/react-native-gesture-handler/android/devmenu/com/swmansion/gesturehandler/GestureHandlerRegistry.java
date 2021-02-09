package devmenu.com.swmansion.gesturehandler;

import android.view.View;
import android.view.ViewGroup;

import java.util.ArrayList;

public interface GestureHandlerRegistry {
  ArrayList<GestureHandler> getHandlersForView(View view);
}
