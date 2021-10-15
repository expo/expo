// Copyright 2015-present 650 Industries. All rights reserved.
package abi43_0_0.expo.modules.sensors.services

import android.hardware.SensorEventListener2
import abi43_0_0.expo.modules.interfaces.sensors.SensorServiceSubscriptionInterface

class SensorServiceSubscription internal constructor(private val mSubscribableSensorService: SubscribableSensorService, val sensorEventListener: SensorEventListener2) : SensorServiceSubscriptionInterface {
  private var mIsEnabled = false
  private var mUpdateInterval: Long = 100L
  private var mHasBeenReleased = false
  override fun start() {
    assertSubscriptionIsAlive()
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
    assertSubscriptionIsAlive()
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

  private fun assertSubscriptionIsAlive() {
    check(!mHasBeenReleased) { "Subscription has been released, cannot call methods on a released subscription." }
  }
}
