// Copyright 2018-present 650 Industries. All rights reserved.

package expo.modules.ar;

import android.content.Context;
import android.os.Bundle;
import android.util.Log;
import android.util.Size;

import com.google.ar.core.Camera;
import com.google.ar.core.Config;
import com.google.ar.core.Frame;
import com.google.ar.core.HitResult;
import com.google.ar.core.Session;
import com.google.ar.core.TrackingState;
import com.google.ar.core.exceptions.CameraNotAvailableException;
import com.google.ar.core.exceptions.UnavailableApkTooOldException;
import com.google.ar.core.exceptions.UnavailableArcoreNotInstalledException;
import com.google.ar.core.exceptions.UnavailableSdkTooOldException;

import java.util.ArrayList;
import java.util.List;

import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ActivityProvider;
import expo.modules.ar.arguments.ARFrameSerializationAttributes;
import expo.modules.ar.arguments.ARPlaneDetection;
import expo.modules.ar.gl.ARGLCameraObject;
import expo.modules.ar.serializer.ARFrameSerializer;
import expo.modules.ar.serializer.ARHitPointSerializer;
import expo.modules.gl.context.GLContext;
import expo.modules.gl.context.GLSharedContext;
import expo.modules.gl.GLView;

public class ARSessionManager implements GLContext.GLContextChangeListener {
  private static final String ERROR_TAG = "E_AR";
  private static final String TAG = ARSessionManager.class.getSimpleName();

  private final ModuleRegistry mModuleRegistry;
  private final ActivityProvider mActivityProvider;
  private final ARDependenciesHelper mARDependenciesHelper;
  private final ARDisplayRotationHelper mARDisplayRotationHelper;
  private final ARFrameSerializer mARFrameSerializer;
  private final Context mContext;

  public ARSessionManagerDelegate delegate;

  private ARGLCameraObject mCameraObject;
  private Session mSession;
  private GLView mGLView;

  private float[] viewMatrix = new float[16];
  private float[] projectionMatrix = new float[16];

  private TrackingState trackingState = TrackingState.STOPPED;

  private GLSharedContext mSharedGLContext;
  private Frame mCurrentFrame;
  private Config mConfig;

  ARSessionManager(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
    mActivityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    mContext = mActivityProvider.getCurrentActivity().getApplicationContext();
    mARDependenciesHelper = new ARDependenciesHelper(mModuleRegistry);
    mARDisplayRotationHelper = new ARDisplayRotationHelper(mContext);
    mARFrameSerializer = new ARFrameSerializer();
  }

  // ---------------------------------------------------------------------------------------------
  //                                       Lifecycle methods
  // ---------------------------------------------------------------------------------------------

  void startWithGLView(final GLView view, final Runnable completionHandler) throws IllegalStateException {
    mGLView = view;
    mARDisplayRotationHelper.onSurfaceChanged(view.getWidth(), view.getHeight());

    // Ensure all AR conditions are met
    mARDependenciesHelper.ensureARCoreInstalled();
    mARDependenciesHelper.ensureCameraPermissionsGranted();
    createOrResumeARSession();

    mSharedGLContext = mGLView.getGLContext().createSharedGLContext();
    mCameraObject = new ARGLCameraObject(mContext, mSharedGLContext);
    mGLView.getGLContext().runAsync(new Runnable() {
      @Override
      public void run() {
        mSharedGLContext.initlizeOnGLThread();
        mSharedGLContext.runAsync(new Runnable() {
          @Override
          public void run() {
            mCameraObject.initializeOnGLThread();
            completionHandler.run();
          }
        });
      }
    });
  }

