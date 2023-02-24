package com.swmansion.reanimated.sensor;

import android.hardware.Sensor;

public enum ReanimatedSensorType {
  ACCELEROMETER(Sensor.TYPE_LINEAR_ACCELERATION),
  GYROSCOPE(Sensor.TYPE_GYROSCOPE),
  GRAVITY(Sensor.TYPE_GRAVITY),
  MAGNETIC_FIELD(Sensor.TYPE_MAGNETIC_FIELD),
  ROTATION_VECTOR(Sensor.TYPE_ROTATION_VECTOR);

  private final int type;

  ReanimatedSensorType(int type) {
    this.type = type;
  }

  public int getType() {
    return type;
  }

  public static ReanimatedSensorType getInstanceById(int typeId) {
    switch (typeId) {
      case 1:
        return ReanimatedSensorType.ACCELEROMETER;
      case 2:
        return ReanimatedSensorType.GYROSCOPE;
      case 3:
        return ReanimatedSensorType.GRAVITY;
      case 4:
        return ReanimatedSensorType.MAGNETIC_FIELD;
      case 5:
        return ReanimatedSensorType.ROTATION_VECTOR;
    }
    throw new IllegalArgumentException("[Reanimated] Unknown sensor type");
  }
}
