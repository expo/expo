// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.experience;

import android.app.Activity;
import android.content.DialogInterface;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.provider.Settings;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AlertDialog;
import android.view.KeyEvent;
import android.view.View;
import android.widget.FrameLayout;

import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

import de.greenrobot.event.EventBus;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.LoadingView;
import host.exp.exponent.RNObject;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.expoview.Exponent;
import host.exp.expoview.R;

public abstract class ReactNativeActivity extends Activity implements com.facebook.react.modules.core.DefaultHardwareBackBtnHandler {

  public static class ExperienceDoneLoadingEvent {
  }

  // Override
  protected void onDoneLoading() {

  }

  // Override
  // Will be called after waitForDrawOverOtherAppPermission
  protected void startReactInstance() {

  }

  private static final String TAG = ReactNativeActivity.class.getSimpleName();

  private static final long VIEW_TEST_INTERVAL_MS = 20;

  protected RNObject mReactInstanceManager = new RNObject("com.facebook.react.ReactInstanceManager");
  protected boolean mIsCrashed = false;
  protected boolean mShouldDestroyRNInstanceOnExit = true;

  protected RNObject mReactRootView;
  private FrameLayout mLayout;
  private FrameLayout mContainer;
  private LoadingView mLoadingView;
  private Handler mHandler = new Handler();
  private Handler mLoadingHandler = new Handler();
  protected boolean mIsLoading = true;
  protected String mJSBundlePath;
  protected JSONObject mManifest;
  protected boolean mIsInForeground = false;

  public boolean isLoading() {
    return mIsLoading;
  }

  public boolean isInForeground() {
    return mIsInForeground;
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    mLayout = new FrameLayout(this);
    setContentView(mLayout);

    mContainer = new FrameLayout(this);
    mContainer.setBackgroundColor(ContextCompat.getColor(this, R.color.white));
    mLoadingView = new LoadingView(this);
    mLayout.addView(mContainer);
    mLayout.addView(mLoadingView);
  }

  protected void setView(final View view) {
    mContainer.removeAllViews();
    addView(view);
    checkForReactViews();
  }

  protected void addView(final View view) {
    removeViewFromParent(view);
    mContainer.addView(view);
  }

  protected void removeViewFromParent(final View view) {
    if (view.getParent() != null) {
      ((FrameLayout) view.getParent()).removeView(view);
    }
  }

  protected void stopLoading() {
    mHandler.removeCallbacksAndMessages(null);
    mLoadingView.setAlpha(0.0f);
    mLoadingView.setShowIcon(false);
    mLoadingView.setDoneLoading();
    mIsLoading = false;
    mLoadingHandler.removeCallbacksAndMessages(null);
  }

  protected void removeViews() {
    mContainer.removeAllViews();
  }

  // Loop until a view is added to the React root view.
  private void checkForReactViews() {
    if (mReactRootView.isNull()) {
      return;
    }

    if ((int) mReactRootView.call("getChildCount") > 0) {
      fadeLoadingScreen();
      onDoneLoading();
    } else {
      mHandler.postDelayed(new Runnable() {
        @Override
        public void run() {
          checkForReactViews();
        }
      }, VIEW_TEST_INTERVAL_MS);
    }
  }

  public void showLoadingScreen(JSONObject manifest) {
    // Start of by not showing the icon since it hopefully won't take long.
    // If it takes more than 3 seconds start flashing the icon so it doesn't look like it's frozen.
    mLoadingView.setManifest(manifest);
    mLoadingView.setShowIcon(false);
    mLoadingHandler.postDelayed(new Runnable() {
      @Override
      public void run() {
        mLoadingView.setShowIcon(true);
      }
    }, 3000);
    mLoadingView.clearAnimation();
    mLoadingView.setAlpha(1.0f);
    mIsLoading = true;
  }

  public void showLongLoadingScreen(JSONObject manifest) {
    mLoadingView.setManifest(manifest);
    mLoadingView.setShowIcon(true);
    mLoadingView.clearAnimation();
    mLoadingView.setAlpha(1.0f);
    mIsLoading = true;
  }

