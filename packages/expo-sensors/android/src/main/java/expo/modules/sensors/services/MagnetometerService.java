// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sensors.services;

import android.content.Context;
import android.hardware.Sensor;

import java.util.Collections;
import java.util.List;

import org.unimodules.core.interfaces.InternalModule;

import expo.modules.interfaces.sensors.services.MagnetometerServiceInterface;

public class MagnetometerService extends SubscribableSensorService implements InternalModule, MagnetometerServiceInterface {
  public MagnetometerService(Context reactContext) {
    super(reactContext);
  }

  @Override
  int getSensorType() {
    return Sensor.TYPE_MAGNETIC_FIELD;
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.<Class>singletonList(MagnetometerServiceInterface.class);
  }
}
