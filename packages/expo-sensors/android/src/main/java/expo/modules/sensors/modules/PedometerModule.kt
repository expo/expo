// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.modules

import android.hardware.Sensor
import android.os.Bundle
import expo.modules.interfaces.sensors.services.PedometerServiceInterface
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.sensors.UseSensorProxy
import expo.modules.sensors.createSensorProxy

private const val EventName = "Exponent.pedometerUpdate"

class NotSupportedException(message: String) : CodedException(message)

class PedometerModule : Module() {
  private var stepsAtTheBeginning: Int? = null

  private val sensorProxy by lazy {
    createSensorProxy<PedometerServiceInterface>(EventName) { sensorEvent ->
      if (stepsAtTheBeginning == null) {
        stepsAtTheBeginning = sensorEvent.values[0].toInt() - 1
      }
      Bundle().apply {
        putDouble("steps", (sensorEvent.values[0] - (stepsAtTheBeginning ?: (sensorEvent.values[0].toInt() - 1))).toDouble())
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ExponentPedometer")

    UseSensorProxy(
      this@PedometerModule,
      Sensor.TYPE_STEP_COUNTER,
      EventName,
      listenerDecorator = { stepsAtTheBeginning = null }
    ) { sensorProxy }

    AsyncFunction("getStepCountAsync") { _: Int, _: Int ->
      throw NotSupportedException("Getting step count for date range is not supported on Android yet")
      Unit
    }
  }
}
