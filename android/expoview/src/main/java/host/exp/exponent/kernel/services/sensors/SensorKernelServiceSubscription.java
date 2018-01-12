// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel.services.sensors;

import host.exp.exponent.kernel.ExperienceId;

public class SensorKernelServiceSubscription {
  private boolean mIsEnabled = false;
  private Long mUpdateInterval = null;
  private final ExperienceId mExperienceId;
  private final SubscribableSensorKernelService mSubscribableSensorKernelService;
  private final SensorEventListener mSensorEventListener;

  SensorKernelServiceSubscription(ExperienceId experienceId, SubscribableSensorKernelService kernelService, SensorEventListener listener) {
    mExperienceId = experienceId;
    mSensorEventListener = listener;
    mSubscribableSensorKernelService = kernelService;
  }

  public void start() {
    if (!mIsEnabled) {
      mIsEnabled = true;
      mSubscribableSensorKernelService.onSubscriptionEnabledChanged(this);
    }
  }

  public boolean isEnabled() {
    return mIsEnabled;
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
    mUpdateInterval = updateInterval;
  }

  public void stop() {
    if (mIsEnabled) {
      mIsEnabled = false;
      mSubscribableSensorKernelService.onSubscriptionEnabledChanged(this);
    }
  }
}
