package expo.modules.interfaces.sensors;

public interface SensorServiceSubscriptionInterface {
  void start();
  boolean isEnabled();
  Long getUpdateInterval();
  void setUpdateInterval(long updateInterval);
  void stop();
  void release();
}
