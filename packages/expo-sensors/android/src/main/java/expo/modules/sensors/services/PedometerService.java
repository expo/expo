// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sensors.services;

import android.content.Context;
import android.content.pm.PackageManager;
import android.hardware.Sensor;

import java.util.Collections;
import java.util.List;

import expo.core.Promise;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.InternalModule;

public class PedometerService extends SubscribableSensorService implements InternalModule, expo.interfaces.sensors.services.PedometerService {
  public PedometerService(Context reactContext) {
    super(reactContext);
  }

  @Override
  int getSensorType() {
    return Sensor.TYPE_STEP_COUNTER;
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.<Class>singletonList(expo.interfaces.sensors.services.PedometerService.class);
  }
}
