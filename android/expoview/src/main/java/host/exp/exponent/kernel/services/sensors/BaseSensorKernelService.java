// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel.services.sensors;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

import host.exp.exponent.kernel.services.BaseKernelService;

public abstract class BaseSensorKernelService extends BaseKernelService implements SensorEventListener {
  private Sensor mSensor;
  private SensorManager mSensorManager;

  BaseSensorKernelService(Context reactContext) {
    super(reactContext);
    mSensorManager = (android.hardware.SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
  }

  // Abstract methods that subclasses should implement
  abstract int getSensorType();
  abstract void onSensorDataChanged(SensorEvent sensorEvent);

  // Public API

  protected void startObserving() {
    if ((mSensor = mSensorManager.getDefaultSensor(getSensorType())) != null) {
      mSensorManager.registerListener(this, mSensor, SensorManager.SENSOR_DELAY_FASTEST);
    }
  }

  protected void stopObserving() {
    mSensorManager.unregisterListener(this);
  }

  // android.hardware.SensorEventListener

  @Override
  public void onAccuracyChanged(Sensor sensor, int accuracy) {
  }
}
