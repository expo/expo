// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sensors.services;

import android.content.Context;
import android.content.pm.PackageManager;
import android.hardware.Sensor;

import java.util.Collections;
import java.util.List;

import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.InternalModule;

public class PedometerService extends SubscribableSensorService implements InternalModule, org.unimodules.interfaces.sensors.services.PedometerService {
  public PedometerService(Context reactContext) {
    super(reactContext);
  }

  @Override
  int getSensorType() {
    return Sensor.TYPE_STEP_COUNTER;
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.<Class>singletonList(org.unimodules.interfaces.sensors.services.PedometerService.class);
  }
}
