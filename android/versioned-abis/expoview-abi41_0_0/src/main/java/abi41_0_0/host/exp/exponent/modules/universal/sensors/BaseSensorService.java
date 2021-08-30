package abi41_0_0.host.exp.exponent.modules.universal.sensors;

import android.hardware.SensorEventListener2;

import javax.inject.Inject;

import abi41_0_0.org.unimodules.interfaces.sensors.SensorServiceSubscription;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExperienceKey;
import host.exp.exponent.kernel.services.ExpoKernelServiceRegistry;
import host.exp.exponent.kernel.services.sensors.SensorKernelServiceSubscription;
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService;

public abstract class BaseSensorService {
  private ExperienceKey mExperienceKey;

  @Inject
  protected ExpoKernelServiceRegistry mKernelServiceRegistry;

  public BaseSensorService(ExperienceKey experiencKey) {
    mExperienceKey = experiencKey;
    NativeModuleDepsProvider.getInstance().inject(BaseSensorService.class, this);
  }

  protected ExperienceKey getExperienceKey() {
    return mExperienceKey;
  }

  protected ExpoKernelServiceRegistry getKernelServiceRegistry() {
    return mKernelServiceRegistry;
  }

  protected abstract SubscribableSensorKernelService getSensorKernelService();

  public SensorServiceSubscription createSubscriptionForListener(SensorEventListener2 sensorEventListener) {
    ScopedSensorEventListener scopedSensorEventListener = new ScopedSensorEventListener(sensorEventListener);
    SensorKernelServiceSubscription sensorKernelServiceSubscription = getSensorKernelService().createSubscriptionForListener(getExperienceKey(), scopedSensorEventListener);
    return new SensorSubscription(sensorKernelServiceSubscription);
  }
}
