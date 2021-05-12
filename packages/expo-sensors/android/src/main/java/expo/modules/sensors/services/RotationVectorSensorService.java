// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sensors.services;

import android.content.Context;
import android.hardware.Sensor;

import java.util.Collections;
import java.util.List;

import org.unimodules.core.interfaces.InternalModule;

import expo.modules.interfaces.sensors.services.RotationVectorSensorServiceInterface;

public class RotationVectorSensorService extends SubscribableSensorService implements InternalModule, RotationVectorSensorServiceInterface {
  public RotationVectorSensorService(Context context) {
    super(context);
  }

  @Override
  int getSensorType() {
    return Sensor.TYPE_ROTATION_VECTOR;
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.<Class>singletonList(RotationVectorSensorServiceInterface.class);
  }
}
