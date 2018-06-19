package expo.modules.sensors.modules;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener2;
import android.os.Bundle;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.interfaces.services.EventEmitter;
import expo.interfaces.sensors.SensorService;
import expo.interfaces.sensors.SensorServiceSubscription;

public abstract class BaseSensorModule extends ExportedModule implements SensorEventListener2, ModuleRegistryConsumer {
  private SensorServiceSubscription mSensorServiceSubscription;
  private ModuleRegistry mModuleRegistry;

  protected abstract String getEventName();
  protected abstract SensorService getSensorService();
  protected abstract Bundle eventToMap(SensorEvent sensorEvent);

  BaseSensorModule(Context context) {
    super(context);
  }

  ModuleRegistry getModuleRegistry() {
    return mModuleRegistry;
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  @Override
  public void onSensorChanged(SensorEvent sensorEvent) {
    mModuleRegistry.getModule(EventEmitter.class).emit(getEventName(), eventToMap(sensorEvent));
  }

  @Override
  public void onAccuracyChanged(Sensor sensor, int accuracy) {
    // do nothing
  }

  @Override
  public void onFlushCompleted(Sensor sensor) {
    // do nothing
  }

  public void setUpdateInterval(int updateInterval) {
    getSensorKernelServiceSubscription().setUpdateInterval(updateInterval);
  }

  private SensorServiceSubscription getSensorKernelServiceSubscription() {
    if (mSensorServiceSubscription != null) {
      return mSensorServiceSubscription;
    }

    mSensorServiceSubscription = getSensorService().createSubscriptionForListener(this);
    return mSensorServiceSubscription;
  }

  public void startObserving() {
    getSensorKernelServiceSubscription().start();
  }

  public void stopObserving() {
    getSensorKernelServiceSubscription().stop();
  }
}