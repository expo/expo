package expo.modules.battery;

import android.content.Context;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.RegistryLifecycleListener;
import org.unimodules.core.interfaces.services.EventEmitter;

import android.content.Intent;
import android.content.IntentFilter;
import android.os.BatteryManager;
import android.os.Bundle;
import android.os.PowerManager;
import android.util.Log;

public class BatteryModule extends ExportedModule implements RegistryLifecycleListener {
  private static final String NAME = "ExpoBattery";
  private static final String TAG = BatteryModule.class.getSimpleName();
  private static final String BATTERY_LEVEL_EVENT_NAME = "Expo.batteryLevelDidChange";
  private static final String BATTERY_CHARGED_EVENT_NAME = "Expo.batteryStateDidChange";
  private static final String POWERMODE_EVENT_NAME = "Expo.powerModeDidChange";

  private ModuleRegistry mModuleRegistry;
  static protected Context mContext;
  static private EventEmitter mEventEmitter;

  public BatteryModule(Context context) {
    super(context);
    mContext = context;
  }

  public enum BatteryState {
    UNKNOWN(0),
    UNPLUGGED(1),
    CHARGING(2),
    FULL(3);

    private final int value;

    BatteryState(int value) {
      this.value = value;
    }

    public int getValue() {
      return value;
    }
  }


  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
    mEventEmitter = moduleRegistry.getModule(EventEmitter.class);
    mContext.registerReceiver(new BatteryStateReceiver(), new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
    mContext.registerReceiver(new PowerSaverReceiver(), new IntentFilter("android.os.action.POWER_SAVE_MODE_CHANGED"));
    IntentFilter ifilter = new IntentFilter();
    ifilter.addAction(Intent.ACTION_BATTERY_LOW);
    ifilter.addAction(Intent.ACTION_BATTERY_OKAY);
    mContext.registerReceiver(new BatteryLevelReceiver(), ifilter);
  }

  static protected void onBatteryStateChange(BatteryState batteryState) {
    Bundle result = new Bundle();
    result.putInt("batteryState", batteryState.getValue());
    mEventEmitter.emit(BATTERY_CHARGED_EVENT_NAME, result);
  }

  static protected void onLowPowerModeChange(boolean lowPowerMode) {
    Bundle result = new Bundle();
    result.putBoolean("lowPowerMode", lowPowerMode);
    mEventEmitter.emit(POWERMODE_EVENT_NAME, result);
  }

  static protected void onBatteryLevelChange(float BatteryLevel) {
    Bundle result = new Bundle();
    result.putFloat("batteryLevel", BatteryLevel);
    mEventEmitter.emit(BATTERY_LEVEL_EVENT_NAME, result);
  }

  static protected BatteryState batteryStatusNativeToJS(int status) {
    if (status == BatteryManager.BATTERY_STATUS_FULL) {
      return BatteryState.FULL;
    } else if (status == BatteryManager.BATTERY_STATUS_CHARGING) {
      return BatteryState.CHARGING;
    } else if (status == BatteryManager.BATTERY_STATUS_NOT_CHARGING || status == BatteryManager.BATTERY_STATUS_DISCHARGING) {
      return BatteryState.UNPLUGGED;
    } else {
      return BatteryState.UNKNOWN;
    }
  }

  @ExpoMethod
  public void getBatteryLevelAsync(Promise promise) {
    try {
      Intent batteryIntent = this.mContext.getApplicationContext().registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
      int level = batteryIntent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
      int scale = batteryIntent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
      float batteryLevel = level / (float) scale;
      promise.resolve(batteryLevel);
    } catch (NullPointerException e) {
      Log.e(TAG, e.getMessage());
      promise.reject("ERR_BATTERY_INVALID_ACCESS_BATTERY_LEVEL", "Could not get battery level", e);
    }
  }

  @ExpoMethod
  public void getBatteryStateAsync(Promise promise) {
    try {
      IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
      Intent batteryStatus = this.mContext.getApplicationContext().registerReceiver(null, ifilter);
      int status = batteryStatus.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
      promise.resolve(batteryStatusNativeToJS(status).getValue());
    } catch (NullPointerException e) {
      Log.e(TAG, e.getMessage());
      promise.reject("ERR_BATTERY_INVALID_ACCESS_BATTERY_STATE", "Could not get battery state", e);
    }
  }

  @ExpoMethod
  public void isLowPowerModeEnabledAsync(Promise promise) {
    try {
      PowerManager powerManager = (PowerManager) mContext.getApplicationContext().getSystemService(Context.POWER_SERVICE);
      boolean lowPowerMode = powerManager.isPowerSaveMode();
      promise.resolve(lowPowerMode);
    } catch (NullPointerException e) {
      Log.e(TAG, e.getMessage());
      promise.reject("ERR_BATTERY_INVALID_ACCESS_POWER_SAVER", "Could not get power saver mode", e);
    }
  }

  @ExpoMethod
  public void getPowerStateAsync(Promise promise) {
    try {
      Bundle result = new Bundle();
      IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);

      Intent batteryIntent = this.mContext.getApplicationContext().registerReceiver(null, ifilter);
      int level = batteryIntent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
      int scale = batteryIntent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
      float batteryLevel = level / (float) scale;
      result.putFloat("batteryLevel", batteryLevel);

      Intent batteryStatus = this.mContext.getApplicationContext().registerReceiver(null, ifilter);
      int status = batteryStatus.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
      result.putInt("batteryState",  batteryStatusNativeToJS(status).getValue());

      PowerManager powerManager = (PowerManager) mContext.getApplicationContext().getSystemService(Context.POWER_SERVICE);
      boolean lowPowerMode = powerManager.isPowerSaveMode();
      result.putBoolean("lowPowerMode", lowPowerMode);

      promise.resolve(result);
    } catch (NullPointerException e) {
      Log.e(TAG, e.getMessage());
      promise.reject("ERR_BATTERY_INVALID_ACCESS_POWER_STATE", "Could not get battery power state", e);
    }
  }
}
