// Copyright 2018-present 650 Industries. All rights reserved.

package expo.modules.ar;

import android.content.Context;
import android.graphics.SurfaceTexture;
import android.os.Bundle;
import android.os.Parcelable;

import com.google.ar.core.Anchor;
import com.google.ar.core.AugmentedImage;
import com.google.ar.core.Camera;
import com.google.ar.core.Config;
import com.google.ar.core.Frame;
import com.google.ar.core.HitResult;
import com.google.ar.core.LightEstimate;
import com.google.ar.core.Plane;
import com.google.ar.core.Point;
import com.google.ar.core.PointCloud;
import com.google.ar.core.Pose;
import com.google.ar.core.Session;
import com.google.ar.core.Trackable;
import com.google.ar.core.TrackingState;
import com.google.ar.core.exceptions.CameraNotAvailableException;
import com.google.ar.core.exceptions.UnavailableApkTooOldException;
import com.google.ar.core.exceptions.UnavailableArcoreNotInstalledException;
import com.google.ar.core.exceptions.UnavailableSdkTooOldException;

import java.nio.FloatBuffer;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ActivityProvider;
import expo.modules.ar.gl.ARGLCameraObject;
import expo.modules.ar.gl.ARGLCameraObject2;
import expo.modules.gl.GLView;

public class ARSessionManager implements GLView.OnSurfaceTextureUpdatedListener {
  private static final String ERROR_TAG = "E_AR";
  private static final String TAG = ARSessionManager.class.getSimpleName();

  private final ModuleRegistry mModuleRegistry;
  private final ActivityProvider mActivityProvider;
  private final ARDependenciesHelper mARDependenciesHelper;
  private final ARSerializer mARSerializer;
  private final Context mContext;

  public ARSessionManagerDelegate delegate;

//  private ARGLCameraObject mCameraObject;
  private ARGLCameraObject2 mCameraObject;
  private Session mSession;
  private GLView mGLView;
  private boolean isReady = false;

  private float[] viewMatrix = new float[16];
  private float[] projectionMatrix = new float[16];
  private float[] poseMatrix = new float[16];

  private TrackingState trackingState = TrackingState.STOPPED;

  private Frame storedFrame;

  ARSessionManager(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
    mActivityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    mContext = mActivityProvider.getCurrentActivity().getApplicationContext();
    mARDependenciesHelper = new ARDependenciesHelper(mModuleRegistry);
    mARSerializer = new ARSerializer();
  }

  void startWithGLView(final GLView view, final Runnable completionHandler) throws IllegalStateException {
    mGLView = view;
    mGLView.registerOnSurfaceTextureUpdatedListener(this);

    // Ensure all AR conditions are met
    mARDependenciesHelper.ensureARCoreInstalled();
    mARDependenciesHelper.ensureCameraPermissionsGranted();
    createOrResumeARSession();

    mGLView.runOnGLThread(new Runnable() {
      @Override
      public void run() {
        mCameraObject = new ARGLCameraObject2(mContext, mSession, mGLView);
        mCameraObject.createOnGLThread();
        completionHandler.run();
      }
    });
  }

  void createOrResumeARSession() throws IllegalStateException {
    try {
      if (mSession == null) {
        mSession = new Session(mContext);
        Config config = new Config(mSession);
        config.setUpdateMode(Config.UpdateMode.BLOCKING);
        mSession.configure(config);
      }

      mSession.resume();
    } catch (CameraNotAvailableException e) {
      throw new IllegalStateException("Camera not available on device.", e);
    } catch (UnavailableApkTooOldException e) {
      throw new IllegalStateException("ARCore is out of date.", e);
    } catch (UnavailableSdkTooOldException e) {
      throw new IllegalStateException("Android software does not support AR functionality.", e);
    } catch (UnavailableArcoreNotInstalledException e) {
      throw new IllegalStateException("ARCore is not installed on device. Please ensure ARCore is installed.", e);
    }
  }

  private Frame getCurrentFrame() {
    Frame frame = null;
    if (mSession != null) {
      try {
        if (storedFrame == null) {
          frame = mSession.update();
        } else {
          frame = storedFrame;
        }
      } catch (Exception e) {
        //TODO:Bacon: Throw
      }
    }
    return frame;
  }

  protected void pause() {
    if (mSession == null) return;
    storedFrame = null;
    mSession.pause();
  }

  protected void stop() {
    if (mSession != null) {
      mSession.setCameraTextureName(-1);
      mSession = null;
      if (mCameraObject != null) {
        mCameraObject.destroy();
      }
    }
  }

  public boolean isInitialized() {
    return isReady;
  }

  public boolean isTracking() {
    return trackingState == TrackingState.TRACKING;
  }

  public void getProjectionMatrix(final float near, final float far, final Promise promise) {
    final Bundle map = new Bundle();

    if (isReady) {
      mGLView.runOnGLThread(new Runnable() {
        @Override
        public void run() {
          try {

            Camera camera = mSession.update().getCamera();
            camera.getProjectionMatrix(projectionMatrix, 0, near, far);
            camera.getViewMatrix(viewMatrix, 0);
            map.putFloatArray("viewMatrix", viewMatrix);
            map.putFloatArray("projectionMatrix", projectionMatrix);
            promise.resolve(map);
          } catch (CameraNotAvailableException e) {
            promise.reject(ERROR_TAG + "_CAMERA_UNAVAILABLE", e.getLocalizedMessage());
          }
        }});
    } else {
//      promise.reject(E_CAMERA_NOT_AVAILABLE, "Session not ready yet");
      map.putFloatArray("viewMatrix", viewMatrix);
      map.putFloatArray("projectionMatrix", projectionMatrix);
      promise.resolve(map);
    }
  }

  protected void getCurrentFrameAsync(final Map<String, Object> attributes, final Promise promise) {
    mGLView.runOnGLThread(new Runnable() {
      @Override
      public void run() {
        Frame currentFrame = getCurrentFrame();
        if (currentFrame != null) {
          Bundle frame = mARSerializer.serializeFrame(currentFrame, attributes);
          promise.resolve(frame);
        } else {
          promise.resolve(null);
        }

      }
    });
  }

  public void performHitTestAsync(final float x, final float y, ArrayList<String> types, final Promise promise) {
    mGLView.runOnGLThread(new Runnable() {
      @Override
      public void run() {
        Frame frame = getCurrentFrame();
        if (frame == null) {
          promise.reject(ERROR_TAG + "_INVALID_FRAME", "Cannot obtain frame from AR session");
          return;
        }

        List<HitResult> hitResults = frame.hitTest(x, y);
        List<Bundle> result = mARSerializer.serializeHitResults(hitResults);
        promise.resolve(result);
      }
    });
  }

  private boolean cameraExistsOrReject(Promise promise) {
    if (mCameraObject != null) {
      return true;
    }
    promise.reject("E_NO_SESSION", "AR Camera is not initialized");
    return false;
  }

  void getCameraTextureAsync(Promise promise) {
    if (!cameraExistsOrReject(promise)) {
      return;
    }
    promise.resolve(mCameraObject.getCameraTexture());
  }

  @Override
  public void onSurfaceTextureUpdated(final SurfaceTexture surfaceTexture) {
    if (mCameraObject != null) {
      mGLView.runOnGLThread(new Runnable() {
        @Override
        public void run() {
          try {
            final Frame frame = mSession.update();
            mCameraObject.drawFrame(frame);
          } catch (CameraNotAvailableException e) {
            e.printStackTrace();
          }
        }
      });
    }
  }
}
