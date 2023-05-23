package com.swmansion.reanimated.sensor;

import static android.content.Context.WINDOW_SERVICE;

import android.hardware.Sensor;
import android.hardware.SensorManager;
import android.view.Display;
import android.view.WindowManager;
import com.facebook.react.bridge.ReactApplicationContext;
import com.swmansion.reanimated.nativeProxy.SensorSetter;
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
      SensorSetter setter) {
    WindowManager wm = (WindowManager) reactContext.get().getSystemService(WINDOW_SERVICE);
    Display display = wm.getDefaultDisplay();
    listener = new ReanimatedSensorListener(setter, interval, display);
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
