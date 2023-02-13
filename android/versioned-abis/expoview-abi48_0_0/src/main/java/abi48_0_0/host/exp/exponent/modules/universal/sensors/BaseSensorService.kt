package abi48_0_0.host.exp.exponent.modules.universal.sensors

import host.exp.exponent.kernel.ExperienceKey
import javax.inject.Inject
import host.exp.exponent.kernel.services.ExpoKernelServiceRegistry
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService
import android.hardware.SensorEventListener2
import abi48_0_0.expo.modules.interfaces.sensors.SensorServiceSubscriptionInterface
import host.exp.exponent.di.NativeModuleDepsProvider

abstract class BaseSensorService(protected val experienceScopeKey: ExperienceKey) {
  @Inject
  protected lateinit var kernelServiceRegistry: ExpoKernelServiceRegistry

  protected abstract val sensorKernelService: SubscribableSensorKernelService

  fun createSubscriptionForListener(sensorEventListener: SensorEventListener2): SensorServiceSubscriptionInterface {
    val scopedSensorEventListener = ScopedSensorEventListener(sensorEventListener)
    val sensorKernelServiceSubscription = sensorKernelService.createSubscriptionForListener(
      experienceScopeKey,
      scopedSensorEventListener
    )
    return SensorSubscription(sensorKernelServiceSubscription)
  }

  init {
    NativeModuleDepsProvider.instance.inject(BaseSensorService::class.java, this)
  }
}
