package abi28_0_0.host.exp.exponent.modules.api.sensors;

import android.hardware.SensorEvent;

import abi28_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi28_0_0.com.facebook.react.bridge.WritableMap;
import abi28_0_0.com.facebook.react.modules.core.DeviceEventManagerModule;

import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.services.sensors.SensorEventListener;
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService;
import host.exp.exponent.kernel.services.sensors.SensorKernelServiceSubscription;
import abi28_0_0.host.exp.exponent.modules.ExpoKernelServiceConsumerBaseModule;

public abstract class BaseSensorModule extends ExpoKernelServiceConsumerBaseModule implements SensorEventListener {
  private SensorKernelServiceSubscription mSensorKernelServiceSubscription;

  protected abstract String getEventName();
  protected abstract SubscribableSensorKernelService getKernelService();
  protected abstract WritableMap eventToMap(SensorEvent sensorEvent);

  BaseSensorModule(ReactApplicationContext reactContext, ExperienceId experienceId) {
    super(reactContext, experienceId);
    mSensorKernelServiceSubscription = getKernelService().createSubscriptionForListener(experienceId, this);
  }

  @Override
  public void onSensorDataChanged(SensorEvent sensorEvent) {
    getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).
        emit(getEventName(), eventToMap(sensorEvent));
  }

  public void setUpdateInterval(int updateInterval) {
    mSensorKernelServiceSubscription.setUpdateInterval(updateInterval);
  }

  public void startObserving() {
    mSensorKernelServiceSubscription.start();
  }

  public void stopObserving() {
    mSensorKernelServiceSubscription.stop();
  }
}
