package abi49_0_0.host.exp.exponent.modules.universal.sensors

import abi49_0_0.expo.modules.core.interfaces.InternalModule
import abi49_0_0.expo.modules.interfaces.sensors.services.AccelerometerServiceInterface
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService

class ScopedAccelerometerService(experienceKey: ExperienceKey) : BaseSensorService(experienceKey), InternalModule, AccelerometerServiceInterface {
  override val sensorKernelService: SubscribableSensorKernelService
    get() = kernelServiceRegistry.accelerometerKernelService

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf(AccelerometerServiceInterface::class.java)
  }
}
