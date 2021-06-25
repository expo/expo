// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sensors.services;

import android.content.Context;
import android.hardware.Sensor;

import java.util.Collections;
import java.util.List;

import org.unimodules.core.interfaces.InternalModule;

import expo.modules.interfaces.sensors.services.GyroscopeServiceInterface;

public class GyroscopeService extends SubscribableSensorService implements InternalModule, GyroscopeServiceInterface {
  public GyroscopeService(Context context) {
    super(context);
  }

  @Override
  int getSensorType() {
    return Sensor.TYPE_GYROSCOPE;
  }


  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.<Class>singletonList(GyroscopeServiceInterface.class);
  }
}
