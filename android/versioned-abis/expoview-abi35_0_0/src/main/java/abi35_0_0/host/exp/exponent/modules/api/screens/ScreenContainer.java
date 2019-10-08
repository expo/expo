package abi35_0_0.host.exp.exponent.modules.api.screens;

import android.app.Activity;
import android.content.Context;
import android.content.ContextWrapper;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;
import android.view.ViewGroup;
import android.view.ViewParent;

import abi35_0_0.com.facebook.react.ReactRootView;
import abi35_0_0.com.facebook.react.bridge.ReactContext;
import abi35_0_0.com.facebook.react.modules.core.ChoreographerCompat;
import abi35_0_0.com.facebook.react.modules.core.ReactChoreographer;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class ScreenContainer extends ViewGroup {

  private final ArrayList<Screen> mScreens = new ArrayList<>();
  private final Set<Screen> mActiveScreens = new HashSet<>();

  private @Nullable FragmentTransaction mCurrentTransaction;
  private boolean mNeedUpdate;
  private boolean mIsAttached;

  private ChoreographerCompat.FrameCallback mFrameCallback = new ChoreographerCompat.FrameCallback() {
    @Override
    public void doFrame(long frameTimeNanos) {
      updateIfNeeded();
    }
  };

  public ScreenContainer(Context context) {
    super(context);
  }

  @Override
  protected void onLayout(boolean b, int i, int i1, int i2, int i3) {
    // no-op
  }

  protected void markUpdated() {
    if (!mNeedUpdate) {
      mNeedUpdate = true;
      // enqueue callback of NATIVE_ANIMATED_MODULE type as all view operations are executed in
      // DISPATCH_UI type and we want the callback to be called right after in the same frame.
      ReactChoreographer.getInstance().postFrameCallback(
              ReactChoreographer.CallbackType.NATIVE_ANIMATED_MODULE,
              mFrameCallback);
    }
  }

  protected void notifyChildUpdate() {
    markUpdated();
  }

  protected void addScreen(Screen screen, int index) {
    mScreens.add(index, screen);
    screen.setContainer(this);
    markUpdated();
  }

  protected void removeScreenAt(int index) {
    mScreens.get(index).setContainer(null);
    mScreens.remove(index);
    markUpdated();
  }

  protected int getScreenCount() {
    return mScreens.size();
  }

  protected Screen getScreenAt(int index) {
    return mScreens.get(index);
  }

  private FragmentActivity findRootFragmentActivity() {
    ViewParent parent = this;
    while (!(parent instanceof ReactRootView) && parent.getParent() != null) {
      parent = parent.getParent();
    }
    // we expect top level view to be of type ReactRootView, this isn't really necessary but in order
    // to find root view we test if parent is null. This could potentially happen also when the view
    // is detached from the hierarchy and that test would not correctly indicate the root view. So
    // in order to make sure we indeed reached the root we test if it is of a correct type. This
    // allows us to provide a more descriptive error message for the aforementioned case.
    if (!(parent instanceof ReactRootView)) {
      throw new IllegalStateException("ScreenContainer is not attached under ReactRootView");
    }
    // ReactRootView is expected to be initialized with the main React Activity as a context but
    // in case of Expo the activity is wrapped in ContextWrapper and we need to unwrap it
    Context context = ((ReactRootView) parent).getContext();
    while (!(context instanceof FragmentActivity) && context instanceof ContextWrapper) {
      context = ((ContextWrapper) context).getBaseContext();
    }
    if (!(context instanceof FragmentActivity)) {
      throw new IllegalStateException(
              "In order to use RNScreens components your app's activity need to extend ReactFragmentActivity or ReactCompatActivity");
    }
    return (FragmentActivity) context;
  }

  private FragmentTransaction getOrCreateTransaction() {
    if (mCurrentTransaction == null) {
      mCurrentTransaction = findRootFragmentActivity().getSupportFragmentManager().beginTransaction();
      mCurrentTransaction.setReorderingAllowed(true);
    }
    return mCurrentTransaction;
  }

  private void tryCommitTransaction() {
    if (mCurrentTransaction != null) {
      mCurrentTransaction.commitAllowingStateLoss();
      mCurrentTransaction = null;
    }
  }

  private void attachScreen(Screen screen) {
    getOrCreateTransaction().add(getId(), screen.getFragment());
    mActiveScreens.add(screen);
  }

  private void moveToFront(Screen screen) {
    FragmentTransaction transaction = getOrCreateTransaction();
    Fragment fragment = screen.getFragment();
    transaction.remove(fragment);
    transaction.add(getId(), fragment);
  }

  private void detachScreen(Screen screen) {
    getOrCreateTransaction().remove(screen.getFragment());
    mActiveScreens.remove(screen);
  }

  protected boolean isScreenActive(Screen screen, List<Screen> allScreens) {
    return screen.isActive();
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    mIsAttached = true;
    updateIfNeeded();
  }

  @Override
  protected void onDetachedFromWindow() {
    super.onDetachedFromWindow();
    mIsAttached = false;
  }

  private void updateIfNeeded() {
    if (!mNeedUpdate || !mIsAttached) {
      return;
    }
    mNeedUpdate = false;

    // detach screens that are no longer active
    Set<Screen> orphaned = new HashSet<>(mActiveScreens);
    for (int i = 0, size = mScreens.size(); i < size; i++) {
      Screen screen = mScreens.get(i);
      boolean isActive = isScreenActive(screen, mScreens);
      if (!isActive && mActiveScreens.contains(screen)) {
        detachScreen(screen);
      }
      orphaned.remove(screen);
    }
    if (!orphaned.isEmpty()) {
      Object[] orphanedAry = orphaned.toArray();
      for (int i = 0; i < orphanedAry.length; i++) {
        detachScreen((Screen) orphanedAry[i]);
      }
    }

    // detect if we are "transitioning" based on the number of active screens
    int activeScreens = 0;
    for (int i = 0, size = mScreens.size(); i < size; i++) {
      if (isScreenActive(mScreens.get(i), mScreens)) {
        activeScreens += 1;
      }
    }
    boolean transitioning = activeScreens > 1;

    // attach newly activated screens
    boolean addedBefore = false;
    for (int i = 0, size = mScreens.size(); i < size; i++) {
      Screen screen = mScreens.get(i);
      boolean isActive = isScreenActive(screen, mScreens);
      if (isActive && !mActiveScreens.contains(screen)) {
        addedBefore = true;
        attachScreen(screen);
      } else if (isActive && addedBefore) {
        moveToFront(screen);
      }
      screen.setTransitioning(transitioning);
    }
    tryCommitTransaction();
  }
}
