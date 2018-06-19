// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sensors.services;

import android.content.Context;
import android.hardware.Sensor;

import java.util.Collections;
import java.util.List;

import expo.core.interfaces.InternalModule;

public class AccelerometerService extends SubscribableSensorService implements InternalModule, expo.interfaces.sensors.services.AccelerometerService {
  public AccelerometerService(Context reactContext) {
    super(reactContext);
  }

  @Override
  int getSensorType() {
    return Sensor.TYPE_ACCELEROMETER;
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.<Class>singletonList(expo.interfaces.sensors.services.AccelerometerService.class);
  }
}
