package abi47_0_0.host.exp.exponent.modules.universal.sensors

import abi47_0_0.expo.modules.core.interfaces.InternalModule
import abi47_0_0.expo.modules.interfaces.sensors.services.MagnetometerUncalibratedServiceInterface
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService

class ScopedMagnetometerUncalibratedService(experienceKey: ExperienceKey) : BaseSensorService(experienceKey), InternalModule, MagnetometerUncalibratedServiceInterface {
  override val sensorKernelService: SubscribableSensorKernelService
    get() = kernelServiceRegistry.magnetometerUncalibratedKernelService

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf(MagnetometerUncalibratedServiceInterface::class.java)
  }
}
