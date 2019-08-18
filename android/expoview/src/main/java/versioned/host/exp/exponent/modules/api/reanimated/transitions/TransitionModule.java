package versioned.host.exp.exponent.modules.api.reanimated.transitions;

import android.support.transition.TransitionManager;
import android.view.View;
import android.view.ViewGroup;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.UIBlock;
import com.facebook.react.uimanager.UIManagerModule;

public class TransitionModule {

  private final UIManagerModule mUIManager;

  public TransitionModule(UIManagerModule uiManager) {
    mUIManager = uiManager;
  }

  public void animateNextTransition(final int rootTag, final ReadableMap config) {
    mUIManager.prependUIBlock(new UIBlock() {
      @Override
      public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
        try {
          View rootView = nativeViewHierarchyManager.resolveView(rootTag);
          if (rootView instanceof ViewGroup) {
            ReadableArray transitions = config.getArray("transitions");
            for (int i = 0, size = transitions.size(); i < size; i++) {
              TransitionManager.beginDelayedTransition(
                      (ViewGroup) rootView,
                      TransitionUtils.inflate(transitions.getMap(i)));
            }
          }
        } catch (IllegalViewOperationException ex) {
          // ignore, view might have not been registered yet
        }

      }
    });

  }

}
