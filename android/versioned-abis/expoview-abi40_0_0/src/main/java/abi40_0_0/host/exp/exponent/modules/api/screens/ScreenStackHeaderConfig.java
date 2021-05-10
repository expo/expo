package abi40_0_0.host.exp.exponent.modules.api.screens;

import android.content.Context;
import android.graphics.PorterDuff;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.fragment.app.Fragment;
import host.exp.expoview.ExpoViewBuildConfig;

import abi40_0_0.com.facebook.react.ReactApplication;
import abi40_0_0.com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import abi40_0_0.com.facebook.react.views.text.ReactFontManager;

import java.util.ArrayList;

public class ScreenStackHeaderConfig extends ViewGroup {

  private final ArrayList<ScreenStackHeaderSubview> mConfigSubviews = new ArrayList<>(3);
  private String mTitle;
  private int mTitleColor;
  private String mTitleFontFamily;
  private String mDirection;
  private float mTitleFontSize;
  private Integer mBackgroundColor;
  private boolean mIsHidden;
  private boolean mIsBackButtonHidden;
  private boolean mIsShadowHidden;
  private boolean mDestroyed;
  private boolean mBackButtonInCustomView;
  private boolean mIsTopInsetEnabled = true;
  private boolean mIsTranslucent;
  private int mTintColor;
  private final Toolbar mToolbar;

  private boolean mIsAttachedToWindow = false;

  private int mDefaultStartInset;
  private int mDefaultStartInsetWithNavigation;

  private static class DebugMenuToolbar extends Toolbar {

    public DebugMenuToolbar(Context context) {
      super(context);
    }

    @Override
    public boolean showOverflowMenu() {
      ((ReactApplication) getContext().getApplicationContext()).getReactNativeHost().getReactInstanceManager().showDevOptionsDialog();
      return true;
    }
  }

  private OnClickListener mBackClickListener = new OnClickListener() {
    @Override
    public void onClick(View view) {
      ScreenStackFragment fragment = getScreenFragment();
      if (fragment != null) {
        ScreenStack stack = getScreenStack();
        if (stack != null && stack.getRootScreen() == fragment.getScreen()) {
          Fragment parentFragment = fragment.getParentFragment();
          if (parentFragment instanceof ScreenStackFragment) {
            ((ScreenStackFragment) parentFragment).dismiss();
          }
        } else {
          fragment.dismiss();
        }
      }
    }
  };

  public ScreenStackHeaderConfig(Context context) {
    super(context);
    setVisibility(View.GONE);

    mToolbar = ExpoViewBuildConfig.DEBUG ? new DebugMenuToolbar(context) : new Toolbar(context);
    mDefaultStartInset = mToolbar.getContentInsetStart();
    mDefaultStartInsetWithNavigation = mToolbar.getContentInsetStartWithNavigation();

    // set primary color as background by default
    TypedValue tv = new TypedValue();
    if (context.getTheme().resolveAttribute(android.R.attr.colorPrimary, tv, true)) {
      mToolbar.setBackgroundColor(tv.data);
    }
    mToolbar.setClipChildren(false);
  }

  @Override
  protected void onLayout(boolean changed, int l, int t, int r, int b) {
    // no-op
  }

  public void destroy() {
    mDestroyed = true;
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    mIsAttachedToWindow = true;
    onUpdate();
  }

  @Override
  protected void onDetachedFromWindow() {
    super.onDetachedFromWindow();
    mIsAttachedToWindow = false;
  }

  private Screen getScreen() {
    ViewParent screen = getParent();
    if (screen instanceof Screen) {
      return (Screen) screen;
    }
    return null;
  }

  private ScreenStack getScreenStack() {
    Screen screen = getScreen();
    if (screen  != null) {
      ScreenContainer container = screen.getContainer();
      if (container instanceof ScreenStack) {
        return (ScreenStack) container;
      }
    }
    return null;
  }

  private ScreenStackFragment getScreenFragment() {
    ViewParent screen = getParent();
    if (screen instanceof Screen) {
      Fragment fragment = ((Screen) screen).getFragment();
      if (fragment instanceof ScreenStackFragment) {
        return (ScreenStackFragment) fragment;
      }
    }
    return null;
  }

