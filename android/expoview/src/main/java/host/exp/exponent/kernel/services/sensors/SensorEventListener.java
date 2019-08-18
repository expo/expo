// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel.services.sensors;

import android.hardware.SensorEvent;

public interface SensorEventListener {
  void onSensorDataChanged(SensorEvent sensorEvent);
}
