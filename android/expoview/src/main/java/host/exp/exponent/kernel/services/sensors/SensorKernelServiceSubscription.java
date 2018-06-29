// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel.services.sensors;

import host.exp.exponent.kernel.ExperienceId;

public class SensorKernelServiceSubscription {
  private boolean mIsEnabled = false;
  private Long mUpdateInterval = null;
  private final ExperienceId mExperienceId;
  private boolean mHasBeenReleased = false;
  private final SubscribableSensorKernelService mSubscribableSensorKernelService;
  private final SensorEventListener mSensorEventListener;

  SensorKernelServiceSubscription(ExperienceId experienceId, SubscribableSensorKernelService kernelService, SensorEventListener listener) {
    mExperienceId = experienceId;
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

  public ExperienceId getExperienceId() {
    return mExperienceId;
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
