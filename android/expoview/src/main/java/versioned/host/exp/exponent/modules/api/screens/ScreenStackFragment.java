package versioned.host.exp.exponent.modules.api.screens;

import android.annotation.SuppressLint;
import android.graphics.Color;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;

import androidx.annotation.Nullable;
import androidx.appcompat.widget.Toolbar;
import androidx.coordinatorlayout.widget.CoordinatorLayout;

import com.facebook.react.uimanager.PixelUtil;
import com.google.android.material.appbar.AppBarLayout;

public class ScreenStackFragment extends ScreenFragment {

  private static final float TOOLBAR_ELEVATION = PixelUtil.toPixelFromDIP(4);

  private AppBarLayout mAppBarLayout;
  private Toolbar mToolbar;
  private boolean mShadowHidden;

  @SuppressLint("ValidFragment")
  public ScreenStackFragment(Screen screenView) {
    super(screenView);
  }

  public void removeToolbar() {
    if (mAppBarLayout != null) {
      ((CoordinatorLayout) getView()).removeView(mAppBarLayout);
    }
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
  public View onCreateView(LayoutInflater inflater,
                           @Nullable ViewGroup container,
                           @Nullable Bundle savedInstanceState) {
    CoordinatorLayout view = new CoordinatorLayout(getContext());
    CoordinatorLayout.LayoutParams params = new CoordinatorLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.MATCH_PARENT);
    params.setBehavior(new AppBarLayout.ScrollingViewBehavior());
    mScreenView.setLayoutParams(params);
    view.addView(mScreenView);

    mAppBarLayout = new AppBarLayout(getContext());
    // By default AppBarLayout will have a background color set but since we cover the whole layout
    // with toolbar (that can be semi-transparent) the bar layout background color does not pay a
    // role. On top of that it breaks screens animations when alfa offscreen compositing is off
    // (which is the default)
    mAppBarLayout.setBackgroundColor(Color.TRANSPARENT);
    mAppBarLayout.setLayoutParams(new AppBarLayout.LayoutParams(
            AppBarLayout.LayoutParams.MATCH_PARENT, AppBarLayout.LayoutParams.WRAP_CONTENT));
    view.addView(mAppBarLayout);

    if (mToolbar != null) {
      mAppBarLayout.addView(mToolbar);
    }

    return view;
  }

  public boolean isDismissable() {
    View child = mScreenView.getChildAt(0);
    if (child instanceof ScreenStackHeaderConfig) {
      return ((ScreenStackHeaderConfig) child).isDismissable();
    }
    return true;
  }
}
