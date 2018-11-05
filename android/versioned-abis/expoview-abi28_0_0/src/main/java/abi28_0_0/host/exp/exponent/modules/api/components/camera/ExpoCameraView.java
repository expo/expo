package abi28_0_0.host.exp.exponent.modules.api.components.camera;

import android.Manifest;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.media.CamcorderProfile;
import android.net.Uri;
import android.os.Build;
import android.support.v4.content.ContextCompat;
import android.util.SparseArray;
import android.view.View;

import abi28_0_0.com.facebook.react.bridge.Arguments;
import abi28_0_0.com.facebook.react.bridge.LifecycleEventListener;
import abi28_0_0.com.facebook.react.bridge.Promise;
import abi28_0_0.com.facebook.react.bridge.ReadableMap;
import abi28_0_0.com.facebook.react.bridge.WritableMap;
import abi28_0_0.com.facebook.react.uimanager.ThemedReactContext;
import com.google.android.cameraview.CameraView;
import com.google.android.gms.vision.face.Face;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

import host.exp.exponent.utils.ExpFileUtils;
import abi28_0_0.host.exp.exponent.modules.api.components.camera.utils.ExpoBarCodeDetector;
import abi28_0_0.host.exp.exponent.modules.api.components.camera.utils.GMVBarCodeDetector;
import abi28_0_0.host.exp.exponent.modules.api.components.camera.utils.ZxingBarCodeDetector;
import abi28_0_0.host.exp.exponent.modules.api.components.camera.tasks.BarCodeScannerAsyncTask;
import abi28_0_0.host.exp.exponent.modules.api.components.camera.tasks.BarCodeScannerAsyncTaskDelegate;
import abi28_0_0.host.exp.exponent.modules.api.components.camera.tasks.FaceDetectorAsyncTask;
import abi28_0_0.host.exp.exponent.modules.api.components.camera.tasks.FaceDetectorAsyncTaskDelegate;
import abi28_0_0.host.exp.exponent.modules.api.components.camera.tasks.PictureSavedDelegate;
import abi28_0_0.host.exp.exponent.modules.api.components.camera.tasks.ResolveTakenPictureAsyncTask;
import abi28_0_0.host.exp.exponent.modules.api.components.camera.utils.ImageDimensions;
import abi28_0_0.host.exp.exponent.modules.api.components.facedetector.ExpoFaceDetector;

