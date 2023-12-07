package expo.modules.sensors

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.interfaces.InternalModule
import expo.modules.sensors.services.AccelerometerService
import expo.modules.sensors.services.BarometerService
import expo.modules.sensors.services.GravitySensorService
import expo.modules.sensors.services.GyroscopeService
import expo.modules.sensors.services.LightSensorService
import expo.modules.sensors.services.LinearAccelerationSensorService
import expo.modules.sensors.services.MagnetometerService
import expo.modules.sensors.services.MagnetometerUncalibratedService
import expo.modules.sensors.services.PedometerService
import expo.modules.sensors.services.RotationVectorSensorService

class SensorsPackage : BasePackage() {
  override fun createInternalModules(context: Context): List<InternalModule> {
    return listOf<InternalModule>(
      AccelerometerService(context),
      BarometerService(context),
      GravitySensorService(context),
      GyroscopeService(context),
      LightSensorService(context),
      LinearAccelerationSensorService(context),
      MagnetometerService(context),
      MagnetometerUncalibratedService(context),
      RotationVectorSensorService(context),
      PedometerService(context)
    )
  }
}
