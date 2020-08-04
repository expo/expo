// Copyright 2015-present 650 Industries. All rights reserved.

package abi37_0_0.expo.modules.sensors.services;

import android.content.Context;
import android.hardware.Sensor;

import java.util.Collections;
import java.util.List;

import abi37_0_0.org.unimodules.core.interfaces.InternalModule;

public class BarometerService extends SubscribableSensorService implements InternalModule, abi37_0_0.org.unimodules.interfaces.sensors.services.BarometerService {
  public BarometerService(Context reactContext) {
    super(reactContext);
  }

  @Override
  int getSensorType() {
    return Sensor.TYPE_PRESSURE;
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.<Class>singletonList(abi37_0_0.org.unimodules.interfaces.sensors.services.BarometerService.class);
  }
}
