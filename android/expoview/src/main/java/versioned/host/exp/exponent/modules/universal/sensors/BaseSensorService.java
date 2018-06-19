package versioned.host.exp.exponent.modules.universal.sensors;

import android.hardware.SensorEvent;
import android.hardware.SensorEventListener2;

import javax.inject.Inject;

import expo.interfaces.sensors.SensorServiceSubscription;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.services.ExpoKernelServiceRegistry;
import host.exp.exponent.kernel.services.sensors.SensorEventListener;
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService;
import versioned.host.exp.exponent.modules.ExpoKernelServiceConsumerBaseModule;

public abstract class BaseSensorService {
  private ExperienceId mExperienceId;

  @Inject
  protected ExpoKernelServiceRegistry mKernelServiceRegistry;

  public BaseSensorService(ExperienceId experienceId) {
    mExperienceId = experienceId;
    NativeModuleDepsProvider.getInstance().inject(BaseSensorService.class, this);
  }

  protected ExperienceId getExperienceId() {
    return mExperienceId;
  }

  protected ExpoKernelServiceRegistry getKernelServiceRegistry() {
    return mKernelServiceRegistry;
  }

  protected abstract SubscribableSensorKernelService getSensorKernelService();

  public SensorServiceSubscription createSubscriptionForListener(final SensorEventListener2 sensorEventListener) {
    return new SensorSubscription(getSensorKernelService().createSubscriptionForListener(getExperienceId(), new SensorEventListener() {
      @Override
      public void onSensorDataChanged(SensorEvent sensorEvent) {
        sensorEventListener.onSensorChanged(sensorEvent);
      }
    }));
  }
}
