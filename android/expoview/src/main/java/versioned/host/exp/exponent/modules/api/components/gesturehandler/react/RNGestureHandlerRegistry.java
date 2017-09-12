package versioned.host.exp.exponent.modules.api.components.gesturehandler.react;

import android.util.SparseArray;
import android.view.View;

import versioned.host.exp.exponent.modules.api.components.gesturehandler.GestureHandler;
import versioned.host.exp.exponent.modules.api.components.gesturehandler.GestureHandlerRegistry;

import java.util.ArrayList;

public class RNGestureHandlerRegistry implements GestureHandlerRegistry {

  private SparseArray<ArrayList<GestureHandler>> mHandlers = new SparseArray<>();

  public void registerHandlerForViewWithTag(int viewTag, GestureHandler handler) {
    ArrayList<GestureHandler> listToAdd = mHandlers.get(viewTag);
    if (listToAdd == null) {
      listToAdd = new ArrayList<>(1);
      listToAdd.add(handler);
      mHandlers.put(viewTag, listToAdd);
    } else {
      listToAdd.add(handler);
    }
  }

  public void dropHandlersForViewWithTag(int viewTag) {
    mHandlers.delete(viewTag);
  }

  public void dropAllHandlers() {
    mHandlers.clear();
  }

  public ArrayList<GestureHandler> getHandlersForViewWithTag(int viewTag) {
    return mHandlers.get(viewTag);
  }

  @Override
  public ArrayList<GestureHandler> getHandlersForView(View view) {
    return getHandlersForViewWithTag(view.getId());
  }
}
