package abi39_0_0.host.exp.exponent.modules.api.screens;

import android.content.Context;
import android.view.View;

import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;

import abi39_0_0.com.facebook.react.bridge.ReactContext;
import abi39_0_0.com.facebook.react.uimanager.UIManagerModule;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;

public class ScreenStack extends ScreenContainer<ScreenStackFragment> {

  private static final String BACK_STACK_TAG = "RN_SCREEN_LAST";

  private final ArrayList<ScreenStackFragment> mStack = new ArrayList<>();
  private final Set<ScreenStackFragment> mDismissed = new HashSet<>();

  private ScreenStackFragment mTopScreen = null;
  private boolean mRemovalTransitionStarted = false;

  private final FragmentManager.OnBackStackChangedListener mBackStackListener = new FragmentManager.OnBackStackChangedListener() {
    @Override
    public void onBackStackChanged() {
      if (mFragmentManager.getBackStackEntryCount() == 0) {
        // when back stack entry count hits 0 it means the user's navigated back using hw back
        // button. As the "fake" transaction we installed on the back stack does nothing we need
        // to handle back navigation on our own.
        dismiss(mTopScreen);
      }
    }
  };

  private final FragmentManager.FragmentLifecycleCallbacks mLifecycleCallbacks = new FragmentManager.FragmentLifecycleCallbacks() {
    @Override
    public void onFragmentResumed(FragmentManager fm, Fragment f) {
      if (mTopScreen == f) {
        setupBackHandlerIfNeeded(mTopScreen);
      }
    }
  };

  public ScreenStack(Context context) {
    super(context);
  }

  public void dismiss(ScreenStackFragment screenFragment) {
    mDismissed.add(screenFragment);
    markUpdated();
  }

  public Screen getTopScreen() {
    return mTopScreen != null ? mTopScreen.getScreen() : null;
  }

  public Screen getRootScreen() {
    for (int i = 0, size = getScreenCount(); i < size; i++) {
      Screen screen = getScreenAt(i);
      if (!mDismissed.contains(screen.getFragment())) {
        return screen;
      }
    }
    throw new IllegalStateException("Stack has no root screen set");
  }

  @Override
  protected ScreenStackFragment adapt(Screen screen) {
    return new ScreenStackFragment(screen);
  }

  @Override
  protected void onDetachedFromWindow() {
    if (mFragmentManager != null) {
      mFragmentManager.removeOnBackStackChangedListener(mBackStackListener);
      mFragmentManager.unregisterFragmentLifecycleCallbacks(mLifecycleCallbacks);
      if (!mFragmentManager.isStateSaved()) {
        // state save means that the container where fragment manager was installed has been unmounted.
        // This could happen as a result of dismissing nested stack. In such a case we don't need to
        // reset back stack as it'd result in a crash caused by the fact the fragment manager is no
        // longer attached.
        mFragmentManager.popBackStack(BACK_STACK_TAG, FragmentManager.POP_BACK_STACK_INCLUSIVE);
      }
    }
    super.onDetachedFromWindow();
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    mFragmentManager.registerFragmentLifecycleCallbacks(mLifecycleCallbacks, false);
  }

  @Override
  public void startViewTransition(View view) {
    super.startViewTransition(view);
    mRemovalTransitionStarted = true;
  }

  @Override
  public void endViewTransition(View view) {
    super.endViewTransition(view);
    if (mRemovalTransitionStarted) {
      mRemovalTransitionStarted = false;
      dispatchOnFinishTransitioning();
    }
  }

  public void onViewAppearTransitionEnd() {
    if (!mRemovalTransitionStarted) {
      dispatchOnFinishTransitioning();
    }
  }

  private void dispatchOnFinishTransitioning() {
    ((ReactContext) getContext())
            .getNativeModule(UIManagerModule.class)
            .getEventDispatcher()
            .dispatchEvent(new StackFinishTransitioningEvent(getId()));
  }

  @Override
  protected void removeScreenAt(int index) {
    Screen toBeRemoved = getScreenAt(index);
    mDismissed.remove(toBeRemoved.getFragment());
    super.removeScreenAt(index);
  }

  @Override
  protected void removeAllScreens() {
    mDismissed.clear();
    super.removeAllScreens();
  }

  @Override
  protected boolean hasScreen(ScreenFragment screenFragment) {
    return super.hasScreen(screenFragment) && !mDismissed.contains(screenFragment);
  }

