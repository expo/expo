// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel.services.sensors;

import host.exp.exponent.kernel.ExperienceKey;

public class SensorKernelServiceSubscription {
  private boolean mIsEnabled = false;
  private Long mUpdateInterval = null;
  private final ExperienceKey mExperienceKey;
  private boolean mHasBeenReleased = false;
  private final SubscribableSensorKernelService mSubscribableSensorKernelService;
  private final SensorEventListener mSensorEventListener;

  SensorKernelServiceSubscription(ExperienceKey experienceKey, SubscribableSensorKernelService kernelService, SensorEventListener listener) {
    mExperienceKey = experienceKey;
    mSensorEventListener = listener;
    mSubscribableSensorKernelService = kernelService;
  }

  public void start() {
    assertSubscriptionIsAlive();
    if (!mIsEnabled) {
      mIsEnabled = true;
      mSubscribableSensorKernelService.onSubscriptionEnabledChanged(this);
    }
  }

  public boolean isEnabled() {
    return !mHasBeenReleased && mIsEnabled;
  }

  public ExperienceKey getExperienceKey() {
    return mExperienceKey;
  }

  public Long getUpdateInterval() {
    return mUpdateInterval;
  }

  SensorEventListener getSensorEventListener() {
    return mSensorEventListener;
  }

  public void setUpdateInterval(long updateInterval) {
    assertSubscriptionIsAlive();
    mUpdateInterval = updateInterval;
  }

  public void stop() {
    assertSubscriptionIsAlive();
    if (mIsEnabled) {
      mIsEnabled = false;
      mSubscribableSensorKernelService.onSubscriptionEnabledChanged(this);
    }
  }

  public void release() {
    assertSubscriptionIsAlive();
    mSubscribableSensorKernelService.removeSubscription(this);
    mHasBeenReleased = true;
  }

  private void assertSubscriptionIsAlive() {
    if (mHasBeenReleased) {
      throw new IllegalStateException("Subscription has been released, cannot call methods on a released subscription.");
    }
  }
}
