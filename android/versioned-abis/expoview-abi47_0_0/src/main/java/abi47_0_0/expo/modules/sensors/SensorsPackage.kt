package abi47_0_0.expo.modules.sensors

import android.content.Context
import abi47_0_0.expo.modules.sensors.modules.AccelerometerModule
import abi47_0_0.expo.modules.sensors.modules.BarometerModule
import abi47_0_0.expo.modules.sensors.modules.DeviceMotionModule
import abi47_0_0.expo.modules.sensors.modules.GyroscopeModule
import abi47_0_0.expo.modules.sensors.modules.LightSensorModule
import abi47_0_0.expo.modules.sensors.modules.MagnetometerModule
import abi47_0_0.expo.modules.sensors.modules.MagnetometerUncalibratedModule
import abi47_0_0.expo.modules.sensors.modules.PedometerModule
import abi47_0_0.expo.modules.sensors.services.AccelerometerService
import abi47_0_0.expo.modules.sensors.services.BarometerService
import abi47_0_0.expo.modules.sensors.services.GravitySensorService
import abi47_0_0.expo.modules.sensors.services.GyroscopeService
import abi47_0_0.expo.modules.sensors.services.LightSensorService
import abi47_0_0.expo.modules.sensors.services.LinearAccelerationSensorService
import abi47_0_0.expo.modules.sensors.services.MagnetometerService
import abi47_0_0.expo.modules.sensors.services.MagnetometerUncalibratedService
import abi47_0_0.expo.modules.sensors.services.PedometerService
import abi47_0_0.expo.modules.sensors.services.RotationVectorSensorService
import abi47_0_0.expo.modules.core.BasePackage
import abi47_0_0.expo.modules.core.ExportedModule
import abi47_0_0.expo.modules.core.interfaces.InternalModule

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

  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf<ExportedModule>(
      AccelerometerModule(context),
      BarometerModule(context),
      GyroscopeModule(context),
      LightSensorModule(context),
      DeviceMotionModule(context),
      MagnetometerModule(context),
      MagnetometerUncalibratedModule(context),
      PedometerModule(context)
    )
  }
}