public class ExpoCameraView extends CameraView implements LifecycleEventListener, BarCodeScannerAsyncTaskDelegate,
    FaceDetectorAsyncTaskDelegate, PictureSavedDelegate {
  private ThemedReactContext mThemedReactContext;

  private Queue<Promise> mPictureTakenPromises = new ConcurrentLinkedQueue<>();
  private Map<Promise, ReadableMap> mPictureTakenOptions = new ConcurrentHashMap<>();
  private Map<Promise, File> mPictureTakenDirectories = new ConcurrentHashMap<>();
  private Promise mVideoRecordedPromise;
  private List<Integer> mBarCodeTypes = null;

  private boolean mIsPaused = false;
  private boolean mIsNew = true;

  // Concurrency lock for scanners to avoid flooding the runtime
  public volatile boolean barCodeScannerTaskLock = false;
  public volatile boolean faceDetectorTaskLock = false;

  // Scanning-related properties
  private ExpoBarCodeDetector mDetector;
  private final ExpoFaceDetector mFaceDetector;
  private boolean mShouldDetectFaces = false;
  private boolean mShouldScanBarCodes = false;
  private int mFaceDetectorMode = ExpoFaceDetector.FAST_MODE;
  private int mFaceDetectionLandmarks = ExpoFaceDetector.NO_LANDMARKS;
  private int mFaceDetectionClassifications = ExpoFaceDetector.NO_CLASSIFICATIONS;

  public ExpoCameraView(ThemedReactContext themedReactContext) {
    super(themedReactContext, true);
    mThemedReactContext = themedReactContext;
    initBarcodeReader();
    mFaceDetector = new ExpoFaceDetector(themedReactContext);
    setupFaceDetector();
    themedReactContext.addLifecycleEventListener(this);

    addCallback(new Callback() {
      @Override
      public void onCameraOpened(CameraView cameraView) {
        ExpoCameraViewHelper.emitCameraReadyEvent(cameraView);
      }

      @Override
      public void onMountError(CameraView cameraView) {
        ExpoCameraViewHelper.emitMountErrorEvent(cameraView, "Camera component could not be rendered - is there any other instance running?");
      }

      @Override
      public void onPictureTaken(CameraView cameraView, final byte[] data) {
        Promise promise = mPictureTakenPromises.poll();
        ReadableMap options = mPictureTakenOptions.remove(promise);
        if (options.hasKey("fastMode") && options.getBoolean("fastMode")) {
          promise.resolve(null);
        }
        final File cacheDirectory = mPictureTakenDirectories.remove(promise);
        new ResolveTakenPictureAsyncTask(data, promise, options, cacheDirectory, ExpoCameraView.this).execute();
      }

      @Override
      public void onVideoRecorded(CameraView cameraView, String path) {
        if (mVideoRecordedPromise != null) {
          if (path != null) {
            WritableMap result = Arguments.createMap();
            result.putString("uri", Uri.fromFile(new File(path)).toString());
            mVideoRecordedPromise.resolve(result);
          } else {
            mVideoRecordedPromise.reject("E_RECORDING", "Couldn't stop recording - there is none in progress");
          }
          mVideoRecordedPromise = null;
        }
      }

      @Override
      public void onFramePreview(CameraView cameraView, byte[] data, int width, int height, int rotation) {
        int correctRotation = ExpoCameraViewHelper.getCorrectCameraRotation(rotation, getFacing());

        if (mShouldScanBarCodes && !barCodeScannerTaskLock && cameraView instanceof BarCodeScannerAsyncTaskDelegate) {
          barCodeScannerTaskLock = true;
          BarCodeScannerAsyncTaskDelegate delegate = (BarCodeScannerAsyncTaskDelegate) cameraView;
          new BarCodeScannerAsyncTask(delegate, mDetector, data, width, height, rotation).execute();
        }

        if (mShouldDetectFaces && !faceDetectorTaskLock && cameraView instanceof FaceDetectorAsyncTaskDelegate) {
          faceDetectorTaskLock = true;
          FaceDetectorAsyncTaskDelegate delegate = (FaceDetectorAsyncTaskDelegate) cameraView;
          new FaceDetectorAsyncTask(delegate, mFaceDetector, data, width, height, correctRotation).execute();
        }
      }
    });
  }

  @Override
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    View preview = getView();
    if (null == preview) {
      return;
    }
    this.setBackgroundColor(Color.BLACK);
    int width = right - left;
    int height = bottom - top;
    preview.layout(0, 0, width, height);
  }

  @Override
  public void requestLayout() {
    // React handles this for us, so we don't need to call super.requestLayout();
  }

  @Override
  public void onViewAdded(View child) {
    if (this.getView() == child || this.getView() == null) return;
    // remove and readd view to make sure it is in the back.
    // @TODO figure out why there was a z order issue in the first place and fix accordingly.
    this.removeView(this.getView());
    this.addView(this.getView(), 0);
  }

  public void setBarCodeTypes(List<Integer> barCodeTypes) {
    mBarCodeTypes = barCodeTypes;
    initBarcodeReader();
  }

  public void takePicture(ReadableMap options, final Promise promise, File cacheDirectory) {
    mPictureTakenPromises.add(promise);
    mPictureTakenOptions.put(promise, options);
    mPictureTakenDirectories.put(promise, cacheDirectory);
    try {
      super.takePicture();
    } catch (Exception e) {
      mPictureTakenPromises.remove(promise);
      mPictureTakenOptions.remove(promise);
      mPictureTakenDirectories.remove(promise);
      throw e;
    }
  }

  @Override
  public void onPictureSaved(WritableMap response) {
    ExpoCameraViewHelper.emitPictureSavedEvent(this, response);
  }

  public void record(ReadableMap options, final Promise promise, File cacheDirectory) {
    try {
      String path = ExpFileUtils.generateOutputPath(cacheDirectory, "Camera", ".mp4");
      int maxDuration = options.hasKey("maxDuration") ? options.getInt("maxDuration") : -1;
      int maxFileSize = options.hasKey("maxFileSize") ? options.getInt("maxFileSize") : -1;

      CamcorderProfile profile = CamcorderProfile.get(CamcorderProfile.QUALITY_HIGH);
      if (options.hasKey("quality")) {
        profile = ExpoCameraViewHelper.getCamcorderProfile(options.getInt("quality"));
      }

      boolean recordAudio = !options.hasKey("mute");

      if (super.record(path, maxDuration * 1000, maxFileSize, recordAudio, profile)) {
        mVideoRecordedPromise = promise;
      } else {
        promise.reject("E_RECORDING_FAILED", "Starting video recording failed. Another recording might be in progress.");
      }
    } catch (IOException e) {
      promise.reject("E_RECORDING_FAILED", "Starting video recording failed - could not create video file.");
    }
  }

  /**
   * Initialize the barcode decoder.
   * Supports all iOS codes except [code138, code39mod43, itf14]
   * Additionally supports [codabar, code128, maxicode, rss14, rssexpanded, upc_a, upc_ean]
   */
  private void initBarcodeReader() {
    mDetector = new GMVBarCodeDetector(mBarCodeTypes, mThemedReactContext);
    if (!mDetector.isAvailable()) {
       mDetector = new ZxingBarCodeDetector(mBarCodeTypes, mThemedReactContext);
    }
  }

  public void setShouldScanBarCodes(boolean shouldScanBarCodes) {
    this.mShouldScanBarCodes = shouldScanBarCodes;
    setScanning(mShouldDetectFaces || mShouldScanBarCodes);
  }

  public void onBarCodeRead(ExpoBarCodeDetector.Result barCode) {
    int barCodeType = barCode.getType();
    if (!mShouldScanBarCodes || !mBarCodeTypes.contains(barCodeType)) {
      return;
    }

    ExpoCameraViewHelper.emitBarCodeReadEvent(this, barCode);
  }

  public void onBarCodeScanningTaskCompleted() {
    barCodeScannerTaskLock = false;
  }

  /**
   * Initial setup of the face detector
   */
  private void setupFaceDetector() {
    mFaceDetector.setMode(mFaceDetectorMode);
    mFaceDetector.setLandmarkType(mFaceDetectionLandmarks);
    mFaceDetector.setClassificationType(mFaceDetectionClassifications);
    mFaceDetector.setTracking(true);
  }

  public void setFaceDetectionLandmarks(int landmarks) {
    mFaceDetectionLandmarks = landmarks;
    if (mFaceDetector != null) {
      mFaceDetector.setLandmarkType(landmarks);
    }
  }

  public void setFaceDetectionClassifications(int classifications) {
    mFaceDetectionClassifications = classifications;
    if (mFaceDetector != null) {
      mFaceDetector.setClassificationType(classifications);
    }
  }

  public void setFaceDetectionMode(int mode) {
    mFaceDetectorMode = mode;
    if (mFaceDetector != null) {
      mFaceDetector.setMode(mode);
    }
  }

  public void setShouldDetectFaces(boolean shouldDetectFaces) {
    this.mShouldDetectFaces = shouldDetectFaces;
    setScanning(mShouldDetectFaces || mShouldScanBarCodes);
  }

  public void onFacesDetected(SparseArray<Face> facesReported, int sourceWidth, int sourceHeight, int sourceRotation) {
    if (!mShouldDetectFaces) {
      return;
    }

    SparseArray<Face> facesDetected = facesReported == null ? new SparseArray<Face>() : facesReported;

    ImageDimensions dimensions = new ImageDimensions(sourceWidth, sourceHeight, sourceRotation, getFacing());
    ExpoCameraViewHelper.emitFacesDetectedEvent(this, facesDetected, dimensions);
  }

  public void onFaceDetectionError(ExpoFaceDetector faceDetector) {
    if (!mShouldDetectFaces) {
      return;
    }

    ExpoCameraViewHelper.emitFaceDetectionErrorEvent(this, faceDetector);
  }

  @Override
  public void onFaceDetectingTaskCompleted() {
    faceDetectorTaskLock = false;
  }

  @Override
  public void onHostResume() {
    if (hasCameraPermissions()) {
      if ((mIsPaused && !isCameraOpened()) || mIsNew) {
        mIsPaused = false;
        mIsNew = false;
        if (!Build.FINGERPRINT.contains("generic")) {
          start();
        }
      }
    } else {
      ExpoCameraViewHelper.emitMountErrorEvent(this,  "Camera permissions not granted - component could not be rendered.");
    }
  }

  @Override
  public void onHostPause() {
    if (!mIsPaused && isCameraOpened()) {
      mIsPaused = true;
      stop();
    }
  }

  @Override
  public void onHostDestroy() {
    mFaceDetector.release();
    stop();
  }

  private boolean hasCameraPermissions() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      int result = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.CAMERA);
      return result == PackageManager.PERMISSION_GRANTED;
    } else {
      return true;
    }
  }
}
