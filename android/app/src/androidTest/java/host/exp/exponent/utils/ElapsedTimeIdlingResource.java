// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.utils;

import android.support.test.espresso.IdlingResource;

public class ElapsedTimeIdlingResource implements IdlingResource {
  private long mStartTime;
  private long mWaitingTime;
  private ResourceCallback mResourceCallback;
  private boolean mIsSleeping = false;

  public ElapsedTimeIdlingResource() {

  }

  public void sleep(long waitingTime) {
    mWaitingTime = waitingTime;
    mStartTime = System.currentTimeMillis();
    mIsSleeping = true;
  }

  @Override
  public String getName() {
    return ElapsedTimeIdlingResource.class.getName() + ":" + mWaitingTime;
  }

  @Override
  public boolean isIdleNow() {
    if (!mIsSleeping) {
      return true;
    }

    long elapsed = System.currentTimeMillis() - mStartTime;
    boolean idle = (elapsed >= mWaitingTime);
    if (idle) {
      mIsSleeping = false;
      mResourceCallback.onTransitionToIdle();
    }
    return idle;
  }

  @Override
  public void registerIdleTransitionCallback(ResourceCallback resourceCallback) {
    mResourceCallback = resourceCallback;
  }
}
