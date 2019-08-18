// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel.services.sensors;

import android.content.Context;
import android.hardware.Sensor;

public class RotationVectorSensorKernelService extends SubscribableSensorKernelService {
  public RotationVectorSensorKernelService(Context context) {
    super(context);
  }

  @Override
  int getSensorType() {
    return Sensor.TYPE_ROTATION_VECTOR;
  }
}
