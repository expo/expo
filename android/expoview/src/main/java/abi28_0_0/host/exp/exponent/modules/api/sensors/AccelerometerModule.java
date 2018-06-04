// Copyright 2015-present 650 Industries. All rights reserved.

package abi28_0_0.host.exp.exponent.modules.api.sensors;

import android.hardware.SensorEvent;
import android.hardware.SensorManager;

import abi28_0_0.com.facebook.react.bridge.Arguments;
import abi28_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi28_0_0.com.facebook.react.bridge.ReactMethod;
import abi28_0_0.com.facebook.react.bridge.WritableMap;

import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService;

public class AccelerometerModule extends BaseSensorModule {
  public AccelerometerModule(ReactApplicationContext reactContext, ExperienceId experienceId) {
    super(reactContext, experienceId);
  }

  @Override
  public String getName() {
    return "ExponentAccelerometer";
  }

  @Override
  public String getEventName() {
    return "accelerometerDidUpdate";
  }

  @Override
  protected SubscribableSensorKernelService getKernelService() {
    return mKernelServiceRegistry.getAccelerometerKernelService();
  }

  protected WritableMap eventToMap(SensorEvent sensorEvent) {
    WritableMap map = Arguments.createMap();
    map.putDouble("x", sensorEvent.values[0] / SensorManager.GRAVITY_EARTH);
    map.putDouble("y", sensorEvent.values[1] / SensorManager.GRAVITY_EARTH);
    map.putDouble("z", sensorEvent.values[2]/  SensorManager.GRAVITY_EARTH);
    return map;
  }

  @ReactMethod
  public void startObserving() {
    super.startObserving();
  }

  @ReactMethod
  public void stopObserving() {
    super.stopObserving();
  }

  @ReactMethod
  public void setUpdateInterval(int updateInterval) {
    super.setUpdateInterval(updateInterval);
  }
}
