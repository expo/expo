// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sensors.modules;

import android.content.Context;
import android.hardware.SensorEvent;
import android.os.Bundle;

import expo.core.Promise;
import expo.core.interfaces.ExpoMethod;
import expo.interfaces.sensors.SensorService;
import expo.interfaces.sensors.services.GyroscopeService;

public class GyroscopeModule extends BaseSensorModule {
  public GyroscopeModule(Context reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ExponentGyroscope";
  }

  @Override
  public String getEventName() {
    return "gyroscopeDidUpdate";
  }

  @Override
  protected SensorService getSensorService() {
    return getModuleRegistry().getModule(GyroscopeService.class);
  }

  protected Bundle eventToMap(SensorEvent sensorEvent) {
    Bundle map = new Bundle();
    map.putDouble("x", sensorEvent.values[0]);
    map.putDouble("y", sensorEvent.values[1]);
    map.putDouble("z", sensorEvent.values[2]);
    return map;
  }

  @ExpoMethod
  public void startObserving(Promise promise) {
    super.startObserving();
    promise.resolve(null);
  }

  @ExpoMethod
  public void stopObserving(Promise promise) {
    super.stopObserving();
    promise.resolve(null);
  }

  @ExpoMethod
  public void setUpdateInterval(int updateInterval, Promise promise) {
    super.setUpdateInterval(updateInterval);
    promise.resolve(null);
  }
}
