// Copyright 2015-present 650 Industries. All rights reserved.

package versioned.host.exp.exponent.modules.api.sensors;

import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorManager;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;


public class AccelerometerModule extends SensorModuleBase {

  @Override
  public String getName() {
    return "ExponentAccelerometer";
  }

  public AccelerometerModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  private static WritableMap eventToMap(SensorEvent sensorEvent) {
    WritableMap map = Arguments.createMap();
    map.putDouble("x", sensorEvent.values[0] / SensorManager.GRAVITY_EARTH);
    map.putDouble("y", sensorEvent.values[1] / SensorManager.GRAVITY_EARTH);
    map.putDouble("z", sensorEvent.values[2]/  SensorManager.GRAVITY_EARTH);
    return map;
  }

  @Override
  public int getSensorType() {
    return Sensor.TYPE_ACCELEROMETER;
  }

  @Override
  public void onSensorDataChanged(SensorEvent sensorEvent) {
    getReactApplicationContext().getJSModule(RCTDeviceEventEmitter.class).
        emit("accelerometerDidUpdate", eventToMap(sensorEvent));
  }

  @ReactMethod
  public void setUpdateInterval(int updateInterval) {
    super.setUpdateInterval(updateInterval);
  }

  @ReactMethod
  public void startObserving() {
    super.startObserving();
  }

  @ReactMethod
  public void stopObserving() {
    super.stopObserving();
  }
}
