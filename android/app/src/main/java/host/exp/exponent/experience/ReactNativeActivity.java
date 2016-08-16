// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.experience;

import android.app.Activity;
import android.view.KeyEvent;

import java.util.HashMap;
import java.util.Map;

import host.exp.exponent.RNObject;

// Implement for each version.
public abstract class ReactNativeActivity extends Activity implements com.facebook.react.modules.core.DefaultHardwareBackBtnHandler, abi8_0_0.com.facebook.react.modules.core.DefaultHardwareBackBtnHandler, abi7_0_0.com.facebook.react.modules.core.DefaultHardwareBackBtnHandler, abi6_0_0.com.facebook.react.modules.core.DefaultHardwareBackBtnHandler, abi5_0_0.com.facebook.react.modules.core.DefaultHardwareBackBtnHandler {

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
}
