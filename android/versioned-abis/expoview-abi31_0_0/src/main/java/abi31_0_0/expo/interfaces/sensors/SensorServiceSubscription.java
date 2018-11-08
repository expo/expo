package abi31_0_0.expo.interfaces.sensors;

public interface SensorServiceSubscription {
  void start();
  boolean isEnabled();
  Long getUpdateInterval();
  void setUpdateInterval(long updateInterval);
  void stop();
  void release();
}
