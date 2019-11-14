package versioned.host.exp.exponent.modules.api.screens;

import android.content.Context;

import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;

public class ScreenStack extends ScreenContainer<ScreenStackFragment> {

  private static final String BACK_STACK_TAG = "RN_SCREEN_LAST";

  private final ArrayList<ScreenStackFragment> mStack = new ArrayList<>();
  private final Set<ScreenStackFragment> mDismissed = new HashSet<>();

  private ScreenStackFragment mTopScreen = null;

  private final FragmentManager.OnBackStackChangedListener mBackStackListener = new FragmentManager.OnBackStackChangedListener() {
    @Override
    public void onBackStackChanged() {
      if (getFragmentManager().getBackStackEntryCount() == 0) {
        // when back stack entry count hits 0 it means the user's navigated back using hw back
        // button. As the "fake" transaction we installed on the back stack does nothing we need
        // to handle back navigation on our own.
        dismiss(mTopScreen);
      }
    }
  };

  public ScreenStack(Context context) {
    super(context);
  }

  public void dismiss(ScreenStackFragment screenFragment) {
    mDismissed.add(screenFragment);
    onUpdate();
  }

  public Screen getTopScreen() {
    return mTopScreen.getScreen();
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
    super.onDetachedFromWindow();
    getFragmentManager().removeOnBackStackChangedListener(mBackStackListener);
    getFragmentManager().popBackStack(BACK_STACK_TAG, FragmentManager.POP_BACK_STACK_INCLUSIVE);
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    if (mTopScreen != null) {
      setupBackHandlerIfNeeded(mTopScreen);
    }
  }

  @Override
  protected void removeScreenAt(int index) {
    Screen toBeRemoved = getScreenAt(index);
    mDismissed.remove(toBeRemoved);
    super.removeScreenAt(index);
  }

  @Override
  protected void onUpdate() {
    // remove all screens previously on stack
    for (ScreenStackFragment screen : mStack) {
      if (!mScreenFragments.contains(screen) || mDismissed.contains(screen)) {
        getOrCreateTransaction().remove(screen);
      }
    }
    ScreenStackFragment newTop = null;
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
      // add all new views that weren't on stack before
      if (!mStack.contains(screen) && !mDismissed.contains(screen)) {
        getOrCreateTransaction().add(getId(), screen);
      }
      // detach all screens that should not be visible
      if (screen != newTop && screen != belowTop && !mDismissed.contains(screen)) {
        getOrCreateTransaction().hide(screen);
      }
    }
    // attach "below top" screen if set
    if (belowTop != null) {
      final ScreenStackFragment top = newTop;
      getOrCreateTransaction().show(belowTop).runOnCommit(new Runnable() {
        @Override
        public void run() {
          top.getScreen().bringToFront();
        }
      });
    }
    getOrCreateTransaction().show(newTop);

    if (!mStack.contains(newTop)) {
      // if new top screen wasn't on stack we do "open animation" so long it is not the very first screen on stack
      if (mTopScreen != null) {
        // there was some other screen attached before
        int transition = FragmentTransaction.TRANSIT_FRAGMENT_OPEN;
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

    setupBackHandlerIfNeeded(mTopScreen);

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
    getFragmentManager().removeOnBackStackChangedListener(mBackStackListener);
    getFragmentManager().popBackStack(BACK_STACK_TAG, FragmentManager.POP_BACK_STACK_INCLUSIVE);
    ScreenStackFragment firstScreen = null;
    for (int i = 0, size = mStack.size(); i < size; i++) {
      ScreenStackFragment screen = mStack.get(i);
      if (!mDismissed.contains(screen)) {
        firstScreen = screen;
        break;
      }
    }
    if (topScreen != firstScreen && topScreen.isDismissable()) {
      getFragmentManager()
              .beginTransaction()
              .hide(topScreen)
              .show(topScreen)
              .addToBackStack(BACK_STACK_TAG)
              .commitAllowingStateLoss();
      getFragmentManager().addOnBackStackChangedListener(mBackStackListener);
    }
  }
}
