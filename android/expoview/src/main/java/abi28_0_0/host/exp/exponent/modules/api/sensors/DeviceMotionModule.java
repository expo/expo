package abi28_0_0.host.exp.exponent.modules.api.sensors;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorManager;
import android.view.Surface;
import android.view.WindowManager;

import abi28_0_0.com.facebook.infer.annotation.Assertions;
import abi28_0_0.com.facebook.react.bridge.Arguments;
import abi28_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi28_0_0.com.facebook.react.bridge.ReactMethod;
import abi28_0_0.com.facebook.react.bridge.UiThreadUtil;
import abi28_0_0.com.facebook.react.bridge.WritableMap;
import abi28_0_0.com.facebook.react.modules.core.ChoreographerCompat;
import abi28_0_0.com.facebook.react.modules.core.DeviceEventManagerModule;
import abi28_0_0.com.facebook.react.modules.core.ReactChoreographer;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Nullable;

import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.services.sensors.SensorEventListener;
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService;
import host.exp.exponent.kernel.services.sensors.SensorKernelServiceSubscription;
import abi28_0_0.host.exp.exponent.modules.ExpoKernelServiceConsumerBaseModule;

public class DeviceMotionModule extends ExpoKernelServiceConsumerBaseModule implements SensorEventListener {
  private long mLastUpdate = 0;
  private int mUpdateInterval = 100;
  private float[] mRotationMatrix = new float[9];
  private float[] mRotationResult = new float[3];

  private SensorEvent mAccelerationEvent;
  private SensorEvent mAccelerationIncludingGravityEvent;
  private SensorEvent mRotationEvent;
  private SensorEvent mRotationRateEvent;
  private SensorEvent mGravityEvent;

  private List<SensorKernelServiceSubscription> mServiceSubscriptions = null;

  public DeviceMotionModule(ReactApplicationContext reactContext, ExperienceId experienceId) {
    super(reactContext, experienceId);
  }

  @Override
  public String getName() {
    return "ExponentDeviceMotion";
  }

  @Nullable
  @Override
  public Map<String, Object> getConstants() {
    return Collections.unmodifiableMap(new HashMap<String, Object>() {
      {
        put("Gravity", 9.81);
      }
    });
  }

  @ReactMethod
  public void setUpdateInterval(int updateInterval) {
    mUpdateInterval = updateInterval;
  }

  @ReactMethod
  public void startObserving() {
    if (mServiceSubscriptions == null) {
      mServiceSubscriptions = new ArrayList<>();
      for (SubscribableSensorKernelService kernelService : getSensorKernelServices()) {
        SensorKernelServiceSubscription subscription = kernelService.createSubscriptionForListener(experienceId, this);
        // We want handle update interval on our own,
        // because we need to coordinate updates from multiple sensor services.
        subscription.setUpdateInterval(0);
        mServiceSubscriptions.add(subscription);
      }
    }

    for (SensorKernelServiceSubscription subscription : mServiceSubscriptions) {
      subscription.start();
    }
  }