  private void fadeLoadingScreen() {
    runOnUiThread(new Runnable() {
      @Override
      public void run() {
        mLoadingView.setAlpha(0.0f);
        mLoadingView.setShowIcon(false);
        mLoadingView.setDoneLoading();
        mIsLoading = false;
        mLoadingHandler.removeCallbacksAndMessages(null);

        EventBus.getDefault().post(new ExperienceDoneLoadingEvent());
      }
    });
  }

  @Override
  public boolean onKeyUp(int keyCode, KeyEvent event) {
    if (keyCode == KeyEvent.KEYCODE_MENU && mReactInstanceManager != null && mReactInstanceManager.isNotNull() && !mIsCrashed) {
      mReactInstanceManager.call("showDevOptionsDialog");
      return true;
    }
    return super.onKeyUp(keyCode, event);
  }

  @Override
  public void onBackPressed() {
    if (mReactInstanceManager != null && mReactInstanceManager.isNotNull() && !mIsCrashed) {
      mReactInstanceManager.call("onBackPressed");
    } else {
      super.onBackPressed();
    }
  }

  @Override
  public void invokeDefaultOnBackPressed() {
    super.onBackPressed();
  }

  @Override
  protected void onPause() {
    super.onPause();

    if (mReactInstanceManager != null && mReactInstanceManager.isNotNull() && !mIsCrashed) {
      mReactInstanceManager.onHostPause();
      // TODO: use onHostPause(activity)
    }
  }

  @Override
  protected void onResume() {
    super.onResume();

    if (mReactInstanceManager != null && mReactInstanceManager.isNotNull() && !mIsCrashed) {
      mReactInstanceManager.onHostResume(this, this);
    }
  }

  @Override
  protected void onDestroy() {
    super.onDestroy();

    if (mReactInstanceManager != null && mReactInstanceManager.isNotNull() && !mIsCrashed && mShouldDestroyRNInstanceOnExit) {
      mReactInstanceManager.call("destroy");
    }

    mHandler.removeCallbacksAndMessages(null);
    mLoadingHandler.removeCallbacksAndMessages(null);
  }

  @Override
  public void onNewIntent(Intent intent) {
    if (mReactInstanceManager != null && mReactInstanceManager.isNotNull() && !mIsCrashed) {
      try {
        mReactInstanceManager.call("onNewIntent", intent);
      } catch (Throwable e) {
        EXL.e(TAG, e.toString());
        super.onNewIntent(intent);
      }
    } else {
      super.onNewIntent(intent);
    }
  }

  public boolean isDebugModeEnabled() {
    return ExponentManifest.isDebugModeEnabled(mManifest);
  }

  protected void waitForDrawOverOtherAppPermission(String jsBundlePath) {
    mJSBundlePath = jsBundlePath;

    if (isDebugModeEnabled() && Exponent.getInstance().shouldRequestDrawOverOtherAppsPermission()) {
      new AlertDialog.Builder(this)
          .setTitle("Please enable \"Permit drawing over other apps\"")
          .setMessage("Click \"ok\" to open settings. Press the back button once you've enabled the setting.")
          .setPositiveButton(android.R.string.ok, new DialogInterface.OnClickListener() {
            public void onClick(DialogInterface dialog, int which) {
              Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                  Uri.parse("package:" + getPackageName()));
              startActivityForResult(intent, KernelConstants.OVERLAY_PERMISSION_REQUEST_CODE);
            }
          })
          .setCancelable(false)
          .show();

      return;
    }

    startReactInstance();
  }

  @Override
  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);

    Exponent.getInstance().onActivityResult(requestCode, resultCode, data);

    // Have permission to draw over other apps. Resume loading.
    if (requestCode == KernelConstants.OVERLAY_PERMISSION_REQUEST_CODE) {
      // startReactInstance() checks isInForeground and onActivityResult is called before onResume,
      // so manually set this here.
      mIsInForeground = true;
      startReactInstance();
    }
  }
}
