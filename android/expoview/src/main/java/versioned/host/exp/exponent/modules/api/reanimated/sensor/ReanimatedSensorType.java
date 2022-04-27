package versioned.host.exp.exponent.modules.api.reanimated.sensor;

public enum ReanimatedSensorType {
  ACCELEROMETER(1),
  GYROSCOPE(2),
  GRAVITY(3),
  MAGNETIC_FIELD(4),
  ROTATION_VECTOR(5);

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
