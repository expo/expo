package abi37_0_0.host.exp.exponent.modules.api.screens;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;

import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import abi37_0_0.com.facebook.react.bridge.ReactContext;
import abi37_0_0.com.facebook.react.uimanager.UIManagerModule;

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
    return recycleView(mScreenView);
  }

  public Screen getScreen() {
    return mScreenView;
  }

  private void dispatchOnAppear() {
    ((ReactContext) mScreenView.getContext())
            .getNativeModule(UIManagerModule.class)
            .getEventDispatcher()
            .dispatchEvent(new ScreenAppearEvent(mScreenView.getId()));
  }

  @Override
  public void onResume() {
    super.onResume();
  }

  public void onViewAnimationEnd() {
    // onViewAnimationEnd is triggered from View#onAnimationEnd method of the fragment's root view.
    // We override Screen#onAnimationEnd and an appropriate method of the StackFragment's root view
    // in order to achieve this.
    dispatchOnAppear();
  }

  @Override
  public void onDestroyView() {
    super.onDestroyView();
    recycleView(getView());
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
  }
}
