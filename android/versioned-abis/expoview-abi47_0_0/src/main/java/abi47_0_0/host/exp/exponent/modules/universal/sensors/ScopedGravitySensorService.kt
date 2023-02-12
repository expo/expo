package abi47_0_0.host.exp.exponent.modules.universal.sensors

import abi47_0_0.expo.modules.core.interfaces.InternalModule
import abi47_0_0.expo.modules.interfaces.sensors.services.GravitySensorServiceInterface
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService

class ScopedGravitySensorService(experienceKey: ExperienceKey) : BaseSensorService(experienceKey), InternalModule, GravitySensorServiceInterface {
  override val sensorKernelService: SubscribableSensorKernelService
    get() = kernelServiceRegistry.gravitySensorKernelService

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf(GravitySensorServiceInterface::class.java)
  }
}
