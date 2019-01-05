package expo.interfaces.sensors;

public interface SensorServiceSubscription {
  void start();
  boolean isEnabled();
  boolean isAvailable();
  Long getUpdateInterval();
  void setUpdateInterval(long updateInterval);
  void stop();
  void release();
}