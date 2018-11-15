// Copyright 2018-present 650 Industries. All rights reserved.

package expo.modules.ar;

import android.content.Context;
import android.os.Bundle;

import java.util.ArrayList;
import java.util.Map;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.interfaces.services.UIManager;
import expo.modules.ar.arguments.ARFrameAttribute;
import expo.modules.ar.arguments.ARFrameSerializationAttributes;
import expo.modules.ar.arguments.ARPlaneDetection;
import expo.modules.gl.GLView;

public class ARModule extends ExportedModule implements ModuleRegistryConsumer, ARSessionManagerDelegate {
  private static final String TAG = "ExpoAR";
  private static final String ERROR_TAG = "E_AR";

  private GLView mGLView;
  private ARSessionManager mARSessionManager;
  private ModuleRegistry mModuleRegistry;
  private UIManager mUImanager;

  ARModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return TAG;
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
    mUImanager = mModuleRegistry.getModule(UIManager.class);
  }

  // ---------------------------------------------------------------------------------------------
  //                                         EXPO METHODS
  // ---------------------------------------------------------------------------------------------

  // ---------------------------------------------------------------------------------------------
  //                                      Lifecycle methods
  // ---------------------------------------------------------------------------------------------

  @ExpoMethod
  public void startAsync(final int glViewTag, final String configuration, final Promise promise) {
    if (mUImanager == null) {
      promise.reject(ERROR_TAG + "_UI_MANAGER_NOT_FOUND", "UIManager not found in module registry.");
      return;
    }

    if (mARSessionManager != null) {
      mARSessionManager.stop();
      mARSessionManager = null;
    }
    mARSessionManager = new ARSessionManager(mModuleRegistry);

    mUImanager.addUIBlock(glViewTag, new UIManager.UIBlock<GLView>() {
      @Override
      public void resolve(GLView view) {
        mGLView = view;

        mARSessionManager.startWithGLView(mGLView, new Runnable() {
          @Override
          public void run() {
            promise.resolve(null);
          }
        });
        // TODO handle stopping upon destruction
      }

      @Override
      public void reject(Throwable throwable) {
        promise.reject(ERROR_TAG + "_BAD_VIEW_TAG", "ExponentGLObjectManager.createCameraTextureAsync: Expected a GLView");
      }
    }, GLView.class);
  }

  @ExpoMethod
  public void stopAsync(Promise promise) {
    if (!sessionExistsOrReject(promise)) {
      return;
    }
    mARSessionManager.stop();
    promise.resolve(null);
  }

  @ExpoMethod
  public void pauseAsync(Promise promise) {
    if (!sessionExistsOrReject(promise)) {
      return;
    }
    mARSessionManager.pause();
    promise.resolve(null);
  }

  @ExpoMethod
  public void resumeAsync(Promise promise) {
    if (!sessionExistsOrReject(promise)) {
      return;
    }
    try {
      mARSessionManager.createOrResumeARSession();
      promise.resolve(null);
    } catch (IllegalStateException e) {
      promise.reject(ERROR_TAG, e);
    }
  }

  @ExpoMethod
  public void resetAsync(Promise promise) {
    promise.resolve(null);
  }

  // ---------------------------------------------------------------------------------------------
  //                                      Features methods
  // ---------------------------------------------------------------------------------------------

  @ExpoMethod
  public void getCurrentFrameAsync(Map<String, Object> attributes, Promise promise) {
    if (!sessionExistsOrReject(promise)) {
      return;
    }
    ARFrameSerializationAttributes arFrameSerializationAttributes = ARFrameSerializationAttributes.fromMap(attributes);
    if (arFrameSerializationAttributes == null) {
      promise.reject(ERROR_TAG + "_INVALID_ARGS", "AR#getCurrentFrameAsync 'attributes' argument does not provide any valid truthy value.");
      return;
    }
    mARSessionManager.getCurrentFrameAsync(arFrameSerializationAttributes, promise);
  }

  @ExpoMethod
  public void getMatricesAsync(Number zNear, Number zFar, Promise promise) {
    if (!sessionExistsOrReject(promise)) {
      return;
    }
    mARSessionManager.getProjectionMatrix(zNear.floatValue(), zFar.floatValue(), promise);
  }

  public void performHitTestAsync(Map<String, Number> point, ArrayList<String> types, Promise promise) {
    if (!sessionExistsOrReject(promise)) {
      return;
    }

    if (point.containsKey("x") && point.containsKey("y")) {
      mARSessionManager.performHitTestAsync(point.get("x").floatValue(), point.get("y").floatValue(), types, promise);
    } else {
      promise.reject("", "");
    }
  }

  @ExpoMethod
  public void getCameraTextureAsync(Promise promise) {
    if (!sessionExistsOrReject(promise)) {
      return;
    }
    mARSessionManager.getCameraTextureAsync(promise);
  }

  // ---------------------------------------------------------------------------------------------
  //                                     Configuration methods
  // ---------------------------------------------------------------------------------------------

  @ExpoMethod
  public void setPlaneDetectionAsync(String planeDetection, Promise promise) {
    if (!sessionExistsOrReject(promise)) {
      return;
    }
    ARPlaneDetection arPlaneDetection = ARPlaneDetection.fromString(planeDetection);
    if (planeDetection == null) {
      promise.reject(ERROR_TAG + "_INVALID_ARGS", "AR#setPlaneDetectionAsync 'planeDetection' argument have invalid value.");
      return;
    }
    mARSessionManager.setPlaneDetection(arPlaneDetection);
    promise.resolve(null);
  }


  // ---------------------------------------------------------------------------------------------
  //                               ARSessionManagerDelegate methods
  // ---------------------------------------------------------------------------------------------

  @Override
  public void didUpdateWithEvent(String eventName, Bundle payload) {

  }

  // ---------------------------------------------------------------------------------------------
  //                                  Supporting private methods
  // ---------------------------------------------------------------------------------------------

  private boolean sessionExistsOrReject(Promise promise) {
    if (mARSessionManager != null) {
      return true;
    }
    promise.reject(ERROR_TAG +"_NO_SESSION", "AR Session is not initialized.");
    return false;
  }
}
