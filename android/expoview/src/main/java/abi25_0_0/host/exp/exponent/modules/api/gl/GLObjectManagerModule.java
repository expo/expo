// Copyright 2017-present 650 Industries. All rights reserved.

package abi25_0_0.host.exp.exponent.modules.api.gl;

import android.graphics.SurfaceTexture;
import android.hardware.Camera;
import android.util.SparseArray;

import static android.opengl.GLES11Ext.GL_TEXTURE_EXTERNAL_OES;
import static android.opengl.GLES20.*;
import static expo.modules.gl.cpp.EXGL.*;

import abi25_0_0.com.facebook.react.bridge.Arguments;
import abi25_0_0.com.facebook.react.bridge.Promise;
import abi25_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi25_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi25_0_0.com.facebook.react.bridge.ReactMethod;
import abi25_0_0.com.facebook.react.bridge.ReadableMap;
import abi25_0_0.com.facebook.react.bridge.WritableMap;

import java.io.IOException;

import host.exp.exponent.analytics.EXL;

class GLObject implements SurfaceTexture.OnFrameAvailableListener {
  private int exglCtxId;
  private int exglObjId;

  private SurfaceTexture mCameraSurfaceTexture;
  private Camera mCamera;

  // Must be constructed on GL thread!
  GLObject(ReadableMap config) {
    // Generic

    exglCtxId = config.getInt("exglCtxId");
    exglObjId = EXGLContextCreateObject(exglCtxId);

    // Texture

    if (config.hasKey("texture")) {
      ReadableMap textureConfig = config.getMap("texture");

      // Camera

      if (textureConfig.hasKey("camera")) {
        ReadableMap cameraConfig = textureConfig.getMap("camera");
        int facing = cameraConfig.hasKey("position") && cameraConfig.getString("position").equals("front") ?
            Camera.CameraInfo.CAMERA_FACING_FRONT : Camera.CameraInfo.CAMERA_FACING_BACK;

        int[] textures = new int[1];
        glGenTextures(1, textures, 0);
        EXGLContextMapObject(exglCtxId, exglObjId, textures[0]);

        glBindTexture(GL_TEXTURE_EXTERNAL_OES, textures[0]);
        glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
        glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
        glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_MIN_FILTER, GL_LINEAR);

        mCameraSurfaceTexture = new SurfaceTexture(textures[0]);
        mCameraSurfaceTexture.setOnFrameAvailableListener(this);

        int cameraCount = 0;
        Camera.CameraInfo cameraInfo = new Camera.CameraInfo();
        cameraCount = Camera.getNumberOfCameras();
        for (int i = 0; i < cameraCount; i++) {
          Camera.getCameraInfo(i, cameraInfo);
          if (cameraInfo.facing == facing) {
            try {
              mCamera = Camera.open(i);
              break;
            } catch (RuntimeException ignored) {
            }
          }
        }

        if (mCamera == null) {
          EXL.e("EXGL", "Couldn't open suitable camera.");
          return;
        }

        try {
          mCamera.setPreviewTexture(mCameraSurfaceTexture);
        } catch (IOException e) {
          EXL.e("EXGL", "Couldn't set preview texture for camera.");
        }

        mCamera.startPreview();
      }
    }
  }

  @Override
  public void onFrameAvailable(SurfaceTexture surfaceTexture) {
    GLView.runOnGLThread(exglCtxId, new Runnable() {
      @Override
      public void run() {
        if (mCameraSurfaceTexture != null) {
          mCameraSurfaceTexture.updateTexImage();
        }
      }
    });
  }

  int getEXGLObjId() {
    return exglObjId;
  }

  void destroy() {
    // Camera texture

    if (mCameraSurfaceTexture != null) {
      mCameraSurfaceTexture.release();
      mCameraSurfaceTexture = null;
    }

    if (mCamera != null) {
      mCamera.stopPreview();
      mCamera.release();
    }

    // Generic

    EXGLContextDestroyObject(exglCtxId, exglObjId);
  }
}

public class GLObjectManagerModule extends ReactContextBaseJavaModule {
  private SparseArray<GLObject> mGLObjects = new SparseArray<>();

  public GLObjectManagerModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ExponentGLObjectManager";
  }

  @ReactMethod
  public void createObjectAsync(final ReadableMap config, final Promise promise) {
    int exglCtxId = config.getInt("exglCtxId");
    GLView.runOnGLThread(exglCtxId, new Runnable() {
      @Override
      public void run() {
        GLObject glObject = new GLObject(config);
        int exglObjId = glObject.getEXGLObjId();
        mGLObjects.put(exglObjId, glObject);

        WritableMap response = Arguments.createMap();
        response.putInt("exglObjId", exglObjId);
        promise.resolve(response);
      }
    });
  }

  @ReactMethod
  public void destroyObjectAsync(final int exglObjId) {
    GLObject glObject = mGLObjects.get(exglObjId);
    if (glObject != null) {
      mGLObjects.remove(exglObjId);
      glObject.destroy();
    }
  }
}
