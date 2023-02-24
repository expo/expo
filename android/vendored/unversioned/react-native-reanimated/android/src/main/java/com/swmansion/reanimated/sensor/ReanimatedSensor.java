package com.swmansion.reanimated.sensor;

import android.hardware.Sensor;
import android.hardware.SensorManager;
import com.facebook.react.bridge.ReactApplicationContext;
import com.swmansion.reanimated.NativeProxy;
import java.lang.ref.WeakReference;

public class ReanimatedSensor {

  ReanimatedSensorListener listener;
  SensorManager sensorManager;
  Sensor sensor;
  ReanimatedSensorType sensorType;
  int interval;

  ReanimatedSensor(
      WeakReference<ReactApplicationContext> reactContext,
      ReanimatedSensorType sensorType,
      int interval,
      NativeProxy.SensorSetter setter) {
    listener = new ReanimatedSensorListener(setter, interval);
    sensorManager =
        (SensorManager) reactContext.get().getSystemService(reactContext.get().SENSOR_SERVICE);
    this.sensorType = sensorType;
    if (interval == -1) {
      this.interval = SensorManager.SENSOR_DELAY_UI;
    } else {
      this.interval = interval;
    }
  }

  boolean initialize() {
    sensor = sensorManager.getDefaultSensor(sensorType.getType());
    if (sensor != null) {
      sensorManager.registerListener(listener, sensor, interval * 1000);
      return true;
    }
    return false;
  }

  void cancel() {
    sensorManager.unregisterListener(listener, sensor);
  }
}
