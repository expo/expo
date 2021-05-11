package expo.modules.interfaces.sensors;

import android.hardware.SensorEventListener2;

public interface SensorServiceInterface {
  SensorServiceSubscriptionInterface createSubscriptionForListener(SensorEventListener2 sensorEventListener);
}
