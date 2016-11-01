// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.experience;

import android.app.Activity;
import android.content.Intent;
import android.view.KeyEvent;

import java.util.HashMap;
import java.util.Map;

import host.exp.exponent.RNObject;
import host.exp.exponent.analytics.EXL;

// Implement for each version.
public abstract class ReactNativeActivity extends Activity implements com.facebook.react.modules.core.DefaultHardwareBackBtnHandler, abi11_0_0.com.facebook.react.modules.core.DefaultHardwareBackBtnHandler, abi10_0_0.com.facebook.react.modules.core.DefaultHardwareBackBtnHandler, abi9_0_0.com.facebook.react.modules.core.DefaultHardwareBackBtnHandler, abi8_0_0.com.facebook.react.modules.core.DefaultHardwareBackBtnHandler, abi7_0_0.com.facebook.react.modules.core.DefaultHardwareBackBtnHandler, abi6_0_0.com.facebook.react.modules.core.DefaultHardwareBackBtnHandler {

  private static final String TAG = ReactNativeActivity.class.getSimpleName();

  protected RNObject mReactInstanceManager = new RNObject("com.facebook.react.ReactInstanceManager");
  protected boolean mIsCrashed = false;
  protected boolean mShouldDestroyRNInstanceOnExit = true;

  private static Map<Integer, ReactNativeActivity> sTaskIdToTopActivity = new HashMap<>();
  public static ReactNativeActivity getTopActivityClass(final int taskId) {
    return sTaskIdToTopActivity.get(taskId);
  }

  @Override
  public boolean onKeyUp(int keyCode, KeyEvent event) {
    if (keyCode == KeyEvent.KEYCODE_MENU && mReactInstanceManager.isNotNull() && !mIsCrashed) {
      mReactInstanceManager.call("showDevOptionsDialog");
      return true;
    }
    return super.onKeyUp(keyCode, event);
  }

  @Override
  public void onBackPressed() {
    if (mReactInstanceManager.isNotNull() && !mIsCrashed) {
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

    if (mReactInstanceManager.isNotNull() && !mIsCrashed) {
      mReactInstanceManager.onHostPause();
    }

    synchronized (sTaskIdToTopActivity) {
      if (this.equals(sTaskIdToTopActivity.get(getTaskId()))) {
        sTaskIdToTopActivity.remove(getTaskId());
      }
    }
  }

  @Override
  protected void onResume() {
    super.onResume();

    if (mReactInstanceManager.isNotNull() && !mIsCrashed) {
      mReactInstanceManager.onHostResume(this, this);
    }

    synchronized (sTaskIdToTopActivity) {
      sTaskIdToTopActivity.put(getTaskId(), this);
    }
  }


  @Override
  protected void onDestroy() {
    super.onDestroy();

    if (mReactInstanceManager.isNotNull() && !mIsCrashed && mShouldDestroyRNInstanceOnExit) {
      mReactInstanceManager.call("destroy");
    }
  }

  @Override
  public void onNewIntent(Intent intent) {
    if (mReactInstanceManager.isNotNull() && !mIsCrashed) {
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
}