  @ReactMethod
  public void stopObserving() {
    getReactApplicationContext().runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        for (SensorKernelServiceSubscription subscription : mServiceSubscriptions) {
          subscription.stop();
        }
        UiThreadUtil.assertOnUiThread();
        mCurrentFrameCallback.stop();
      }
    });
  }

  @Override
  public void initialize() {
    ReactApplicationContext reactContext = getReactApplicationContext();
    mDeviceEventEmitter = reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
  }

  private List<SubscribableSensorKernelService> getSensorKernelServices() {
    return Arrays.asList(
        mKernelServiceRegistry.getGyroscopeKernelService(),
        mKernelServiceRegistry.getLinearAccelerationSensorKernelService(),
        mKernelServiceRegistry.getAccelerometerKernelService(),
        mKernelServiceRegistry.getRotationVectorSensorKernelService(),
        mKernelServiceRegistry.getGravitySensorKernelService()
    );
  }

  @Override
  public void onSensorDataChanged(SensorEvent sensorEvent) {
    Sensor sensor = sensorEvent.sensor;

    if (sensor.getType() == Sensor.TYPE_GYROSCOPE) {
      mRotationRateEvent = sensorEvent;
    } else if (sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
      mAccelerationIncludingGravityEvent = sensorEvent;
    } else if (sensor.getType() == Sensor.TYPE_LINEAR_ACCELERATION) {
      mAccelerationEvent = sensorEvent;
    } else if (sensor.getType() == Sensor.TYPE_ROTATION_VECTOR) {
      mRotationEvent = sensorEvent;
    } else if (sensor.getType() == Sensor.TYPE_GRAVITY) {
      mGravityEvent = sensorEvent;
    }

    mCurrentFrameCallback.maybePostFromNonUI();
  }

  private ScheduleDispatchFrameCallback mCurrentFrameCallback = new ScheduleDispatchFrameCallback();
  private DispatchEventRunnable mDispatchEventRunnable = new DispatchEventRunnable();
  private DeviceEventManagerModule.RCTDeviceEventEmitter mDeviceEventEmitter;

  private class ScheduleDispatchFrameCallback extends ChoreographerCompat.FrameCallback {
    private volatile boolean mIsPosted = false;
    private boolean mShouldStop = false;

    @Override
    public void doFrame(long frameTimeNanos) {
      UiThreadUtil.assertOnUiThread();

      if (mShouldStop) {
        mIsPosted = false;
      } else {
        post();
      }

      long curTime = System.currentTimeMillis();
      if ((curTime - mLastUpdate) > mUpdateInterval) {
        getReactApplicationContext().runOnJSQueueThread(mDispatchEventRunnable);
        mLastUpdate = curTime;
      }
    }

    public void stop() {
      mShouldStop = true;
    }

    public void maybePost() {
      if (!mIsPosted) {
        mIsPosted = true;
        post();
      }
    }

    private void post() {
      ReactChoreographer.getInstance()
          .postFrameCallback(ReactChoreographer.CallbackType.TIMERS_EVENTS, mCurrentFrameCallback);
    }

    public void maybePostFromNonUI() {
      if (mIsPosted) {
        return;
      }

      if (getReactApplicationContext().isOnUiQueueThread()) {
        maybePost();
      } else {
        getReactApplicationContext().runOnUiQueueThread(new Runnable() {
          @Override
          public void run() {
            maybePost();
          }
        });
      }
    }
  }

  private class DispatchEventRunnable implements Runnable {
    @Override
    public void run() {
      Assertions.assertNotNull(mDeviceEventEmitter);
      mDeviceEventEmitter.emit("deviceMotionDidUpdate", eventsToMap());
    }
  }

  private WritableMap eventsToMap() {
    WritableMap map = Arguments.createMap();
    WritableMap acceleration = Arguments.createMap();
    WritableMap accelerationIncludingGravity = Arguments.createMap();
    WritableMap rotation = Arguments.createMap();
    WritableMap rotationRate = Arguments.createMap();

    if (mAccelerationEvent != null) {
      acceleration.putDouble("x", mAccelerationEvent.values[0]);
      acceleration.putDouble("y", mAccelerationEvent.values[1]);
      acceleration.putDouble("z", mAccelerationEvent.values[2]);
      map.putMap("acceleration", acceleration);

    }

    if (mAccelerationIncludingGravityEvent != null && mGravityEvent != null) {
      accelerationIncludingGravity.putDouble("x", mAccelerationIncludingGravityEvent.values[0] - 2 * mGravityEvent.values[0]);
      accelerationIncludingGravity.putDouble("y", mAccelerationIncludingGravityEvent.values[1] - 2 * mGravityEvent.values[1]);
      accelerationIncludingGravity.putDouble("z", mAccelerationIncludingGravityEvent.values[2] - 2 * mGravityEvent.values[2]);
      map.putMap("accelerationIncludingGravity", accelerationIncludingGravity);
    }

    if (mRotationRateEvent != null) {
      rotationRate.putDouble("alpha", mRotationRateEvent.values[2]);
      rotationRate.putDouble("beta", mRotationRateEvent.values[0]);
      rotationRate.putDouble("gamma", mRotationRateEvent.values[1]);
      map.putMap("rotationRate", rotationRate);
    }

    if (mRotationEvent != null) {
      SensorManager.getRotationMatrixFromVector(mRotationMatrix, mRotationEvent.values);
      SensorManager.getOrientation(mRotationMatrix, mRotationResult);
      rotation.putDouble("alpha", -mRotationResult[0]);
      rotation.putDouble("beta", -mRotationResult[1]);
      rotation.putDouble("gamma", mRotationResult[2]);
      map.putMap("rotation", rotation);
    }

    map.putInt("orientation", getOrientation());

    return map;
  }

  private int getOrientation() {
    switch(((WindowManager) getReactApplicationContext().getSystemService(Context.WINDOW_SERVICE)).getDefaultDisplay().getRotation()) {
      case Surface.ROTATION_0:
        return 0;
      case Surface.ROTATION_90:
        return 90;
      case Surface.ROTATION_180:
        return 180;
      case Surface.ROTATION_270:
        return -90;
      default:
        return 0;
    }
  }
}
