package abi47_0_0.host.exp.exponent.modules.universal.sensors

import android.hardware.SensorEventListener2
import android.hardware.SensorEvent
import host.exp.exponent.kernel.services.sensors.SensorEventListener

class ScopedSensorEventListener internal constructor(private val eventListener: SensorEventListener2) : SensorEventListener {
  override fun onSensorDataChanged(sensorEvent: SensorEvent) {
    eventListener.onSensorChanged(sensorEvent)
  }
}
