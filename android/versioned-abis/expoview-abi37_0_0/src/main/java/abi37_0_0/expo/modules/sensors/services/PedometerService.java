// Copyright 2015-present 650 Industries. All rights reserved.

package abi37_0_0.expo.modules.sensors.services;

import android.content.Context;
import android.content.pm.PackageManager;
import android.hardware.Sensor;

import java.util.Collections;
import java.util.List;

import abi37_0_0.org.unimodules.core.Promise;
import abi37_0_0.org.unimodules.core.interfaces.ExpoMethod;
import abi37_0_0.org.unimodules.core.interfaces.InternalModule;

public class PedometerService extends SubscribableSensorService implements InternalModule, abi37_0_0.org.unimodules.interfaces.sensors.services.PedometerService {
  public PedometerService(Context reactContext) {
    super(reactContext);
  }

  @Override
  int getSensorType() {
    return Sensor.TYPE_STEP_COUNTER;
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.<Class>singletonList(abi37_0_0.org.unimodules.interfaces.sensors.services.PedometerService.class);
  }
}
