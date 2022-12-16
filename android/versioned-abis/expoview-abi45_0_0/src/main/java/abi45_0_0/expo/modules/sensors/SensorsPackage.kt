package abi45_0_0.expo.modules.sensors

import android.content.Context
import abi45_0_0.expo.modules.sensors.modules.AccelerometerModule
import abi45_0_0.expo.modules.sensors.modules.BarometerModule
import abi45_0_0.expo.modules.sensors.modules.DeviceMotionModule
import abi45_0_0.expo.modules.sensors.modules.GyroscopeModule
import abi45_0_0.expo.modules.sensors.modules.MagnetometerModule
import abi45_0_0.expo.modules.sensors.modules.MagnetometerUncalibratedModule
import abi45_0_0.expo.modules.sensors.modules.PedometerModule
import abi45_0_0.expo.modules.sensors.services.AccelerometerService
import abi45_0_0.expo.modules.sensors.services.BarometerService
import abi45_0_0.expo.modules.sensors.services.GravitySensorService
import abi45_0_0.expo.modules.sensors.services.GyroscopeService
import abi45_0_0.expo.modules.sensors.services.LinearAccelerationSensorService
import abi45_0_0.expo.modules.sensors.services.MagnetometerService
import abi45_0_0.expo.modules.sensors.services.MagnetometerUncalibratedService
import abi45_0_0.expo.modules.sensors.services.PedometerService
import abi45_0_0.expo.modules.sensors.services.RotationVectorSensorService
import abi45_0_0.expo.modules.core.BasePackage
import abi45_0_0.expo.modules.core.ExportedModule
import abi45_0_0.expo.modules.core.interfaces.InternalModule

class SensorsPackage : BasePackage() {
  override fun createInternalModules(context: Context): List<InternalModule> {
    return listOf<InternalModule>(
      AccelerometerService(context),
      BarometerService(context),
      GravitySensorService(context),
      GyroscopeService(context),
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
      DeviceMotionModule(context),
      MagnetometerModule(context),
      MagnetometerUncalibratedModule(context),
      PedometerModule(context)
    )
  }
}
