package abi49_0_0.expo.modules.interfaces.sensors;

import android.hardware.SensorEventListener2;

public interface SensorServiceInterface {
  SensorServiceSubscriptionInterface createSubscriptionForListener(SensorEventListener2 sensorEventListener);
}
