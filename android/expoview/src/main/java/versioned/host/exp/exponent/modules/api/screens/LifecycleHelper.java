package versioned.host.exp.exponent.modules.api.screens;

import android.arch.lifecycle.Lifecycle;
import android.arch.lifecycle.LifecycleObserver;
import android.support.v4.app.Fragment;
import android.util.Log;
import android.view.View;
import android.view.ViewParent;

import com.facebook.react.modules.core.ChoreographerCompat;
import com.facebook.react.modules.core.ReactChoreographer;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nullable;

public class LifecycleHelper {

  public static @Nullable Fragment findNearestScreenFragmentAncestor(View view) {
    ViewParent parent = view.getParent();
    while (parent != null && !(parent instanceof Screen)) {
      parent = parent.getParent();
    }
    if (parent != null) {
      return ((Screen) parent).getFragment();
    }
    return null;
  }

  private Map<View, Lifecycle> mViewToLifecycleMap = new HashMap<>();
  private View.OnLayoutChangeListener mRegisterOnLayoutChange = new View.OnLayoutChangeListener() {
    @Override
    public void onLayoutChange(View view, int i, int i1, int i2, int i3, int i4, int i5, int i6, int i7) {
      registerViewWithLifecycleOwner(view);
      view.removeOnLayoutChangeListener(this);
    }
  };

  private void registerViewWithLifecycleOwner(View view) {
    Fragment parent = findNearestScreenFragmentAncestor(view);
    if (parent != null && view instanceof LifecycleObserver) {
      Lifecycle lifecycle = parent.getLifecycle();
      lifecycle.addObserver((LifecycleObserver) view);
      mViewToLifecycleMap.put(view, lifecycle);
    }
  }

  public <T extends View & LifecycleObserver> void register(T view) {
    // we need to wait until view is mounted in the hierarchy as this method is called only at the
    // moment of the view creation. In order to register lifecycle observer we need to find ancestor
    // of type Screen and this can only happen when the view is properly attached. We rely on Android's
    // onLayout callback being triggered when the view gets added to the hierarchy and only then we
    // attempt to locate lifecycle owner ancestor.
    view.addOnLayoutChangeListener(mRegisterOnLayoutChange);
  }

  public <T extends View & LifecycleObserver> void unregister(T view) {
    Lifecycle lifecycle = mViewToLifecycleMap.get(view);
    if (lifecycle != null) {
      lifecycle.removeObserver(view);
    }
  }
}
