package expo.modules.barcodescanner;

import android.hardware.Camera;
import android.util.Log;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class ExpoBarCodeScanner {
  static final int CAMERA_TYPE_FRONT = 1;
  static final int CAMERA_TYPE_BACK = 2;

  private static ExpoBarCodeScanner ourInstance;

  private final HashMap<Integer, CameraInfoWrapper> mCameraInfos;
  private final HashMap<Integer, Integer> mCameraTypeToIndex;
  private final Set<Number> mCameras;
  private Camera mCamera = null;
  private int mActualDeviceOrientation = 0;
  private int mAdjustedDeviceOrientation = 0;

  public static ExpoBarCodeScanner getInstance() {
    return ourInstance;
  }

  public static void createInstance(int deviceOrientation) {
    ourInstance = new ExpoBarCodeScanner(deviceOrientation);
  }

  public Camera acquireCameraInstance(int type) {
    if (mCamera == null && mCameras.contains(type) && null != mCameraTypeToIndex.get(type)) {
      try {
        mCamera = Camera.open(mCameraTypeToIndex.get(type));
        adjustPreviewLayout(type);
      } catch (Exception e) {
        Log.e("ExpoBarCodeScanner", "acquireCameraInstance failed", e);
      }
    }
    return mCamera;
  }

  public void releaseCameraInstance() {
    if (null != mCamera) {
      mCamera.release();
      mCamera = null;
    }
  }

  public int getPreviewWidth(int type) {
    CameraInfoWrapper cameraInfo = mCameraInfos.get(type);
    if (null == cameraInfo) {
      return 0;
    }
    return cameraInfo.previewWidth;
  }

  public int getPreviewHeight(int type) {
    CameraInfoWrapper cameraInfo = mCameraInfos.get(type);
    if (null == cameraInfo) {
      return 0;
    }
    return cameraInfo.previewHeight;
  }

  public Camera.Size getBestSize(List<Camera.Size> supportedSizes, int maxWidth, int maxHeight) {
    Camera.Size bestSize = null;
    for (Camera.Size size : supportedSizes) {
      if (size.width > maxWidth || size.height > maxHeight) {
        continue;
      }

      if (bestSize == null) {
        bestSize = size;
        continue;
      }

      int resultArea = bestSize.width * bestSize.height;
      int newArea = size.width * size.height;

      if (newArea > resultArea) {
        bestSize = size;
      }
    }

    return bestSize;
  }

  public int getActualDeviceOrientation() {
    return mActualDeviceOrientation;
  }

  public void setAdjustedDeviceOrientation(int orientation) {
    mAdjustedDeviceOrientation = orientation;
  }
  public void setActualDeviceOrientation(int actualDeviceOrientation) {
    mActualDeviceOrientation = actualDeviceOrientation;
    adjustPreviewLayout(CAMERA_TYPE_FRONT);
    adjustPreviewLayout(CAMERA_TYPE_BACK);
  }

  public void adjustPreviewLayout(int type) {
    if (null == mCamera) {
      return;
    }

    CameraInfoWrapper cameraInfo = mCameraInfos.get(type);
    if (cameraInfo == null) {
      return;
    }

    int displayRotation;
    int rotation;
    int orientation = cameraInfo.info.orientation;
    if (cameraInfo.info.facing == Camera.CameraInfo.CAMERA_FACING_FRONT) {
      rotation = (orientation + mActualDeviceOrientation * 90) % 360;
      displayRotation = (720 - orientation - mActualDeviceOrientation * 90) % 360;
    } else {
      rotation = (orientation - mActualDeviceOrientation * 90 + 360) % 360;
      displayRotation = rotation;
    }
    cameraInfo.rotation = rotation;

    setAdjustedDeviceOrientation(rotation);
    mCamera.setDisplayOrientation(displayRotation);

    Camera.Parameters parameters = mCamera.getParameters();
    parameters.setRotation(cameraInfo.rotation);

    // set preview size
    // defaults to highest resolution available
    Camera.Size optimalPreviewSize = getBestSize(parameters.getSupportedPreviewSizes(), Integer.MAX_VALUE, Integer.MAX_VALUE);
    int width = optimalPreviewSize.width;
    int height = optimalPreviewSize.height;

    parameters.setPreviewSize(width, height);
    try {
      mCamera.setParameters(parameters);
    } catch (Exception e) {
      e.printStackTrace();
    }

    if (cameraInfo.rotation == 0 || cameraInfo.rotation == 180) {
      cameraInfo.previewWidth = width;
      cameraInfo.previewHeight = height;
    } else {
      cameraInfo.previewWidth = height;
      cameraInfo.previewHeight = width;
    }
  }

  private ExpoBarCodeScanner(int deviceOrientation) {
    mCameras = new HashSet<>();
    mCameraInfos = new HashMap<>();
    mCameraTypeToIndex = new HashMap<>();

    mActualDeviceOrientation = deviceOrientation;

    // map camera types to camera indexes and collect cameras properties
    for (int i = 0; i < Camera.getNumberOfCameras(); i++) {
      Camera.CameraInfo info = new Camera.CameraInfo();
      Camera.getCameraInfo(i, info);
      if (info.facing == Camera.CameraInfo.CAMERA_FACING_FRONT && mCameraInfos.get(CAMERA_TYPE_FRONT) == null) {
        mCameraInfos.put(CAMERA_TYPE_FRONT, new CameraInfoWrapper(info));
        mCameraTypeToIndex.put(CAMERA_TYPE_FRONT, i);
        mCameras.add(CAMERA_TYPE_FRONT);
      } else if (info.facing == Camera.CameraInfo.CAMERA_FACING_BACK && mCameraInfos.get(CAMERA_TYPE_BACK) == null) {
        mCameraInfos.put(CAMERA_TYPE_BACK, new CameraInfoWrapper(info));
        mCameraTypeToIndex.put(CAMERA_TYPE_BACK, i);
        mCameras.add(CAMERA_TYPE_BACK);
      }
    }
  }

  private class CameraInfoWrapper {
    public final Camera.CameraInfo info;
    public int rotation = 0;
    public int previewWidth = -1;
    public int previewHeight = -1;

    public CameraInfoWrapper(Camera.CameraInfo info) {
      this.info = info;
    }
  }
}