  void createOrResumeARSession() throws IllegalStateException {
    try {
      if (mSession == null) {
        mSession = new Session(mContext);
        mConfig = new Config(mSession);
        mConfig.setUpdateMode(Config.UpdateMode.BLOCKING);
        mSession.configure(mConfig);
      }

      mSession.resume();
      mGLView.getGLContext().registerGLContextChangeListener(this);
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

  protected void pause() {
    if (mSession == null) {
      return;
    }
    mGLView.getGLContext().unregisterGLContextChangeListener(this);
    mSession.pause();
  }

  protected void stop() {
    if (mSession != null) {
      mGLView.getGLContext().unregisterGLContextChangeListener(this);
      mSession.setCameraTextureName(-1);
      mSession = null;
      if (mCameraObject != null) {
        mCameraObject.destroy();
      }
    }
  }

  // this one should be called on GL thread
  private void updateFrame() {
    mARDisplayRotationHelper.updateSessionIfNeeded(mSession);

    try {
      // Instruct ARCore session to use texture provided by CameraObject
      mSession.setCameraTextureName(mCameraObject.getCameraTexture());

      // Obtain the current frame from ARSession. When the configuration is set to
      // UpdateMode.BLOCKING (it is by default), this will throttle the rendering to the camera framerate.
      mCurrentFrame = mSession.update();

      Size previewSize = mSession.getCameraConfig().getTextureSize();
      int rotation = mARDisplayRotationHelper.getRotation();
      mCameraObject.drawFrame(mCurrentFrame, rotation, previewSize);

      handleCurrentFrame(mCurrentFrame);

    } catch (CameraNotAvailableException e) {
      // Avoid crashing the application due to unhandled exceptions.
      Log.e(TAG, "Exception on the OpenGL thread", e);
    }
  }

  private void handleCurrentFrame(Frame currentFrame) {
    mARFrameSerializer.storeFrameData(currentFrame);
  }

  public boolean isTracking() {
    return trackingState == TrackingState.TRACKING;
  }

  // ---------------------------------------------------------------------------------------------
  //                                       Features methods
  // ---------------------------------------------------------------------------------------------

  void getProjectionMatrix(final float near, final float far, final Promise promise) {
    if (mSession == null || mCurrentFrame == null) {
      promise.resolve(null);
      return;
    }
    mGLView.runOnGLThread(new Runnable() {
      @Override
      public void run() {
        // Camera instance is long-lived so the same instance is returned
        // regardless of the frame object this method was called on.
        Camera camera = mCurrentFrame.getCamera();
        camera.getProjectionMatrix(projectionMatrix, 0, near, far);
        camera.getViewMatrix(viewMatrix, 0);
        Bundle result = new Bundle();
        result.putFloatArray("viewMatrix", viewMatrix);
        result.putFloatArray("projectionMatrix", projectionMatrix);
        promise.resolve(result);
      }
    });
  }

  void getCurrentFrameAsync(final ARFrameSerializationAttributes attributes, final Promise promise) {
    if (mSession == null || mCurrentFrame == null) {
      promise.resolve(null);
      return;
    }
    mGLView.runOnGLThread(new Runnable() {
      @Override
      public void run() {
        promise.resolve(mARFrameSerializer.serializeAcquiredFrame(attributes));
      }
    });
  }

  void performHitTestAsync(final float x, final float y, ArrayList<String> types, final Promise promise) {
    if (mSession == null || mCurrentFrame == null) {
      promise.resolve(null);
      return;
    }
    mGLView.runOnGLThread(new Runnable() {
      @Override
      public void run() {
        List<HitResult> hitResults = mCurrentFrame.hitTest(x, y);
        List<Bundle> result = ARHitPointSerializer.serializeHitResults(hitResults);
        promise.resolve(result);
      }
    });
  }

  // ---------------------------------------------------------------------------------------------
  //                                      Configuration methods
  // ---------------------------------------------------------------------------------------------

  public void setPlaneDetection(ARPlaneDetection arPlaneDetection) {
    mConfig.setPlaneFindingMode(arPlaneDetection.getPlaneFindingMode());
    mSession.configure(mConfig);
  }

  void getCameraTextureAsync(Promise promise) {
    if (!cameraExistsOrReject(promise)) {
      return;
    }
    promise.resolve(mCameraObject.getJSAvailableCameraTexture());
  }

  // ---------------------------------------------------------------------------------------------
  //                               GLContext.GLContextChangeListener
  // ---------------------------------------------------------------------------------------------

  @Override
  public int getID() {
    return 0;
  }

  @Override
  public void onGLContextUpdated() {
    if (mSession == null || mCameraObject == null) {
      return;
    }
    mSharedGLContext.runAsync(new Runnable() {
      @Override
      public void run() {
        updateFrame();
      }
    });
  }

  // ---------------------------------------------------------------------------------------------
  //                                         Helpers
  // ---------------------------------------------------------------------------------------------

  private boolean cameraExistsOrReject(Promise promise) {
    if (mCameraObject != null) {
      return true;
    }
    promise.reject(ERROR_TAG + "_NO_SESSION", "AR Camera is not initialized");
    return false;
  }
}
