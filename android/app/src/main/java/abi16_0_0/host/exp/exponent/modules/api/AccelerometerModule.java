// Copyright 2015-present 650 Industries. All rights reserved.

package abi16_0_0.host.exp.exponent.modules.api;

import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

import abi16_0_0.com.facebook.react.bridge.LifecycleEventListener;
import abi16_0_0.com.facebook.react.bridge.Arguments;
import abi16_0_0.com.facebook.react.bridge.ReactMethod;
import abi16_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi16_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi16_0_0.com.facebook.react.bridge.WritableMap;
import abi16_0_0.com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;


public class AccelerometerModule extends ReactContextBaseJavaModule
  implements SensorEventListener, LifecycleEventListener {

  private SensorManager mSensorManager;
  private Sensor mAccelerometer;
  private boolean mPaused = false;
  private boolean mEnabled = false;
  private long mLastUpdate = 0;
  private int mUpdateInterval = 100;

  @Override
  public String getName() {
    return "ExponentAccelerometer";
  }

  public AccelerometerModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public void initialize() {
    ReactApplicationContext reactContext = getReactApplicationContext();
    mSensorManager = (SensorManager)reactContext.getSystemService(reactContext.SENSOR_SERVICE);
    reactContext.addLifecycleEventListener(this);
  }

  private static WritableMap eventToMap(SensorEvent sensorEvent) {
    WritableMap map = Arguments.createMap();
    map.putDouble("x", sensorEvent.values[0] / SensorManager.GRAVITY_EARTH);
    map.putDouble("y", sensorEvent.values[1] / SensorManager.GRAVITY_EARTH);
    map.putDouble("z", sensorEvent.values[2]/  SensorManager.GRAVITY_EARTH);
    return map;
  }

  @ReactMethod
  public void setUpdateInterval(int updateInterval) {
    mUpdateInterval = updateInterval;
  }

  @ReactMethod
  public void startObserving() {
    if ((mAccelerometer = mSensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)) != null) {
      mEnabled = true;
      mSensorManager.registerListener(this, mAccelerometer, SensorManager.SENSOR_DELAY_FASTEST);
    }
  }

  @ReactMethod
  public void stopObserving() {
    mPaused = false;
    mEnabled = false;
    mSensorManager.unregisterListener(this);
  }


  public void maybeResumeObserving() {
    if (mEnabled && mPaused) {
      mPaused = false;
      mSensorManager.registerListener(this, mAccelerometer, SensorManager.SENSOR_DELAY_FASTEST);
    }
  }

  public void maybePauseObserving() {
    if (mEnabled && !mPaused) {
      mPaused = true;
      mSensorManager.unregisterListener(this);
    }
  }

  @Override
  public void onSensorChanged(SensorEvent sensorEvent) {
    Sensor sensor = sensorEvent.sensor;

    if (sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
      long curTime = System.currentTimeMillis();
      if ((curTime - mLastUpdate) > mUpdateInterval) {
        getReactApplicationContext().getJSModule(RCTDeviceEventEmitter.class).
            emit("accelerometerDidUpdate", eventToMap(sensorEvent));
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
