package abi28_0_0.host.exp.exponent.modules.api.components.gesturehandler.react;

import android.util.SparseArray;

import abi28_0_0.com.facebook.react.bridge.ReadableArray;
import abi28_0_0.com.facebook.react.bridge.ReadableMap;
import abi28_0_0.host.exp.exponent.modules.api.components.gesturehandler.GestureHandler;
import abi28_0_0.host.exp.exponent.modules.api.components.gesturehandler.GestureHandlerInteractionController;

public class RNGestureHandlerInteractionManager implements GestureHandlerInteractionController {

  private static final String KEY_WAIT_FOR = "waitFor";
  private static final String KEY_SIMULTANEOUS_HANDLERS = "simultaneousHandlers";

  private SparseArray<int[]> mWaitForRelations = new SparseArray<>();
  private SparseArray<int[]> mSimultaneousRelations = new SparseArray<>();

  public void dropRelationsForHandlerWithTag(int handlerTag) {
    mWaitForRelations.remove(handlerTag);
    mSimultaneousRelations.remove(handlerTag);
  }

  private int[] convertHandlerTagsArray(ReadableMap config, String key) {
    ReadableArray array = config.getArray(key);
    int[] result = new int[array.size()];
    for (int i = 0; i < result.length; i++) {
      result[i] = array.getInt(i);
    }
    return result;
  }

  public void configureInteractions(GestureHandler handler, ReadableMap config) {
    handler.setInteractionController(this);
    if (config.hasKey(KEY_WAIT_FOR)) {
      int[] tags = convertHandlerTagsArray(config, KEY_WAIT_FOR);
      mWaitForRelations.put(handler.getTag(), tags);
    }
    if (config.hasKey(KEY_SIMULTANEOUS_HANDLERS)) {
      int[] tags = convertHandlerTagsArray(config, KEY_SIMULTANEOUS_HANDLERS);
      mSimultaneousRelations.put(handler.getTag(), tags);
    }
  }

  @Override
  public boolean shouldWaitForHandlerFailure(GestureHandler handler, GestureHandler otherHandler) {
    int[] waitForTags = mWaitForRelations.get(handler.getTag());
    if (waitForTags != null) {
      for (int i = 0; i < waitForTags.length; i++) {
        if (waitForTags[i] == otherHandler.getTag()) {
          return true;
        }
      }
    }
    return false;
  }

  @Override
  public boolean shouldRequireHandlerToWaitForFailure(GestureHandler handler,
                                                      GestureHandler otherHandler) {
    return false;
  }

  @Override
  public boolean shouldHandlerBeCancelledBy(GestureHandler handler, GestureHandler otherHandler) {
    return false;
  }

  @Override
  public boolean shouldRecognizeSimultaneously(GestureHandler handler,
                                               GestureHandler otherHandler) {
    int[] simultHandlerTags = mSimultaneousRelations.get(handler.getTag());
    if (simultHandlerTags != null) {
      for (int i = 0; i < simultHandlerTags.length; i++) {
        if (simultHandlerTags[i] == otherHandler.getTag()) {
          return true;
        }
      }
    }
    return false;
  }

  public void reset() {
    mWaitForRelations.clear();
    mSimultaneousRelations.clear();
  }
}
