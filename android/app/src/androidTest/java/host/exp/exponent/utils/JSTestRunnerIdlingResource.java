// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.utils;

import android.support.test.espresso.IdlingResource;

import de.greenrobot.event.EventBus;
import host.exp.exponent.test.TestCompletedEvent;

public class JSTestRunnerIdlingResource implements IdlingResource {

  private boolean mHasCompleted = false;
  private ResourceCallback mResourceCallback;
  private String mTestResult;

  public JSTestRunnerIdlingResource() {
    EventBus.getDefault().register(this);
  }

  public String getTestResult() {
    return mTestResult;
  }

  public void onEvent(TestCompletedEvent event) {
    mHasCompleted = true;
    mTestResult = event.result;

    if (mResourceCallback != null) {
      mResourceCallback.onTransitionToIdle();
    }
  }

  @Override
  public String getName() {
    return JSTestRunnerIdlingResource.class.getName();
  }

  @Override
  public boolean isIdleNow() {
    return mHasCompleted;
  }

  @Override
  public void registerIdleTransitionCallback(ResourceCallback callback) {
    mResourceCallback = callback;
  }
}
