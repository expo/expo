package versioned.host.exp.exponent.modules.universal.sensors

import expo.modules.core.interfaces.InternalModule
import expo.modules.interfaces.sensors.services.MagnetometerServiceInterface
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService

class ScopedMagnetometerService(experienceKey: ExperienceKey) : BaseSensorService(experienceKey), InternalModule, MagnetometerServiceInterface {
  override val sensorKernelService: SubscribableSensorKernelService
    get() = kernelServiceRegistry.magnetometerKernelService

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf(MagnetometerServiceInterface::class.java)
  }
}
