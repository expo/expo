package abi48_0_0.host.exp.exponent.modules.universal.sensors

import abi48_0_0.expo.modules.interfaces.sensors.SensorServiceSubscriptionInterface
import host.exp.exponent.kernel.services.sensors.SensorKernelServiceSubscription

class SensorSubscription(private val sensorKernelServiceSubscription: SensorKernelServiceSubscription) :
  SensorServiceSubscriptionInterface {
  override fun start() {
    sensorKernelServiceSubscription.start()
  }

  override fun isEnabled(): Boolean {
    return sensorKernelServiceSubscription.isEnabled
  }

  override fun getUpdateInterval(): Long? {
    return sensorKernelServiceSubscription.updateInterval
  }

  override fun setUpdateInterval(updateInterval: Long) {
    sensorKernelServiceSubscription.setUpdateInterval(updateInterval)
  }

  override fun stop() {
    sensorKernelServiceSubscription.stop()
  }

  override fun release() {
    sensorKernelServiceSubscription.release()
  }
}
