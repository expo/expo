package abi47_0_0.host.exp.exponent.modules.universal.sensors

import abi47_0_0.expo.modules.core.interfaces.InternalModule
import abi47_0_0.expo.modules.interfaces.sensors.services.RotationVectorSensorServiceInterface
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService

class ScopedRotationVectorSensorService(experienceKey: ExperienceKey) : BaseSensorService(experienceKey), InternalModule, RotationVectorSensorServiceInterface {
  override val sensorKernelService: SubscribableSensorKernelService
    get() = kernelServiceRegistry.rotationVectorSensorKernelService

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf(RotationVectorSensorServiceInterface::class.java)
  }
}