  public void onUpdate() {
    Screen parent = (Screen) getParent();
    final ScreenStack stack = getScreenStack();
    boolean isTop = stack == null ? true : stack.getTopScreen() == parent;

    if (!mIsAttachedToWindow || !isTop || mDestroyed) {
      return;
    }

    AppCompatActivity activity = (AppCompatActivity) getScreenFragment().getActivity();
    if (activity == null) {
      return;
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1 && mDirection != null) {
      if (mDirection.equals("rtl")) {
        mToolbar.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
      } else if (mDirection.equals("ltr")) {
        mToolbar.setLayoutDirection(View.LAYOUT_DIRECTION_LTR);
      }
    }

    if (mIsHidden) {
      if (mToolbar.getParent() != null) {
        getScreenFragment().removeToolbar();
      }
      return;
    }

    if (mToolbar.getParent() == null) {
      getScreenFragment().setToolbar(mToolbar);
    }

    if (mIsTopInsetEnabled) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        mToolbar.setPadding(0, getRootWindowInsets().getSystemWindowInsetTop(), 0, 0);
      } else {
        // Hacky fallback for old android. Before Marshmallow, the status bar height was always 25
        mToolbar.setPadding(0, (int) (25 * getResources().getDisplayMetrics().density), 0, 0);
      }
    } else {
      if (mToolbar.getPaddingTop() > 0) {
        mToolbar.setPadding(0, 0, 0, 0);
      }
    }

    activity.setSupportActionBar(mToolbar);
    ActionBar actionBar = activity.getSupportActionBar();

    // Reset toolbar insets. By default we set symmetric inset for start and end to match iOS
    // implementation where both right and left icons are offset from the edge by default. We also
    // reset startWithNavigation inset which corresponds to the distance between navigation icon and
    // title. If title isn't set we clear that value few lines below to give more space to custom
    // center-mounted views.
    mToolbar.setContentInsetStartWithNavigation(mDefaultStartInsetWithNavigation);
    mToolbar.setContentInsetsRelative(mDefaultStartInset, mDefaultStartInset);

    // hide back button
    actionBar.setDisplayHomeAsUpEnabled(getScreenFragment().canNavigateBack() ? !mIsBackButtonHidden : false);

    // when setSupportActionBar is called a toolbar wrapper gets initialized that overwrites
    // navigation click listener. The default behavior set in the wrapper is to call into
    // menu options handlers, but we prefer the back handling logic to stay here instead.
    mToolbar.setNavigationOnClickListener(mBackClickListener);


    // shadow
    getScreenFragment().setToolbarShadowHidden(mIsShadowHidden);

    // translucent
    getScreenFragment().setToolbarTranslucent(mIsTranslucent);

    // title
    actionBar.setTitle(mTitle);
    if (TextUtils.isEmpty(mTitle)) {
      // if title is empty we set start  navigation inset to 0 to give more space to custom rendered
      // views. When it is set to default it'd take up additional distance from the back button which
      // would impact the position of custom header views rendered at the center.
      mToolbar.setContentInsetStartWithNavigation(0);
    }
    TextView titleTextView = getTitleTextView();
    if (mTitleColor != 0) {
      mToolbar.setTitleTextColor(mTitleColor);
    }
    if (titleTextView != null) {
      if (mTitleFontFamily != null) {
        titleTextView.setTypeface(ReactFontManager.getInstance().getTypeface(
                mTitleFontFamily, 0, getContext().getAssets()));
      }
      if (mTitleFontSize > 0) {
        titleTextView.setTextSize(mTitleFontSize);
      }
    }

    // background
    if (mBackgroundColor != null) {
      mToolbar.setBackgroundColor(mBackgroundColor);
    }

    // color
    if (mTintColor != 0) {
      Drawable navigationIcon = mToolbar.getNavigationIcon();
      if (navigationIcon != null) {
        navigationIcon.setColorFilter(mTintColor, PorterDuff.Mode.SRC_ATOP);
      }
    }

    // subviews
    for (int i = mToolbar.getChildCount() - 1; i >= 0; i--) {
      if (mToolbar.getChildAt(i) instanceof ScreenStackHeaderSubview) {
        mToolbar.removeViewAt(i);
      }
    }
    for (int i = 0, size = mConfigSubviews.size(); i < size; i++) {
      ScreenStackHeaderSubview view = mConfigSubviews.get(i);
      ScreenStackHeaderSubview.Type type = view.getType();

      if (type == ScreenStackHeaderSubview.Type.BACK) {
        // we special case BACK button header config type as we don't add it as a view into toolbar
        // but instead just copy the drawable from imageview that's added as a first child to it.
        View firstChild = view.getChildAt(0);
        if (!(firstChild instanceof ImageView)) {
          throw new JSApplicationIllegalArgumentException("Back button header config view should have Image as first child");
        }
        actionBar.setHomeAsUpIndicator(((ImageView) firstChild).getDrawable());
        continue;
      }

      Toolbar.LayoutParams params =
              new Toolbar.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.MATCH_PARENT);

      switch (type) {
        case LEFT:
          // when there is a left item we need to disable navigation icon by default
          // we also hide title as there is no other way to display left side items
          if (!mBackButtonInCustomView) {
            mToolbar.setNavigationIcon(null);
          }
          mToolbar.setTitle(null);
          params.gravity = Gravity.START;
          break;
        case RIGHT:
          params.gravity = Gravity.END;
          break;
        case CENTER:
          params.width = LayoutParams.MATCH_PARENT;
          params.gravity = Gravity.CENTER_HORIZONTAL;
          mToolbar.setTitle(null);
          break;
      }

      view.setLayoutParams(params);
      mToolbar.addView(view);
    }
  }

  private void maybeUpdate() {
    if (getParent() != null && !mDestroyed) {
      onUpdate();
    }
  }

  public ScreenStackHeaderSubview getConfigSubview(int index) {
    return mConfigSubviews.get(index);
  }

  public int getConfigSubviewsCount() {
    return mConfigSubviews.size();
  }

  public void removeConfigSubview(int index) {
    mConfigSubviews.remove(index);
    maybeUpdate();
  }

  public void removeAllConfigSubviews() {
    mConfigSubviews.clear();
    maybeUpdate();
  }

  public void addConfigSubview(ScreenStackHeaderSubview child, int index) {
    mConfigSubviews.add(index, child);
    maybeUpdate();
  }

  private TextView getTitleTextView() {
    for (int i = 0, size = mToolbar.getChildCount(); i < size; i++) {
      View view = mToolbar.getChildAt(i);
      if (view instanceof TextView) {
        TextView tv = (TextView) view;
        if (tv.getText().equals(mToolbar.getTitle())) {
          return tv;
        }
      }
    }
    return null;
  }

  public void setTitle(String title) {
    mTitle = title;
  }

  public void setTitleFontFamily(String titleFontFamily) {
    mTitleFontFamily = titleFontFamily;
  }

  public void setTitleFontSize(float titleFontSize) {
    mTitleFontSize = titleFontSize;
  }

  public void setTitleColor(int color) {
    mTitleColor = color;
  }

  public void setTintColor(int color) {
    mTintColor = color;
  }

  public void setTopInsetEnabled(boolean topInsetEnabled) { mIsTopInsetEnabled = topInsetEnabled; }

  public void setBackgroundColor(Integer color) {
    mBackgroundColor = color;
  }

  public void setHideShadow(boolean hideShadow) {
    mIsShadowHidden = hideShadow;
  }

  public void setHideBackButton(boolean hideBackButton) {
    mIsBackButtonHidden = hideBackButton;
  }

  public void setHidden(boolean hidden) {
    mIsHidden = hidden;
  }

  public void setTranslucent(boolean translucent) {
    mIsTranslucent = translucent;
  }

  public void setBackButtonInCustomView(boolean backButtonInCustomView) { mBackButtonInCustomView = backButtonInCustomView; }

  public void setDirection(String direction) {
    mDirection = direction;
  }
}
