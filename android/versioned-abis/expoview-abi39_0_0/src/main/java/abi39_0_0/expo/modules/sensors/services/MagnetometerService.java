// Copyright 2015-present 650 Industries. All rights reserved.

package abi39_0_0.expo.modules.sensors.services;

import android.content.Context;
import android.hardware.Sensor;

import java.util.Collections;
import java.util.List;

import abi39_0_0.org.unimodules.core.interfaces.InternalModule;

public class MagnetometerService extends SubscribableSensorService implements InternalModule, abi39_0_0.org.unimodules.interfaces.sensors.services.MagnetometerService {
  public MagnetometerService(Context reactContext) {
    super(reactContext);
  }

  @Override
  int getSensorType() {
    return Sensor.TYPE_MAGNETIC_FIELD;
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.<Class>singletonList(abi39_0_0.org.unimodules.interfaces.sensors.services.MagnetometerService.class);
  }
}
