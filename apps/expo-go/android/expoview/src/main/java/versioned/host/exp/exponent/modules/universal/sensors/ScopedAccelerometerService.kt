package versioned.host.exp.exponent.modules.universal.sensors

import expo.modules.core.interfaces.InternalModule
import expo.modules.interfaces.sensors.services.AccelerometerServiceInterface
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService

class ScopedAccelerometerService(experienceKey: ExperienceKey) : BaseSensorService(experienceKey), InternalModule, AccelerometerServiceInterface {
  override val sensorKernelService: SubscribableSensorKernelService
    get() = kernelServiceRegistry.accelerometerKernelService

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf(AccelerometerServiceInterface::class.java)
  }
}
