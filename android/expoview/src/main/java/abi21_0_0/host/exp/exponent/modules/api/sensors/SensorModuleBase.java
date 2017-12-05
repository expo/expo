// Copyright 2015-present 650 Industries. All rights reserved.

package abi21_0_0.host.exp.exponent.modules.api.sensors;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

import abi21_0_0.com.facebook.react.bridge.LifecycleEventListener;
import abi21_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi21_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;


public abstract class SensorModuleBase extends ReactContextBaseJavaModule
  implements SensorEventListener, LifecycleEventListener {

  private SensorManager mSensorManager;
  private Sensor mSensor;
  private boolean mPaused = false;
  private boolean mEnabled = false;
  private long mLastUpdate = 0;
  private int mUpdateInterval = 100;

  public SensorModuleBase(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public void initialize() {
    ReactApplicationContext reactContext = getReactApplicationContext();
    mSensorManager = (android.hardware.SensorManager)reactContext.getSystemService(Context.SENSOR_SERVICE);
    reactContext.addLifecycleEventListener(this);
  }

  abstract int getSensorType();

  abstract void onSensorDataChanged(SensorEvent sensorEvent);

  public void setUpdateInterval(int updateInterval) {
    mUpdateInterval = updateInterval;
  }

  public void startObserving() {
    if ((mSensor = mSensorManager.getDefaultSensor(getSensorType())) != null) {
      mSensorManager.registerListener(this, mSensor, SensorManager.SENSOR_DELAY_FASTEST);
    }
  }

  public void stopObserving() {
    mSensorManager.unregisterListener(this);
  }

  private void maybeResumeObserving() {
    if (mEnabled && mPaused) {
      mPaused = false;
      mSensorManager.registerListener(this, mSensor, SensorManager.SENSOR_DELAY_FASTEST);
    }
  }

  private void maybePauseObserving() {
    if (mEnabled && !mPaused) {
      mPaused = true;
      mSensorManager.unregisterListener(this);
    }
  }

  @Override
  public void onSensorChanged(SensorEvent sensorEvent) {
    Sensor sensor = sensorEvent.sensor;

    if (sensor.getType() == getSensorType()) {
      long curTime = System.currentTimeMillis();
      if ((curTime - mLastUpdate) > mUpdateInterval) {
        onSensorDataChanged(sensorEvent);
        mLastUpdate = curTime;
      }
    }
  }

  @Override
  public void onAccuracyChanged(Sensor sensor, int accuracy) {
  }

  @Override
  public void onHostResume() {
    maybeResumeObserving();
  }

  @Override
  public void onHostPause() {
    maybePauseObserving();
  }

  @Override
  public void onHostDestroy() {
    stopObserving();
  }
}
