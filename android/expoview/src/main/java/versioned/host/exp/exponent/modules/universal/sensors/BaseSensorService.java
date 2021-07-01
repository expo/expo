package versioned.host.exp.exponent.modules.universal.sensors;

import android.hardware.SensorEventListener2;

import javax.inject.Inject;

import expo.modules.interfaces.sensors.SensorServiceSubscriptionInterface;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExperienceKey;
import host.exp.exponent.kernel.services.ExpoKernelServiceRegistry;
import host.exp.exponent.kernel.services.sensors.SensorKernelServiceSubscription;
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService;

public abstract class BaseSensorService {
  private ExperienceKey mExperienceKey;

  @Inject
  protected ExpoKernelServiceRegistry mKernelServiceRegistry;

  public BaseSensorService(ExperienceKey experienceKey) {
    mExperienceKey = experienceKey;
    NativeModuleDepsProvider.getInstance().inject(BaseSensorService.class, this);
  }

  protected ExperienceKey getExperienceScopeKey() {
    return mExperienceKey;
  }

  protected ExpoKernelServiceRegistry getKernelServiceRegistry() {
    return mKernelServiceRegistry;
  }

  protected abstract SubscribableSensorKernelService getSensorKernelService();

  public SensorServiceSubscriptionInterface createSubscriptionForListener(SensorEventListener2 sensorEventListener) {
    ScopedSensorEventListener scopedSensorEventListener = new ScopedSensorEventListener(sensorEventListener);
    SensorKernelServiceSubscription sensorKernelServiceSubscription = getSensorKernelService().createSubscriptionForListener(getExperienceScopeKey(), scopedSensorEventListener);
    return new SensorSubscription(sensorKernelServiceSubscription);
  }
}
