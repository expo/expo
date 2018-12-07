// Copyright 2017-present 650 Industries. All rights reserved.

package expo.modules.gl;

import android.content.Context;
import android.os.Bundle;
import android.util.SparseArray;
import android.view.View;

import java.util.Map;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.interfaces.services.UIManager;
import expo.interfaces.camera.ExpoCameraViewInterface;

public class GLObjectManagerModule extends ExportedModule implements ModuleRegistryConsumer {
  private SparseArray<GLObject> mGLObjects = new SparseArray<>();
  private SparseArray<GLContext> mGLContextMap = new SparseArray<>();

  private ModuleRegistry mModuleRegistry;

  public GLObjectManagerModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExponentGLObjectManager";
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  public ModuleRegistry getModuleRegistry() {
    return mModuleRegistry;
  }

  public GLContext getContextWithId(int exglCtxId) {
    return mGLContextMap.get(exglCtxId);
  }

  public void saveContext(final GLContext glContext) {
    mGLContextMap.put(glContext.getContextId(), glContext);
  }

  public void deleteContextWithId(final int exglCtxId) {
    mGLContextMap.delete(exglCtxId);
  }

  @ExpoMethod
  public void destroyObjectAsync(final int exglObjId, final Promise promise) {
    GLObject glObject = mGLObjects.get(exglObjId);
    if (glObject != null) {
      mGLObjects.remove(exglObjId);
      glObject.destroy();
      promise.resolve(true);
    } else {
      promise.resolve(false);
    }
  }

  @ExpoMethod
  public void createCameraTextureAsync(final int exglCtxId, final int cameraViewTag, final Promise promise) {
    UIManager uiManager = mModuleRegistry.getModule(UIManager.class);

    if (uiManager == null) {
      promise.reject("E_UI_MANAGER_NOT_FOUND", "UIManager not found in module registry.");
      return;
    }

    uiManager.addUIBlock(cameraViewTag, new UIManager.UIBlock<ExpoCameraViewInterface>() {
      @Override
      public void resolve(final ExpoCameraViewInterface cameraView) {
        final GLContext glContext = getContextWithId(exglCtxId);

        if (glContext == null) {
          promise.reject("E_GL_NO_CONTEXT", "ExponentGLObjectManager.createCameraTextureAsync: GLContext not found for given context id.");
          return;
        }

        glContext.runAsync(new Runnable() {
          @Override
          public void run() {
            GLCameraObject cameraTexture = new GLCameraObject(glContext, cameraView);

            int exglObjId = cameraTexture.getEXGLObjId();
            mGLObjects.put(exglObjId, cameraTexture);

            Bundle response = new Bundle();
            response.putInt("exglObjId", exglObjId);
            promise.resolve(response);
          }
        });
      }

      @Override
      public void reject(Throwable throwable) {
        promise.reject("E_GL_BAD_CAMERA_VIEW_TAG", "ExponentGLObjectManager.createCameraTextureAsync: Expected a CameraView", throwable);
      }
    }, ExpoCameraViewInterface.class);
  }

  @ExpoMethod
  public void takeSnapshotAsync(final int exglCtxId, final Map<String, Object> options, final Promise promise) {
    GLContext glContext = getContextWithId(exglCtxId);

    if (glContext == null) {
      promise.reject("E_GL_NO_CONTEXT", "ExponentGLObjectManager.takeSnapshotAsync: GLContext not found for given context id.");
    } else {
      glContext.takeSnapshot(options, getContext(), promise);
    }
  }

  @ExpoMethod
  public void createContextAsync(final Promise promise) {
    final GLContext glContext = new GLContext(this);

    glContext.initialize(null, new Runnable() {
      @Override
      public void run() {
        Bundle results = new Bundle();
        results.putInt("exglCtxId", glContext.getContextId());
        promise.resolve(results);
      }
    });
  }

  @ExpoMethod
  public void destroyContextAsync(final int exglCtxId, final Promise promise) {
    GLContext glContext = getContextWithId(exglCtxId);

    if (glContext != null) {
      glContext.destroy();
      promise.resolve(true);
    } else {
      promise.resolve(false);
    }
  }
}
