package devmenu.com.swmansion.gesturehandler;

import android.view.View;

import java.util.ArrayList;
import java.util.WeakHashMap;

public class GestureHandlerRegistryImpl implements GestureHandlerRegistry {

  private WeakHashMap<View, ArrayList<GestureHandler>> mHandlers = new WeakHashMap<>();

  public <T extends GestureHandler> T registerHandlerForView(View view, T handler) {
    ArrayList<GestureHandler> listToAdd = mHandlers.get(view);
    if (listToAdd == null) {
      listToAdd = new ArrayList<>(1);
      listToAdd.add(handler);
      mHandlers.put(view, listToAdd);
    } else {
      listToAdd.add(handler);
    }
    return handler;
  }

  @Override
  public ArrayList<GestureHandler> getHandlersForView(View view) {
    return mHandlers.get(view);
  }
}

