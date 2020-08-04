package abi38_0_0.host.exp.exponent.modules.api.screens;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Color;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.view.animation.Animation;
import android.widget.LinearLayout;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.widget.Toolbar;
import androidx.coordinatorlayout.widget.CoordinatorLayout;
import androidx.fragment.app.Fragment;

import abi38_0_0.com.facebook.react.uimanager.PixelUtil;
import com.google.android.material.appbar.AppBarLayout;

public class ScreenStackFragment extends ScreenFragment {

  private static class NotifyingCoordinatorLayout extends CoordinatorLayout {

    private final ScreenFragment mFragment;

    public NotifyingCoordinatorLayout(@NonNull Context context, ScreenFragment fragment) {
      super(context);
      mFragment = fragment;
    }

    @Override
    protected void onAnimationEnd() {
      super.onAnimationEnd();
      mFragment.onViewAnimationEnd();
    }
  }

  private static final float TOOLBAR_ELEVATION = PixelUtil.toPixelFromDIP(4);

  private AppBarLayout mAppBarLayout;
  private Toolbar mToolbar;
  private boolean mShadowHidden;

  @SuppressLint("ValidFragment")
  public ScreenStackFragment(Screen screenView) {
    super(screenView);
  }

  public void removeToolbar() {
    if (mAppBarLayout != null && mToolbar != null && mToolbar.getParent() == mAppBarLayout) {
      mAppBarLayout.removeView(mToolbar);
    }
    mToolbar = null;
  }

  public void setToolbar(Toolbar toolbar) {
    if (mAppBarLayout != null) {
      mAppBarLayout.addView(toolbar);
    }
    mToolbar = toolbar;
    AppBarLayout.LayoutParams params = new AppBarLayout.LayoutParams(
            AppBarLayout.LayoutParams.MATCH_PARENT, AppBarLayout.LayoutParams.WRAP_CONTENT);
    params.setScrollFlags(0);
    mToolbar.setLayoutParams(params);
  }

  public void setToolbarShadowHidden(boolean hidden) {
    if (mShadowHidden != hidden) {
      mAppBarLayout.setTargetElevation(hidden ? 0 : TOOLBAR_ELEVATION);
      mShadowHidden = hidden;
    }
  }

  public void onStackUpdate() {
    View child = mScreenView.getChildAt(0);
    if (child instanceof ScreenStackHeaderConfig) {
      ((ScreenStackHeaderConfig) child).onUpdate();
    }
  }

  @Override
  public void onViewAnimationEnd() {
    super.onViewAnimationEnd();
    notifyViewAppearTransitionEnd();
  }

  @Nullable
  @Override
  public Animation onCreateAnimation(int transit, boolean enter, int nextAnim) {
    if (enter && transit == 0) {
      // this means that the fragment will appear without transition, in this case onViewAnimationEnd
      // won't be called and we need to notify stack directly from here.
      notifyViewAppearTransitionEnd();
    }
    return null;
  }

  private void notifyViewAppearTransitionEnd() {
    ViewParent screenStack = getView().getParent();
    if (screenStack instanceof ScreenStack) {
      ((ScreenStack) screenStack).onViewAppearTransitionEnd();
    }
  }

  @Override
  public View onCreateView(LayoutInflater inflater,
                           @Nullable ViewGroup container,
                           @Nullable Bundle savedInstanceState) {
    CoordinatorLayout view = new NotifyingCoordinatorLayout(getContext(), this);
    CoordinatorLayout.LayoutParams params = new CoordinatorLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.MATCH_PARENT);
    params.setBehavior(new AppBarLayout.ScrollingViewBehavior());
    mScreenView.setLayoutParams(params);
    view.addView(recycleView(mScreenView));

    mAppBarLayout = new AppBarLayout(getContext());
    // By default AppBarLayout will have a background color set but since we cover the whole layout
    // with toolbar (that can be semi-transparent) the bar layout background color does not pay a
    // role. On top of that it breaks screens animations when alfa offscreen compositing is off
    // (which is the default)
    mAppBarLayout.setBackgroundColor(Color.TRANSPARENT);
    mAppBarLayout.setLayoutParams(new AppBarLayout.LayoutParams(
            AppBarLayout.LayoutParams.MATCH_PARENT, AppBarLayout.LayoutParams.WRAP_CONTENT));
    view.addView(mAppBarLayout);

    if (mShadowHidden) {
      mAppBarLayout.setTargetElevation(0);
    }

    if (mToolbar != null) {
      mAppBarLayout.addView(recycleView(mToolbar));
    }

    return view;
  }

  public boolean isDismissable() {
    return mScreenView.isGestureEnabled();
  }

  public boolean canNavigateBack() {
    ScreenContainer container = mScreenView.getContainer();
    if (container instanceof ScreenStack) {
      if (((ScreenStack) container).getRootScreen() == getScreen()) {
        // this screen is the root of the container, if it is nested we can check parent container
        // if it is also a root or not
        Fragment parentFragment = getParentFragment();
        if (parentFragment instanceof ScreenStackFragment) {
          return ((ScreenStackFragment) parentFragment).canNavigateBack();
        } else {
          return false;
        }
      } else {
        return true;
      }
    } else {
      throw new IllegalStateException("ScreenStackFragment added into a non-stack container");
    }
  }

  public void dismiss() {
    ScreenContainer container = mScreenView.getContainer();
    if (container instanceof ScreenStack) {
      ((ScreenStack) container).dismiss(this);
    } else {
      throw new IllegalStateException("ScreenStackFragment added into a non-stack container");
    }
  }
}
