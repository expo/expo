package abi38_0_0.org.unimodules.interfaces.sensors;

public interface SensorServiceSubscription {
  void start();
  boolean isEnabled();
  Long getUpdateInterval();
  void setUpdateInterval(long updateInterval);
  void stop();
  void release();
}