  @Override
  protected void performUpdate() {
    // remove all screens previously on stack
    for (ScreenStackFragment screen : mStack) {
      if (!mScreenFragments.contains(screen) || mDismissed.contains(screen)) {
        getOrCreateTransaction().remove(screen);
      }
    }

    // When going back from a nested stack with a single screen on it, we may hit an edge case
    // when all screens are dismissed and no screen is to be displayed on top. We need to gracefully
    // handle the case of newTop being NULL, which happens in several places below
    ScreenStackFragment newTop = null; // newTop is nullable, see the above comment ^
    ScreenStackFragment belowTop = null; // this is only set if newTop has TRANSPARENT_MODAL presentation mode

    for (int i = mScreenFragments.size() - 1; i >= 0; i--) {
      ScreenStackFragment screen = mScreenFragments.get(i);
      if (!mDismissed.contains(screen)) {
        if (newTop == null) {
          newTop = screen;
          if (newTop.getScreen().getStackPresentation() != Screen.StackPresentation.TRANSPARENT_MODAL) {
            break;
          }
        } else {
          belowTop = screen;
          break;
        }
      }
    }

    for (ScreenStackFragment screen : mScreenFragments) {
      // detach all screens that should not be visible
      if (screen != newTop && screen != belowTop && !mDismissed.contains(screen)) {
        getOrCreateTransaction().remove(screen);
      }
    }
    // attach "below top" screen if set
    if (belowTop != null && !belowTop.isAdded()) {
      final ScreenStackFragment top = newTop;
      getOrCreateTransaction().add(getId(), belowTop).runOnCommit(new Runnable() {
        @Override
        public void run() {
          top.getScreen().bringToFront();
        }
      });
    }

    if (newTop != null && !newTop.isAdded()) {
      getOrCreateTransaction().add(getId(), newTop);
    }

    if (!mStack.contains(newTop)) {
      // if new top screen wasn't on stack we do "open animation" so long it is not the very first screen on stack
      if (mTopScreen != null && newTop != null) {
        // there was some other screen attached before
        int transition = FragmentTransaction.TRANSIT_FRAGMENT_OPEN;
        if (!mScreenFragments.contains(mTopScreen) && newTop.getScreen().getReplaceAnimation() == Screen.ReplaceAnimation.POP) {
          // if the previous top screen does not exist anymore and the new top was not on the stack before,
          // probably replace was called, so we check the animation
          transition = FragmentTransaction.TRANSIT_FRAGMENT_CLOSE;
        }
        switch (newTop.getScreen().getStackAnimation()) {
          case NONE:
            transition = FragmentTransaction.TRANSIT_NONE;
            break;
          case FADE:
            transition = FragmentTransaction.TRANSIT_FRAGMENT_FADE;
            break;
        }
        getOrCreateTransaction().setTransition(transition);
      }
    } else if (mTopScreen != null && !mTopScreen.equals(newTop)) {
      // otherwise if we are performing top screen change we do "back animation"
      int transition = FragmentTransaction.TRANSIT_FRAGMENT_CLOSE;
      switch (mTopScreen.getScreen().getStackAnimation()) {
        case NONE:
          transition = FragmentTransaction.TRANSIT_NONE;
          break;
        case FADE:
          transition = FragmentTransaction.TRANSIT_FRAGMENT_FADE;
          break;
      }
      getOrCreateTransaction().setTransition(transition);
    }

    mTopScreen = newTop;

    mStack.clear();
    mStack.addAll(mScreenFragments);

    tryCommitTransaction();

    if (mTopScreen != null) {
      setupBackHandlerIfNeeded(mTopScreen);
    }

    for (ScreenStackFragment screen : mStack) {
      screen.onStackUpdate();
    }
  }

  /**
   * The below method sets up fragment manager's back stack in a way that it'd trigger our back
   * stack change listener when hw back button is clicked.
   *
   * Because back stack by default rolls back the transaction the stack entry is associated with we
   * generate a "fake" transaction that hides and shows the top fragment. As a result when back
   * stack entry is rolled back nothing happens and we are free to handle back navigation on our
   * own in `mBackStackListener`.
   *
   * We pop that "fake" transaction each time we update stack and we add a new one in case the top
   * screen is allowed to be dismised using hw back button. This way in the listener we can tell
   * if back button was pressed based on the count of the items on back stack. We expect 0 items
   * in case hw back is pressed becakse we try to keep the number of items at 1 by always resetting
   * and adding new items. In case we don't add a new item to back stack we remove listener so that
   * it does not get triggered.
   *
   * It is important that we don't install back handler when stack contains a single screen as in
   * that case we want the parent navigator or activity handler to take over.
   */
  private void setupBackHandlerIfNeeded(ScreenStackFragment topScreen) {
    if (!mTopScreen.isResumed()) {
      // if the top fragment is not in a resumed state, adding back stack transaction would throw.
      // In such a case we skip installing back handler and use FragmentLifecycleCallbacks to get
      // notified when it gets resumed so that we can install the handler.
      return;
    }
    mFragmentManager.removeOnBackStackChangedListener(mBackStackListener);
    mFragmentManager.popBackStack(BACK_STACK_TAG, FragmentManager.POP_BACK_STACK_INCLUSIVE);
    ScreenStackFragment firstScreen = null;
    for (int i = 0, size = mStack.size(); i < size; i++) {
      ScreenStackFragment screen = mStack.get(i);
      if (!mDismissed.contains(screen)) {
        firstScreen = screen;
        break;
      }
    }
    if (topScreen != firstScreen && topScreen.isDismissable()) {
      mFragmentManager
              .beginTransaction()
              .show(topScreen)
              .addToBackStack(BACK_STACK_TAG)
              .setPrimaryNavigationFragment(topScreen)
              .commitAllowingStateLoss();
      mFragmentManager.addOnBackStackChangedListener(mBackStackListener);
    }
  }
}
