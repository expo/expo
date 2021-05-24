// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sensors.services;

import android.content.Context;
import android.hardware.Sensor;

import java.util.Collections;
import java.util.List;

import org.unimodules.core.interfaces.InternalModule;

import expo.modules.interfaces.sensors.services.GravitySensorServiceInterface;

public class GravitySensorService extends SubscribableSensorService implements InternalModule, GravitySensorServiceInterface {
  public GravitySensorService(Context reactContext) {
    super(reactContext);
  }

  @Override
  int getSensorType() {
    return Sensor.TYPE_GRAVITY;
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.<Class>singletonList(GravitySensorServiceInterface.class);
  }
}
