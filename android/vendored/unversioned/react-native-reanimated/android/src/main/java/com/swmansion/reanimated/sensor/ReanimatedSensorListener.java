package com.swmansion.reanimated.sensor;

import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import com.swmansion.reanimated.NativeProxy;

public class ReanimatedSensorListener implements SensorEventListener {

  private NativeProxy.SensorSetter setter;
  private double lastRead = (double) System.currentTimeMillis();
  private final double interval;

  private float[] rotation = new float[9];
  private float[] orientation = new float[3];
  private float[] quaternion = new float[4];

  ReanimatedSensorListener(NativeProxy.SensorSetter setter, double interval) {
    this.setter = setter;
    this.interval = interval;
  }

  @Override
  public void onSensorChanged(SensorEvent event) {
    double current = (double) System.currentTimeMillis();
    if (current - lastRead < interval) {
      return;
    }
    int sensorType = event.sensor.getType();
    lastRead = current;
    if (sensorType == Sensor.TYPE_ROTATION_VECTOR) {
      SensorManager.getQuaternionFromVector(quaternion, event.values);
      SensorManager.getRotationMatrixFromVector(rotation, event.values);
      SensorManager.getOrientation(rotation, orientation);
      float[] data =
          new float[] {
            quaternion[1], // qx
            quaternion[2], // qy
            quaternion[3], // qz
            quaternion[0], // qw
            orientation[0], // yaw
            orientation[1], // pitch
            orientation[2] // roll
          };
      setter.sensorSetter(data);
    } else {
      setter.sensorSetter(event.values);
    }
  }

  @Override
  public void onAccuracyChanged(Sensor sensor, int accuracy) {}
}
