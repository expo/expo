// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.services

import android.hardware.SensorEventListener2
import expo.modules.interfaces.sensors.SensorServiceSubscriptionInterface

class SensorServiceSubscription internal constructor(private val mSubscribableSensorService: SubscribableSensorService, val sensorEventListener: SensorEventListener2) : SensorServiceSubscriptionInterface {
  private var mIsEnabled = false
  private var mUpdateInterval: Long = 100L
  private var mHasBeenReleased = false
  override fun start() {
    if (mHasBeenReleased) {
      return
    }
    if (!mIsEnabled) {
      mIsEnabled = true
      mSubscribableSensorService.onSubscriptionEnabledChanged(this)
    }
  }

  override fun isEnabled(): Boolean {
    return mIsEnabled
  }

  override fun getUpdateInterval(): Long {
    return mUpdateInterval
  }

  override fun setUpdateInterval(updateInterval: Long) {
    if (mHasBeenReleased) {
      return
    }
    mUpdateInterval = updateInterval
  }

  override fun stop() {
    if (mIsEnabled) {
      mIsEnabled = false
      mSubscribableSensorService.onSubscriptionEnabledChanged(this)
    }
  }

  override fun release() {
    if (!mHasBeenReleased) {
      mSubscribableSensorService.removeSubscription(this)
      mHasBeenReleased = true
    }
  }
}
