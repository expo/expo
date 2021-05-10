package abi39_0_0.host.exp.exponent.modules.api.screens;

import android.annotation.SuppressLint;
import android.content.Context;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.view.inputmethod.InputMethodManager;
import android.widget.FrameLayout;

import abi39_0_0.com.facebook.react.bridge.ReactContext;
import abi39_0_0.com.facebook.react.uimanager.UIManagerModule;

import java.util.ArrayList;
import java.util.List;

import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

public class ScreenFragment extends Fragment {

  protected static View recycleView(View view) {
    // screen fragments reuse view instances instead of creating new ones. In order to reuse a given
    // view it needs to be detached from the view hierarchy to allow the fragment to attach it back.
    ViewParent parent = view.getParent();
    if (parent != null) {
      ((ViewGroup) parent).endViewTransition(view);
      ((ViewGroup) parent).removeView(view);
    }

    // view detached from fragment manager get their visibility changed to GONE after their state is
    // dumped. Since we don't restore the state but want to reuse the view we need to change visibility
    // back to VISIBLE in order for the fragment manager to animate in the view.
    view.setVisibility(View.VISIBLE);
    return view;
  }

  protected Screen mScreenView;
  private List<ScreenContainer> mChildScreenContainers = new ArrayList<>();

  public ScreenFragment() {
    throw new IllegalStateException("Screen fragments should never be restored");
  }

  @SuppressLint("ValidFragment")
  public ScreenFragment(Screen screenView) {
    super();
    mScreenView = screenView;
  }

  @Override
  public View onCreateView(LayoutInflater inflater,
                           @Nullable ViewGroup container,
                           @Nullable Bundle savedInstanceState) {
    FrameLayout wrapper = new FrameLayout(getContext());
    FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
    mScreenView.setLayoutParams(params);
    wrapper.addView(recycleView(mScreenView));
    return wrapper;
  }

  @Override
  public void onDetach() {
    super.onDetach();
    // The below line is a workaround for an issue with keyboard handling within fragments. Despite
    // Android handles input focus on the fragments that leave the screen, the keyboard stays open
    // in a number of cases. The issue can be best reproduced on Android 5 devices, before some changes
    // in Android's InputMethodManager have been introduced (specifically around dismissing the
    // keyboard in onDetachedFromWindow). However, we also noticed the keyboard issue happen
    // intermittently on recent versions of Android as well. The issue hasn't been previously noticed
    // as in React Native <= 0.61 there was a logic that'd trigger keyboard dismiss upon a blur event
    // (the blur even gets dispatched properly, the keyboard just stays open despite that) – note
    // the change in RN core here: https://github.com/facebook/react-native/commit/e9b4928311513d3cbbd9d875827694eab6cfa932
    // The workaround is to force-hide keyboard passing the fragment's view token when the given fragment
    // is detached. It is safe to call this method regardless of whether the keyboard was open or not.
    ((InputMethodManager) getContext().getSystemService(Context.INPUT_METHOD_SERVICE))
            .hideSoftInputFromWindow(mScreenView.getWindowToken(), InputMethodManager.HIDE_NOT_ALWAYS);
  }

  public Screen getScreen() {
    return mScreenView;
  }

  protected void dispatchOnWillAppear() {
    ((ReactContext) mScreenView.getContext())
        .getNativeModule(UIManagerModule.class)
        .getEventDispatcher()
        .dispatchEvent(new ScreenWillAppearEvent(mScreenView.getId()));

    for (ScreenContainer sc : mChildScreenContainers) {
      if (sc.getScreenCount() > 0) {
        Screen topScreen = sc.getScreenAt(sc.getScreenCount() - 1);
        topScreen.getFragment().dispatchOnWillAppear();
      }
    }
  }

  protected void dispatchOnAppear() {
    ((ReactContext) mScreenView.getContext())
            .getNativeModule(UIManagerModule.class)
            .getEventDispatcher()
            .dispatchEvent(new ScreenAppearEvent(mScreenView.getId()));

    for (ScreenContainer sc : mChildScreenContainers) {
      if (sc.getScreenCount() > 0) {
        Screen topScreen = sc.getScreenAt(sc.getScreenCount() - 1);
        topScreen.getFragment().dispatchOnAppear();
      }
    }
  }

  protected void dispatchOnWillDisappear() {
    ((ReactContext) mScreenView.getContext())
        .getNativeModule(UIManagerModule.class)
        .getEventDispatcher()
        .dispatchEvent(new ScreenWillDisappearEvent(mScreenView.getId()));

    for (ScreenContainer sc : mChildScreenContainers) {
      if (sc.getScreenCount() > 0) {
        Screen topScreen = sc.getScreenAt(sc.getScreenCount() - 1);
        topScreen.getFragment().dispatchOnWillDisappear();
      }
    }
  }

  protected void dispatchOnDisappear() {
    ((ReactContext) mScreenView.getContext())
        .getNativeModule(UIManagerModule.class)
        .getEventDispatcher()
        .dispatchEvent(new ScreenDisappearEvent(mScreenView.getId()));

    for (ScreenContainer sc : mChildScreenContainers) {
      if (sc.getScreenCount() > 0) {
        Screen topScreen = sc.getScreenAt(sc.getScreenCount() - 1);
        topScreen.getFragment().dispatchOnDisappear();
      }
    }
  }

  public void registerChildScreenContainer(ScreenContainer screenContainer) {
    mChildScreenContainers.add(screenContainer);
  }

  public void unregisterChildScreenContainer(ScreenContainer screenContainer) {
    mChildScreenContainers.remove(screenContainer);
  }

  public void onViewAnimationStart() {
    // onViewAnimationStart is triggered from View#onAnimationStart method of the fragment's root view.
    // We override Screen#onAnimationStart and an appropriate method of the StackFragment's root view
    // in order to achieve this.
    if (isResumed()) {
      dispatchOnWillAppear();
    } else {
      dispatchOnWillDisappear();
    }
  }

  public void onViewAnimationEnd() {
    // onViewAnimationEnd is triggered from View#onAnimationEnd method of the fragment's root view.
    // We override Screen#onAnimationEnd and an appropriate method of the StackFragment's root view
    // in order to achieve this.
    if (isResumed()) {
      dispatchOnAppear();
    } else {
      dispatchOnDisappear();
    }
  }

  @Override
  public void onDestroy() {
    super.onDestroy();
    ScreenContainer container = mScreenView.getContainer();
    if (container == null || !container.hasScreen(this)) {
      // we only send dismissed even when the screen has been removed from its container
      ((ReactContext) mScreenView.getContext())
              .getNativeModule(UIManagerModule.class)
              .getEventDispatcher()
              .dispatchEvent(new ScreenDismissedEvent(mScreenView.getId()));
    }
    mChildScreenContainers.clear();
  }
}
