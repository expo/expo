// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel.services.sensors;

import android.content.Context;
import android.hardware.SensorEvent;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.WeakHashMap;

import host.exp.exponent.kernel.ExperienceId;

public abstract class SubscribableSensorKernelService extends BaseSensorKernelService {
  protected static int DEFAULT_UPDATE_INTERVAL = 100;

  private Map<ExperienceId, Integer> mExperienceIdListenersCountMap = new HashMap<>();
  private Map<SensorKernelServiceSubscription, Long> mSensorEventListenerLastUpdateMap = new WeakHashMap<>();
  private Map<ExperienceId, List<WeakReference<SensorKernelServiceSubscription>>> mExperienceIdSubscriptionsMap = new HashMap<>();

  SubscribableSensorKernelService(Context reactContext) {
    super(reactContext);
  }

  // BaseKernelService

  public void onExperienceForegrounded(ExperienceId experienceId) {
    updateObserving();
  }

  public void onExperienceBackgrounded(ExperienceId experienceId) {
    updateObserving();
  }

  // BaseSensorKernelService

  @Override
  public void onSensorDataChanged(SensorEvent sensorEvent) {
    long currentTime = System.currentTimeMillis();
    ExperienceId currentExperienceId = getCurrentExperienceId();
    List<WeakReference<SensorKernelServiceSubscription>> listeners = mExperienceIdSubscriptionsMap.get(currentExperienceId);

    if (listeners != null) {
      for(WeakReference<SensorKernelServiceSubscription> weakReference : listeners) {
        final SensorKernelServiceSubscription sensorKernelServiceSubscription = weakReference.get();
        if (sensorKernelServiceSubscription != null && sensorKernelServiceSubscription.isEnabled()) {
          long lastUpdate = 0;
          if (mSensorEventListenerLastUpdateMap.containsKey(sensorKernelServiceSubscription)) {
            lastUpdate = mSensorEventListenerLastUpdateMap.get(sensorKernelServiceSubscription);
          }

          long updateInterval = DEFAULT_UPDATE_INTERVAL;
          if (sensorKernelServiceSubscription.getUpdateInterval() != null) {
            updateInterval = sensorKernelServiceSubscription.getUpdateInterval();
          }


          if ((currentTime - lastUpdate) > updateInterval) {
            sensorKernelServiceSubscription.getSensorEventListener().onSensorDataChanged(sensorEvent);
            mSensorEventListenerLastUpdateMap.put(sensorKernelServiceSubscription, currentTime);
          }
        }
      }
    }
  }

  // Modules API

  public SensorKernelServiceSubscription createSubscriptionForListener(ExperienceId experienceId, SensorEventListener listener) {
    SensorKernelServiceSubscription sensorKernelServiceSubscription = new SensorKernelServiceSubscription(experienceId, this, listener);
    if (!mExperienceIdSubscriptionsMap.containsKey(experienceId)) {
      mExperienceIdSubscriptionsMap.put(experienceId, new ArrayList<WeakReference<SensorKernelServiceSubscription>>());
    }
    mExperienceIdSubscriptionsMap.get(experienceId).add(new WeakReference<>(sensorKernelServiceSubscription));
    return sensorKernelServiceSubscription;
  }

  public void removeSubscription(SensorKernelServiceSubscription subscriptionToRemove) {
    mSensorEventListenerLastUpdateMap.remove(subscriptionToRemove);
    ExperienceId experienceId = subscriptionToRemove.getExperienceId();
    if (mExperienceIdSubscriptionsMap.containsKey(experienceId)) {
      List<WeakReference<SensorKernelServiceSubscription>> originalSubscriptions = mExperienceIdSubscriptionsMap.get(experienceId);
      List<WeakReference<SensorKernelServiceSubscription>> leftSubscriptions = new ArrayList<>();
      for (WeakReference<SensorKernelServiceSubscription> subscriptionWeakReference : originalSubscriptions) {
        SensorKernelServiceSubscription subscription = subscriptionWeakReference.get();
        if (subscription != null && subscription != subscriptionToRemove) {
          leftSubscriptions.add(subscriptionWeakReference);
        }
      }
      if (leftSubscriptions.size() > 0) {
        mExperienceIdSubscriptionsMap.put(experienceId, leftSubscriptions);
      } else {
        mExperienceIdSubscriptionsMap.remove(experienceId);
      }
    }
  }

  // SensorKernelServiceSubscription API

  void onSubscriptionEnabledChanged(SensorKernelServiceSubscription sensorKernelServiceSubscription) {
    ExperienceId experienceId = sensorKernelServiceSubscription.getExperienceId();
    int enabledListenersCount = getEnabledListenersForExperienceId(experienceId);

    if (sensorKernelServiceSubscription.isEnabled()) {
      mExperienceIdListenersCountMap.put(experienceId, enabledListenersCount + 1);
    } else {
      mExperienceIdListenersCountMap.put(experienceId, enabledListenersCount - 1);
    }

    if (getEnabledListenersForExperienceId(experienceId) == 0) {
      mExperienceIdListenersCountMap.remove(experienceId);
    }

    updateObserving();
  }

  // android.hardware.SensorEventListener

  @Override
  public void onSensorChanged(SensorEvent sensorEvent) {
    if (sensorEvent.sensor.getType() == getSensorType()) {
      onSensorDataChanged(sensorEvent);
    }
  }

  // Private helpers

  private int getEnabledListenersForExperienceId(ExperienceId experienceId) {
    if (mExperienceIdListenersCountMap.containsKey(experienceId)) {
      return mExperienceIdListenersCountMap.get(experienceId);
    }

    return 0;
  }

  private void cleanWeakSubscriptionsList(ExperienceId experienceId) {
    List<WeakReference<SensorKernelServiceSubscription>> listeners = mExperienceIdSubscriptionsMap.get(experienceId);
    List<WeakReference<SensorKernelServiceSubscription>> realListeners = new ArrayList<>();
    if (listeners != null) {
      for (WeakReference<SensorKernelServiceSubscription> subscriptionWeakReference : listeners) {
        if (subscriptionWeakReference.get() != null) {
          realListeners.add(subscriptionWeakReference);
        }
      }
    }

    if (realListeners.size() > 0) {
      mExperienceIdSubscriptionsMap.put(experienceId, realListeners);
    } else {
      mExperienceIdSubscriptionsMap.remove(experienceId);
    }
  }

  private void updateObserving() {
    ExperienceId currentExperienceId = getCurrentExperienceId();
    cleanWeakSubscriptionsList(currentExperienceId);

    // Start/stop observing according to the experience state
    if (getEnabledListenersForExperienceId(currentExperienceId) > 0) {
      super.startObserving();
    } else {
      super.stopObserving();
    }
  }
}
