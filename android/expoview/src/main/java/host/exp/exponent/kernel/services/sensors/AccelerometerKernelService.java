// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel.services.sensors;

import android.content.Context;
import android.hardware.Sensor;

public class AccelerometerKernelService extends SubscribableSensorKernelService {
  public AccelerometerKernelService(Context reactContext) {
    super(reactContext);
  }

  @Override
  int getSensorType() {
    return Sensor.TYPE_ACCELEROMETER;
  }
}
