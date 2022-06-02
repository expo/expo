package abi45_0_0.host.exp.exponent.modules.api.reanimated.sensor;

import android.hardware.Sensor;
import android.hardware.SensorManager;
import abi45_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi45_0_0.host.exp.exponent.modules.api.reanimated.NativeProxy;
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
    this.interval = interval;
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
