// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sensors.services;

import android.content.Context;
import android.hardware.Sensor;

import java.util.Collections;
import java.util.List;

import expo.core.interfaces.InternalModule;

public class RotationVectorSensorService extends SubscribableSensorService implements InternalModule, expo.interfaces.sensors.services.RotationVectorSensorService {
  public RotationVectorSensorService(Context context) {
    super(context);
  }

  @Override
  int getSensorType() {
    return Sensor.TYPE_ROTATION_VECTOR;
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList((Class) expo.interfaces.sensors.services.RotationVectorSensorService.class);
  }
}
