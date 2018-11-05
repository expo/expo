package abi30_0_0.host.exp.exponent.modules.api.screens;

import android.app.Activity;
import android.content.Context;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentActivity;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentTransaction;
import android.view.ViewGroup;

import abi30_0_0.com.facebook.react.bridge.ReactContext;
import abi30_0_0.com.facebook.react.modules.core.ChoreographerCompat;
import abi30_0_0.com.facebook.react.modules.core.ReactChoreographer;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class ScreenContainer extends ViewGroup {

  private final ArrayList<Screen> mScreens = new ArrayList<>();
  private final Set<Screen> mActiveScreens = new HashSet<>();
  private final FragmentManager mFragmentManager;

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
    Activity activity = ((ReactContext) context).getCurrentActivity();
    if (activity instanceof FragmentActivity) {
      mFragmentManager = ((FragmentActivity) activity).getSupportFragmentManager();
    } else {
      throw new IllegalStateException(
              "In order to use RNScreen components your app's activity need to extend ReactFragmentActivity or ReactCompatActivity");
    }
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

  private FragmentTransaction getOrCreateTransaction() {
    if (mCurrentTransaction == null) {
      mCurrentTransaction = mFragmentManager.beginTransaction();
      mCurrentTransaction.setReorderingAllowed(true);
    }
    return mCurrentTransaction;
  }

  private void tryCommitTransaction() {
    if (mCurrentTransaction != null) {
      mCurrentTransaction.commit();
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
    if (!mNeedUpdate || mFragmentManager.isDestroyed() || !mIsAttached) {
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
    }
    tryCommitTransaction();
  }
}
