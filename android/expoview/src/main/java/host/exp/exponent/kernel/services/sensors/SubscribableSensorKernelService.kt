// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel.services.sensors

import android.content.Context
import android.hardware.SensorEvent
import host.exp.exponent.kernel.ExperienceKey
import java.lang.ref.WeakReference
import java.util.*

private var DEFAULT_UPDATE_INTERVAL = 100

abstract class SubscribableSensorKernelService internal constructor(reactContext: Context) : BaseSensorKernelService(reactContext) {
  private val experienceScopeKeyListenersCountMap: MutableMap<String?, Int> = mutableMapOf()
  private val sensorEventListenerLastUpdateMap: MutableMap<SensorKernelServiceSubscription, Long> = WeakHashMap()
  private val experienceScopeKeySubscriptionsMap: MutableMap<String?, MutableList<WeakReference<SensorKernelServiceSubscription?>>> = mutableMapOf()

  override fun onExperienceForegrounded(experienceKey: ExperienceKey) {
    updateObserving()
  }

  override fun onExperienceBackgrounded(experienceKey: ExperienceKey) {
    updateObserving()
  }

  override fun onSensorDataChanged(sensorEvent: SensorEvent) {
    val currentTime = System.currentTimeMillis()
    val listeners = experienceScopeKeySubscriptionsMap[currentExperienceKey!!.scopeKey]
    if (listeners != null) {
      for (weakReference in listeners) {
        val sensorKernelServiceSubscription = weakReference.get()
        if (sensorKernelServiceSubscription != null && sensorKernelServiceSubscription.isEnabled) {
          var lastUpdate: Long = 0
          if (sensorEventListenerLastUpdateMap.containsKey(sensorKernelServiceSubscription)) {
            lastUpdate = sensorEventListenerLastUpdateMap[sensorKernelServiceSubscription]!!
          }
          var updateInterval = DEFAULT_UPDATE_INTERVAL.toLong()
          if (sensorKernelServiceSubscription.updateInterval != null) {
            updateInterval = sensorKernelServiceSubscription.updateInterval!!
          }
          if (currentTime - lastUpdate > updateInterval) {
            sensorKernelServiceSubscription.sensorEventListener.onSensorDataChanged(sensorEvent)
            sensorEventListenerLastUpdateMap[sensorKernelServiceSubscription] = currentTime
          }
        }
      }
    }
  }

  // Modules API
  fun createSubscriptionForListener(
    experienceKey: ExperienceKey,
    listener: SensorEventListener
  ): SensorKernelServiceSubscription {
    val sensorKernelServiceSubscription =
      SensorKernelServiceSubscription(experienceKey, this, listener)
    if (!experienceScopeKeySubscriptionsMap.containsKey(experienceKey.scopeKey)) {
      experienceScopeKeySubscriptionsMap[experienceKey.scopeKey] = ArrayList()
    }
    experienceScopeKeySubscriptionsMap[experienceKey.scopeKey]!!.add(
      WeakReference(
        sensorKernelServiceSubscription
      )
    )
    return sensorKernelServiceSubscription
  }

  fun removeSubscription(subscriptionToRemove: SensorKernelServiceSubscription) {
    sensorEventListenerLastUpdateMap.remove(subscriptionToRemove)
    val experienceKey = subscriptionToRemove.experienceKey
    if (experienceScopeKeySubscriptionsMap.containsKey(experienceKey.scopeKey)) {
      val originalSubscriptions: List<WeakReference<SensorKernelServiceSubscription?>> =
        experienceScopeKeySubscriptionsMap[experienceKey.scopeKey]!!
      val leftSubscriptions: MutableList<WeakReference<SensorKernelServiceSubscription?>> =
        ArrayList()
      for (subscriptionWeakReference in originalSubscriptions) {
        val subscription = subscriptionWeakReference.get()
        if (subscription != null && subscription != subscriptionToRemove) {
          leftSubscriptions.add(subscriptionWeakReference)
        }
      }
      if (leftSubscriptions.size > 0) {
        experienceScopeKeySubscriptionsMap[experienceKey.scopeKey] = leftSubscriptions
      } else {
        experienceScopeKeySubscriptionsMap.remove(experienceKey.scopeKey)
      }
    }
  }

  // SensorKernelServiceSubscription API
  fun onSubscriptionEnabledChanged(sensorKernelServiceSubscription: SensorKernelServiceSubscription) {
    val experienceKey = sensorKernelServiceSubscription.experienceKey
    val enabledListenersCount = getEnabledListenersForExperienceKey(experienceKey)
    if (sensorKernelServiceSubscription.isEnabled) {
      experienceScopeKeyListenersCountMap[experienceKey.scopeKey] = enabledListenersCount + 1
    } else {
      experienceScopeKeyListenersCountMap[experienceKey.scopeKey] = enabledListenersCount - 1
    }
    if (getEnabledListenersForExperienceKey(experienceKey) == 0) {
      experienceScopeKeyListenersCountMap.remove(experienceKey.scopeKey)
    }
    updateObserving()
  }

  // android.hardware.SensorEventListener
  override fun onSensorChanged(sensorEvent: SensorEvent) {
    if (sensorEvent.sensor.type == sensorType) {
      onSensorDataChanged(sensorEvent)
    }
  }

  // Private helpers
  private fun getEnabledListenersForExperienceKey(experienceKey: ExperienceKey?): Int {
    // null is an expected key, or at least that's how the code was written. may be a bug.
    val mapKey = experienceKey?.scopeKey
    return if (experienceScopeKeyListenersCountMap.containsKey(mapKey)) {
      experienceScopeKeyListenersCountMap[mapKey]!!
    } else {
      0
    }
  }

  private fun cleanWeakSubscriptionsList(experienceKey: ExperienceKey?) {
    // null is an expected key, or at least that's how the code was written. may be a bug.
    val mapKey = experienceKey?.scopeKey
    val listeners: List<WeakReference<SensorKernelServiceSubscription?>>? =
      experienceScopeKeySubscriptionsMap[mapKey]
    val realListeners: MutableList<WeakReference<SensorKernelServiceSubscription?>> = ArrayList()
    if (listeners != null) {
      for (subscriptionWeakReference in listeners) {
        if (subscriptionWeakReference.get() != null) {
          realListeners.add(subscriptionWeakReference)
        }
      }
    }
    if (realListeners.size > 0) {
      experienceScopeKeySubscriptionsMap[mapKey] = realListeners
    } else {
      experienceScopeKeySubscriptionsMap.remove(mapKey)
    }
  }

  private fun updateObserving() {
    cleanWeakSubscriptionsList(currentExperienceKey)

    // Start/stop observing according to the experience state
    if (getEnabledListenersForExperienceKey(currentExperienceKey) > 0) {
      super.startObserving()
    } else {
      super.stopObserving()
    }
  }
}
