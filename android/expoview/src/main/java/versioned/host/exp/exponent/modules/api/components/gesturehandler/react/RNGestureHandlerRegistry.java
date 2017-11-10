package versioned.host.exp.exponent.modules.api.components.gesturehandler.react;

import android.util.SparseArray;
import android.view.View;

import versioned.host.exp.exponent.modules.api.components.gesturehandler.GestureHandler;
import versioned.host.exp.exponent.modules.api.components.gesturehandler.GestureHandlerRegistry;

import java.util.ArrayList;

import javax.annotation.Nullable;

public class RNGestureHandlerRegistry implements GestureHandlerRegistry {

  private SparseArray<GestureHandler> mHandlers = new SparseArray<>();
  private SparseArray<Integer> mAttachedTo = new SparseArray<>();
  private SparseArray<ArrayList<GestureHandler>> mHandlersForView = new SparseArray<>();

  public void registerHandler(GestureHandler handler) {
    mHandlers.put(handler.getTag(), handler);
  }

  public @Nullable GestureHandler getHandler(int handlerTag) {
    return mHandlers.get(handlerTag);
  }

  public boolean attachHandlerToView(int handlerTag, int viewTag) {
    GestureHandler handler = mHandlers.get(handlerTag);
    if (handler != null) {
      detachHandler(handler);
      registerHandlerForViewWithTag(viewTag, handler);
      return true;
    } else {
      return false;
    }
  }

  private void registerHandlerForViewWithTag(int viewTag, GestureHandler handler) {
    if (mAttachedTo.get(handler.getTag()) != null) {
      throw new IllegalStateException("Handler " + handler + " already attached");
    }
    mAttachedTo.put(handler.getTag(), viewTag);
    ArrayList<GestureHandler> listToAdd = mHandlersForView.get(viewTag);
    if (listToAdd == null) {
      listToAdd = new ArrayList<>(1);
      listToAdd.add(handler);
      mHandlersForView.put(viewTag, listToAdd);
    } else {
      listToAdd.add(handler);
    }
  }

  private void detachHandler(GestureHandler handler) {
    Integer attachedToView = mAttachedTo.get(handler.getTag());
    if (attachedToView != null) {
      mAttachedTo.remove(handler.getTag());
      ArrayList<GestureHandler> attachedHandlers = mHandlersForView.get(attachedToView);
      if (attachedHandlers != null) {
        attachedHandlers.remove(handler);
        if (attachedHandlers.size() == 0) {
          mHandlersForView.remove(attachedToView);
        }
      }
    }
  }

  public void dropHandler(int handlerTag) {
    GestureHandler handler = mHandlers.get(handlerTag);
    if (handler != null) {
      detachHandler(handler);
      mHandlers.remove(handlerTag);
    }
  }

  public void dropAllHandlers() {
    mHandlers.clear();
    mAttachedTo.clear();
    mHandlersForView.clear();
  }

  public ArrayList<GestureHandler> getHandlersForViewWithTag(int viewTag) {
    return mHandlersForView.get(viewTag);
  }

  @Override
  public ArrayList<GestureHandler> getHandlersForView(View view) {
    return getHandlersForViewWithTag(view.getId());
  }
}
