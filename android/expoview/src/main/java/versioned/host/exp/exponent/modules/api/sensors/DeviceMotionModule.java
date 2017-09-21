package versioned.host.exp.exponent.modules.api.sensors;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.view.Surface;
import android.view.WindowManager;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.ChoreographerCompat;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.core.ReactChoreographer;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nullable;

public class DeviceMotionModule extends ReactContextBaseJavaModule
    implements SensorEventListener, LifecycleEventListener {

  private SensorManager mSensorManager;
  private boolean mPaused = false;
  private boolean mEnabled = false;
  private long mLastUpdate = 0;
  private int mUpdateInterval = 100;
  private float[] mRotationMatrix = new float[9];
  private float[] mRotationResult = new float[3];

  private SensorEvent mAccelerationEvent;
  private SensorEvent mAccelerationIncludingGravityEvent;
  private SensorEvent mRotationEvent;
  private SensorEvent mRotationRateEvent;
  private SensorEvent mGravityEvent;

  private ReactApplicationContext mReactContext;

  private static int[] sensorTypes = {
      Sensor.TYPE_GYROSCOPE,
      Sensor.TYPE_LINEAR_ACCELERATION,
      Sensor.TYPE_ACCELEROMETER,
      Sensor.TYPE_ROTATION_VECTOR,
      Sensor.TYPE_GRAVITY,
  };

  public DeviceMotionModule(ReactApplicationContext reactContext) {
    super(reactContext);
    mReactContext = reactContext;
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
    mEnabled = true;
    for (int type : sensorTypes) {
      mSensorManager.registerListener(
          this,
          mSensorManager.getDefaultSensor(type),
          SensorManager.SENSOR_DELAY_FASTEST
      );
    }
  }

  @ReactMethod
  public void stopObserving() {
    mEnabled = false;
    mSensorManager.unregisterListener(this);
    UiThreadUtil.assertOnUiThread();
    mCurrentFrameCallback.stop();
  }

  @Override
  public void initialize() {
    ReactApplicationContext reactContext = getReactApplicationContext();
    mSensorManager = (android.hardware.SensorManager)reactContext.getSystemService(Context.SENSOR_SERVICE);
    reactContext.addLifecycleEventListener(this);
    mDeviceEventEmitter = reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
  }

  private void maybeResumeObserving() {
    if (mEnabled && mPaused) {
      mPaused = false;
      startObserving();
    }
  }

  private void maybePauseObserving() {
    if (mEnabled && !mPaused) {
      mPaused = true;
      mSensorManager.unregisterListener(this);
      UiThreadUtil.assertOnUiThread();
      mCurrentFrameCallback.stop();
    }
  }

  @Override
  public void onSensorChanged(SensorEvent sensorEvent) {
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
        mReactContext.runOnJSQueueThread(mDispatchEventRunnable);
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

      if (mReactContext.isOnUiQueueThread()) {
        maybePost();
      } else {
        mReactContext.runOnUiQueueThread(new Runnable() {
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
    switch(((WindowManager) mReactContext.getSystemService(Context.WINDOW_SERVICE)).getDefaultDisplay().getRotation()) {
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

  @Override
  public void onAccuracyChanged(Sensor sensor, int accuracy) {
  }

  @Override
  public void onHostResume() {
    maybeResumeObserving();
  }

  @Override
  public void onHostPause() {
    maybePauseObserving();
  }

  @Override
  public void onHostDestroy() {
    stopObserving();
  }
}

