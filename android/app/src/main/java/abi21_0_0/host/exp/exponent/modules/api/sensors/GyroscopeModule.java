// Copyright 2015-present 650 Industries. All rights reserved.

package abi21_0_0.host.exp.exponent.modules.api.sensors;

import android.hardware.Sensor;
import android.hardware.SensorEvent;

import abi21_0_0.com.facebook.react.bridge.Arguments;
import abi21_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi21_0_0.com.facebook.react.bridge.ReactMethod;
import abi21_0_0.com.facebook.react.bridge.WritableMap;
import abi21_0_0.com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;


public class GyroscopeModule extends SensorModuleBase {

  @Override
  public String getName() {
    return "ExponentGyroscope";
  }

  public GyroscopeModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  private static WritableMap eventToMap(SensorEvent sensorEvent) {
    WritableMap map = Arguments.createMap();
    map.putDouble("x", sensorEvent.values[0]);
    map.putDouble("y", sensorEvent.values[1]);
    map.putDouble("z", sensorEvent.values[2]);
    return map;
  }

  @Override
  public int getSensorType() {
    return Sensor.TYPE_GYROSCOPE;
  }

  @Override
  public void onSensorDataChanged(SensorEvent sensorEvent) {
    getReactApplicationContext().getJSModule(RCTDeviceEventEmitter.class).
        emit("gyroscopeDidUpdate", eventToMap(sensorEvent));
  }

  @ReactMethod
  public void setUpdateInterval(int updateInterval) {
    super.setUpdateInterval(updateInterval);
  }

  @ReactMethod
  public void startObserving() {
    super.startObserving();
  }

  @ReactMethod
  public void stopObserving() {
    super.stopObserving();
  }
}
