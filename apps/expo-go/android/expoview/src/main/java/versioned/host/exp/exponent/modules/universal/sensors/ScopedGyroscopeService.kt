package versioned.host.exp.exponent.modules.universal.sensors

import expo.modules.core.interfaces.InternalModule
import expo.modules.interfaces.sensors.services.GyroscopeServiceInterface
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService

class ScopedGyroscopeService(experienceKey: ExperienceKey) : BaseSensorService(experienceKey), InternalModule, GyroscopeServiceInterface {
  override val sensorKernelService: SubscribableSensorKernelService
    get() = kernelServiceRegistry.gyroscopeKernelService

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf(GyroscopeServiceInterface::class.java)
  }
}
