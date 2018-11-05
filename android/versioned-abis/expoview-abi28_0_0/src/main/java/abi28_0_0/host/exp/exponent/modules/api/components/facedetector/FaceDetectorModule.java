package abi28_0_0.host.exp.exponent.modules.api.components.facedetector;

import android.content.Context;

import abi28_0_0.com.facebook.react.bridge.Promise;
import abi28_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi28_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi28_0_0.com.facebook.react.bridge.ReactMethod;
import abi28_0_0.com.facebook.react.bridge.ReadableMap;
import com.google.android.cameraview.Constants;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nullable;

import host.exp.exponent.utils.ScopedContext;
import abi28_0_0.host.exp.exponent.modules.api.components.facedetector.tasks.FileFaceDetectionAsyncTask;

public class FaceDetectorModule extends ReactContextBaseJavaModule {
  private static final String TAG = "ExpoFaceDetector";
  private ScopedContext mScopedContext;

  public FaceDetectorModule(ReactApplicationContext reactContext, ScopedContext scopedContext) {
    super(reactContext);
    mScopedContext = scopedContext;
  }

  @Override
  public String getName() {
    return TAG;
  }

  @Nullable
  @Override
  public Map<String, Object> getConstants() {
    return Collections.unmodifiableMap(new HashMap<String, Object>() {
      {
        put("Mode", getFaceDetectionModeConstants());
        put("Landmarks", getFaceDetectionLandmarksConstants());
        put("Classifications", getFaceDetectionClassificationsConstants());
      }

      private Map<String, Object> getFaceDetectionModeConstants() {
        return Collections.unmodifiableMap(new HashMap<String, Object>() {
          {
            put("fast", ExpoFaceDetector.FAST_MODE);
            put("accurate", ExpoFaceDetector.ACCURATE_MODE);
          }
        });
      }

      private Map<String, Object> getFaceDetectionClassificationsConstants() {
        return Collections.unmodifiableMap(new HashMap<String, Object>() {
          {
            put("all", ExpoFaceDetector.ALL_CLASSIFICATIONS);
            put("none", ExpoFaceDetector.NO_CLASSIFICATIONS);
          }
        });
      }

      private Map<String, Object> getFaceDetectionLandmarksConstants() {
        return Collections.unmodifiableMap(new HashMap<String, Object>() {
          {
            put("all", ExpoFaceDetector.ALL_LANDMARKS);
            put("none", ExpoFaceDetector.NO_LANDMARKS);
          }
        });
      }
    });
  }

  @ReactMethod
  public void detectFaces(ReadableMap options, final Promise promise) {
    new FileFaceDetectionAsyncTask(mScopedContext, options, promise).execute();
  }
}
