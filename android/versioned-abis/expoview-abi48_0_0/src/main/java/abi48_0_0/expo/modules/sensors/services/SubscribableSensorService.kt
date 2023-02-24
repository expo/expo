// Copyright 2015-present 650 Industries. All rights reserved.
package abi48_0_0.expo.modules.sensors.services

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener2
import abi48_0_0.expo.modules.interfaces.sensors.SensorServiceInterface
import abi48_0_0.expo.modules.interfaces.sensors.SensorServiceSubscriptionInterface
import java.util.*

abstract class SubscribableSensorService internal constructor(reactContext: Context?) : BaseSensorService(reactContext), SensorServiceInterface {
  private var mListenersCount = 0
  private val mSensorEventListenerLastUpdateMap: MutableMap<SensorServiceSubscription, Long> = WeakHashMap()

  // BaseService
  override fun onExperienceForegrounded() {
    updateObserving()
  }

  override fun onExperienceBackgrounded() {
    updateObserving()
  }

  // Modules API
  override fun createSubscriptionForListener(listener: SensorEventListener2): SensorServiceSubscriptionInterface {
    val sensorServiceSubscription = SensorServiceSubscription(this, listener)
    mSensorEventListenerLastUpdateMap[sensorServiceSubscription] = 0L
    return sensorServiceSubscription
  }

  // SensorServiceSubscription API
  fun onSubscriptionEnabledChanged(sensorServiceSubscription: SensorServiceSubscription) {
    if (sensorServiceSubscription.isEnabled) {
      mListenersCount += 1
    } else {
      mListenersCount -= 1
    }
    updateObserving()
  }

  fun removeSubscription(sensorServiceSubscription: SensorServiceSubscription) {
    mSensorEventListenerLastUpdateMap.remove(sensorServiceSubscription)
  }

  // android.hardware.SensorEventListener2
  override fun onSensorChanged(sensorEvent: SensorEvent) {
    if (sensorEvent.sensor.type == sensorType) {
      val currentTime = System.currentTimeMillis()
      val listeners: Set<SensorServiceSubscription> = mSensorEventListenerLastUpdateMap.keys
      for (sensorServiceSubscription in listeners) {
        if (sensorServiceSubscription.isEnabled) {
          val lastUpdate = mSensorEventListenerLastUpdateMap[sensorServiceSubscription] ?: 0L
          if (currentTime - lastUpdate > sensorServiceSubscription.updateInterval) {
            sensorServiceSubscription.sensorEventListener.onSensorChanged(sensorEvent)
            mSensorEventListenerLastUpdateMap[sensorServiceSubscription] = currentTime
          }
        }
      }
    }
  }

  override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {
    if (sensor.type == sensorType) {
      for (subscription in mSensorEventListenerLastUpdateMap.keys) {
        if (subscription.isEnabled) {
          subscription.sensorEventListener.onAccuracyChanged(sensor, accuracy)
        }
      }
    }
  }

  override fun onFlushCompleted(sensor: Sensor) {
    if (sensor.type == sensorType) {
      for (subscription in mSensorEventListenerLastUpdateMap.keys) {
        if (subscription.isEnabled) {
          subscription.sensorEventListener.onFlushCompleted(sensor)
        }
      }
    }
  }

  // Private helpers
  private fun updateObserving() {
    // Start/stop observing according to the experience state
    if (mListenersCount > 0 && experienceIsForegrounded) {
      super.startObserving()
    } else {
      super.stopObserving()
    }
  }
}
