package abi47_0_0.host.exp.exponent.modules.universal.sensors

import abi47_0_0.expo.modules.core.interfaces.InternalModule
import abi47_0_0.expo.modules.interfaces.sensors.services.LinearAccelerationSensorServiceInterface
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService

class ScopedLinearAccelerationSensorService(experienceKey: ExperienceKey) : BaseSensorService(experienceKey), InternalModule, LinearAccelerationSensorServiceInterface {
  override val sensorKernelService: SubscribableSensorKernelService
    get() = kernelServiceRegistry.linearAccelerationSensorKernelService

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf(LinearAccelerationSensorServiceInterface::class.java)
  }
}
