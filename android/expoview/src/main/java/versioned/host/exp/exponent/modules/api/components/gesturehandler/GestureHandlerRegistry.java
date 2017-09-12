package versioned.host.exp.exponent.modules.api.components.gesturehandler;

import android.view.View;

import java.util.ArrayList;

public interface GestureHandlerRegistry {
  ArrayList<GestureHandler> getHandlersForView(View view);
}
