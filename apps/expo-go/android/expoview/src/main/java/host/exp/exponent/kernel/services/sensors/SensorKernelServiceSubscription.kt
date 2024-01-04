// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel.services.sensors

import host.exp.exponent.kernel.ExperienceKey

class SensorKernelServiceSubscription internal constructor(
  val experienceKey: ExperienceKey,
  private val subscribableSensorKernelService: SubscribableSensorKernelService,
  val sensorEventListener: SensorEventListener
) {
  var updateInterval: Long? = null
    private set
  private var hasBeenReleased = false

  fun start() {
    assertSubscriptionIsAlive()
    if (!_isEnabled) {
      _isEnabled = true
      subscribableSensorKernelService.onSubscriptionEnabledChanged(this)
    }
  }

  private var _isEnabled = false
  val isEnabled: Boolean
    get() = !hasBeenReleased && _isEnabled

  fun setUpdateInterval(updateInterval: Long) {
    assertSubscriptionIsAlive()
    this.updateInterval = updateInterval
  }

  fun stop() {
    assertSubscriptionIsAlive()
    if (_isEnabled) {
      _isEnabled = false
      subscribableSensorKernelService.onSubscriptionEnabledChanged(this)
    }
  }

  fun release() {
    assertSubscriptionIsAlive()
    subscribableSensorKernelService.removeSubscription(this)
    hasBeenReleased = true
  }

  private fun assertSubscriptionIsAlive() {
    check(!hasBeenReleased) { "Subscription has been released, cannot call methods on a released subscription." }
  }
}
