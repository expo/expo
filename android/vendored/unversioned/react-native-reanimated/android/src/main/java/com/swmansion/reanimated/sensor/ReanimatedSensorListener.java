package com.swmansion.reanimated.sensor;

import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.view.Display;
import android.view.Surface;
import com.swmansion.reanimated.nativeProxy.SensorSetter;

public class ReanimatedSensorListener implements SensorEventListener {

  private SensorSetter setter;
  private double lastRead = (double) System.currentTimeMillis();
  private final double interval;

  private float[] rotation = new float[9];
  private float[] orientation = new float[3];
  private float[] quaternion = new float[4];

  private final Display display;

  ReanimatedSensorListener(SensorSetter setter, double interval, Display display) {
    this.setter = setter;
    this.interval = interval;
    this.display = display;
  }

  @Override
  public void onSensorChanged(SensorEvent event) {
    double current = (double) System.currentTimeMillis();
    if (current - lastRead < interval) {
      return;
    }
    int sensorType = event.sensor.getType();
    lastRead = current;

    int orientationDegrees;
    switch (display.getRotation()) {
      case Surface.ROTATION_90:
        orientationDegrees = 90;
        break;
      case Surface.ROTATION_180:
        orientationDegrees = 180;
        break;
      case Surface.ROTATION_270:
        orientationDegrees = 270;
        break;
      default:
        orientationDegrees = 0;
        break;
    }

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
            // make Android consistent with iOS, which is better documented here:
            // https://developer.apple.com/documentation/coremotion/getting_processed_device-motion_data/understanding_reference_frames_and_device_attitude
            -orientation[0], // yaw
            -orientation[1], // pitch
            orientation[2] // roll
          };
      setter.sensorSetter(data, orientationDegrees);
    } else {
      setter.sensorSetter(event.values, orientationDegrees);
    }
  }

  @Override
  public void onAccuracyChanged(Sensor sensor, int accuracy) {}
}
