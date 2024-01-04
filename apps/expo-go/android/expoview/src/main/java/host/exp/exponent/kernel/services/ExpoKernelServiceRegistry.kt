// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel.services

import android.content.Context
import host.exp.exponent.kernel.services.linking.LinkingKernelService
import host.exp.exponent.kernel.services.sensors.*
import host.exp.exponent.storage.ExponentSharedPreferences

class ExpoKernelServiceRegistry(
  context: Context,
  exponentSharedPreferences: ExponentSharedPreferences
) {
  val linkingKernelService = LinkingKernelService()
  val gyroscopeKernelService = GyroscopeKernelService(context)
  val magnetometerKernelService = MagnetometerKernelService(context)
  val accelerometerKernelService = AccelerometerKernelService(context)
  val barometerKernelService = BarometerKernelService(context)
  val gravitySensorKernelService = GravitySensorKernelService(context)
  val rotationVectorSensorKernelService = RotationVectorSensorKernelService(context)
  val linearAccelerationSensorKernelService = LinearAccelerationSensorKernelService(context)
  val magnetometerUncalibratedKernelService = MagnetometerUncalibratedKernelService(context)
  val permissionsKernelService = PermissionsKernelService(context, exponentSharedPreferences)
}
