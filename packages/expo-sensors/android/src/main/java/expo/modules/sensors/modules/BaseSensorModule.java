package expo.modules.sensors.modules;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener2;
import android.os.Bundle;
import android.util.Log;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.interfaces.LifecycleEventListener;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.interfaces.services.EventEmitter;
import expo.core.interfaces.services.UIManager;
import expo.interfaces.sensors.SensorService;
import expo.interfaces.sensors.SensorServiceSubscription;

public abstract class BaseSensorModule extends ExportedModule implements SensorEventListener2, ModuleRegistryConsumer, LifecycleEventListener {
  private SensorServiceSubscription mSensorServiceSubscription;
  private ModuleRegistry mModuleRegistry;
  private boolean mIsObserving = false;

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
    // Unregister from old UIManager
    if (mModuleRegistry != null && mModuleRegistry.getModule(UIManager.class) != null) {
      mModuleRegistry.getModule(UIManager.class).unregisterLifecycleEventListener(this);
    }

    mModuleRegistry = moduleRegistry;

    // Register to new UIManager
    if (mModuleRegistry != null && mModuleRegistry.getModule(UIManager.class) != null) {
      mModuleRegistry.getModule(UIManager.class).registerLifecycleEventListener(this);
    }
  }

  @Override
  public void onSensorChanged(SensorEvent sensorEvent) {
    EventEmitter eventEmitter = mModuleRegistry.getModule(EventEmitter.class);
    if (eventEmitter != null) {
      eventEmitter.emit(getEventName(), eventToMap(sensorEvent));
    } else {
      Log.e("E_SENSOR_MODULE", "Could not emit " + getEventName() + " event, no event emitter present.");
    }
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
    mIsObserving = true;
    getSensorKernelServiceSubscription().start();
  }

  public void stopObserving() {
    mIsObserving = false;
    getSensorKernelServiceSubscription().stop();
  }

  @Override
  public void onHostResume() {
    if (mIsObserving) {
      getSensorKernelServiceSubscription().start();
    }
  }

  @Override
  public void onHostPause() {
    getSensorKernelServiceSubscription().stop();
  }

  @Override
  public void onHostDestroy() {
    getSensorKernelServiceSubscription().release();
  }
}
