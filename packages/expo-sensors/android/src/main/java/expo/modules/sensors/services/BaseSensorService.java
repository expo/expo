// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sensors.services;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEventListener2;
import android.hardware.SensorManager;

public abstract class BaseSensorService extends BaseService implements SensorEventListener2 {
  private Sensor mSensor;
  private SensorManager mSensorManager;

  BaseSensorService(Context reactContext) {
    super(reactContext);
    mSensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
  }

  // Abstract methods that subclasses should implement
  abstract int getSensorType();

  // Public API

  protected void startObserving() {
    if ((mSensor = mSensorManager.getDefaultSensor(getSensorType())) != null) {
      mSensorManager.registerListener(this, mSensor, SensorManager.SENSOR_DELAY_FASTEST);
    }
  }

  protected void stopObserving() {
    mSensorManager.unregisterListener(this);
  }
}
