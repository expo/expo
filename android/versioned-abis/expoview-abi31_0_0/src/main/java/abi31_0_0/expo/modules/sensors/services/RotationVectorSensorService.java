// Copyright 2015-present 650 Industries. All rights reserved.

package abi31_0_0.expo.modules.sensors.services;

import android.content.Context;
import android.hardware.Sensor;

import java.util.Collections;
import java.util.List;

import abi31_0_0.expo.core.interfaces.InternalModule;

public class RotationVectorSensorService extends SubscribableSensorService implements InternalModule, abi31_0_0.expo.interfaces.sensors.services.RotationVectorSensorService {
  public RotationVectorSensorService(Context context) {
    super(context);
  }

  @Override
  int getSensorType() {
    return Sensor.TYPE_ROTATION_VECTOR;
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList((Class) abi31_0_0.expo.interfaces.sensors.services.RotationVectorSensorService.class);
  }
}
