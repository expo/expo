package expo.modules.camera;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.media.CamcorderProfile;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.support.v4.content.ContextCompat;
import android.util.Log;
import android.view.View;

import com.google.android.cameraview.CameraView;
import com.google.android.gms.vision.barcode.Barcode;
import com.google.android.gms.vision.barcode.BarcodeDetector;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

import expo.core.interfaces.LifecycleEventListener;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.services.EventEmitter;
import expo.core.interfaces.services.UIManager;
import expo.interfaces.facedetector.FaceDetector;
import expo.interfaces.facedetector.FaceDetectorProvider;
import expo.interfaces.filesystem.FileSystem;
import expo.modules.camera.tasks.BarCodeScannerAsyncTask;
import expo.modules.camera.tasks.BarCodeScannerAsyncTaskDelegate;
import expo.modules.camera.tasks.FaceDetectorAsyncTask;
import expo.modules.camera.tasks.FaceDetectorAsyncTaskDelegate;
import expo.modules.camera.tasks.ResolveTakenPictureAsyncTask;
import expo.modules.camera.utils.ImageDimensions;

public class ExpoCameraView extends CameraView implements LifecycleEventListener, BarCodeScannerAsyncTaskDelegate, FaceDetectorAsyncTaskDelegate {
  private static final String MUTE_KEY = "mute";
  private static final String QUALITY_KEY = "quality";
  private static final String MAX_DURATION_KEY = "maxDuration";
  private static final String MAX_FILE_SIZE_KEY = "maxFileSize";
  private Context mThemedReactContext;

  private Queue<Promise> mPictureTakenPromises = new ConcurrentLinkedQueue<>();
  private Map<Promise, Map<String, Object>> mPictureTakenOptions = new ConcurrentHashMap<>();
  private Map<Promise, File> mPictureTakenDirectories = new ConcurrentHashMap<>();
  private Promise mVideoRecordedPromise;
  private List<Integer> mBarCodeTypes = null;

  private boolean mIsPaused = false;
  private boolean mIsNew = true;

  // Concurrency lock for scanners to avoid flooding the runtime
  public volatile boolean barCodeScannerTaskLock = false;
  public volatile boolean faceDetectorTaskLock = false;

  // Scanning-related properties
  private BarcodeDetector mDetector;
  private FaceDetector mFaceDetector;
  private boolean mShouldDetectFaces = false;
  private boolean mShouldScanBarCodes = false;

  private ModuleRegistry mModuleRegistry;

  public ExpoCameraView(Context themedReactContext, ModuleRegistry moduleRegistry) {
    super(themedReactContext, true);
    mModuleRegistry = moduleRegistry;
    mThemedReactContext = themedReactContext;
    initBarcodeReader();
    FaceDetectorProvider faceDetectorProvider = moduleRegistry.getModule(FaceDetectorProvider.class);
    if (faceDetectorProvider != null) {
      mFaceDetector = faceDetectorProvider.createFaceDetectorWithContext(themedReactContext);
    }

    mModuleRegistry.getModule(UIManager.class).registerLifecycleEventListener(this);

    addCallback(new Callback() {
      @Override
      public void onCameraOpened(CameraView cameraView) {
        CameraViewHelper.emitCameraReadyEvent(mModuleRegistry.getModule(EventEmitter.class), cameraView);
      }

      @Override
      public void onMountError(CameraView cameraView) {
        CameraViewHelper.emitMountErrorEvent(mModuleRegistry.getModule(EventEmitter.class), cameraView, "Camera component could not be rendered - is there any other instance running?");
      }

      @Override
      public void onPictureTaken(CameraView cameraView, final byte[] data) {
        Promise promise = mPictureTakenPromises.poll();
        final File cacheDirectory = mPictureTakenDirectories.remove(promise);
        Map<String, Object> options = mPictureTakenOptions.remove(promise);
        FileSystem fileSystem = mModuleRegistry.getModule(FileSystem.class);
        if (fileSystem == null) {
          promise.reject("E_MODULE_REGISTRY", "No filesystem module avialable.");
        } else {
          new ResolveTakenPictureAsyncTask(data, promise, options, cacheDirectory, fileSystem).execute();
        }
      }

      @Override
      public void onVideoRecorded(CameraView cameraView, String path) {
        if (mVideoRecordedPromise != null) {
          if (path != null) {
            Bundle result = new Bundle();
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
        int correctRotation = CameraViewHelper.getCorrectCameraRotation(rotation, getFacing());

        if (mShouldScanBarCodes && !barCodeScannerTaskLock && cameraView instanceof BarCodeScannerAsyncTaskDelegate) {
          barCodeScannerTaskLock = true;
          BarCodeScannerAsyncTaskDelegate delegate = (BarCodeScannerAsyncTaskDelegate) cameraView;
          new BarCodeScannerAsyncTask(delegate, mDetector, data, width, height).execute();
        }

        if (mShouldDetectFaces && !faceDetectorTaskLock && cameraView instanceof FaceDetectorAsyncTaskDelegate) {
          faceDetectorTaskLock = true;
          float density = cameraView.getResources().getDisplayMetrics().density;

          ImageDimensions dimensions = new ImageDimensions(width, height, correctRotation, getFacing());
          double scaleX = (double) cameraView.getWidth() / (dimensions.getWidth() * density);
          double scaleY = (double) cameraView.getHeight() / (dimensions.getHeight() * density);

          FaceDetectorAsyncTaskDelegate delegate = (FaceDetectorAsyncTaskDelegate) cameraView;
          new FaceDetectorAsyncTask(delegate, mFaceDetector, data, width, height, correctRotation, getFacing(), scaleX, scaleY).execute();
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

  public void takePicture(Map<String, Object> options, final Promise promise, File cacheDirectory) {
    mPictureTakenPromises.add(promise);
    mPictureTakenOptions.put(promise, options);
    mPictureTakenDirectories.put(promise, cacheDirectory);
    super.takePicture();
  }

  public void record(Map<String, Object> options, final Promise promise, File cacheDirectory) {
    try {
      FileSystem fileSystem = mModuleRegistry.getModule(FileSystem.class);
      String path = fileSystem.generateOutputPath(cacheDirectory, "Camera", ".mp4");
      int maxDuration = -1;
      if (options.get(MAX_DURATION_KEY) != null) {
        maxDuration = (Integer) options.get(MAX_DURATION_KEY);
      }

      int maxFileSize = -1;
      if (options.get(MAX_FILE_SIZE_KEY) != null) {
        maxFileSize = (Integer) options.get(MAX_FILE_SIZE_KEY);
      }

      CamcorderProfile profile = CamcorderProfile.get(CamcorderProfile.QUALITY_HIGH);
      if (options.get(QUALITY_KEY) != null) {
        profile = CameraViewHelper.getCamcorderProfile((Integer) options.get(QUALITY_KEY));
      }

      Boolean muteValue = (Boolean) options.get(MUTE_KEY);
      boolean recordAudio = muteValue == null || !muteValue;

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
    int barcodeFormats = 0;
    if (mBarCodeTypes != null) {
      for (Integer code : mBarCodeTypes) {
        barcodeFormats = barcodeFormats | code;
      }
    }

    mDetector = new BarcodeDetector.Builder(mThemedReactContext)
        .setBarcodeFormats(barcodeFormats)
        .build();
    if (!mDetector.isOperational()) {
      Log.w("ExpoCameraView", "Could not start barcode scanner.");
    }
  }

  public void setShouldScanBarCodes(boolean shouldScanBarCodes) {
    this.mShouldScanBarCodes = shouldScanBarCodes;
    setScanning(mShouldScanBarCodes || mShouldDetectFaces);
  }

  public void onBarCodeRead(Barcode barCode) {
    int barCodeType = barCode.format;
    if (!mShouldScanBarCodes || !mBarCodeTypes.contains(barCodeType)) {
      return;
    }

    CameraViewHelper.emitBarCodeReadEvent(mModuleRegistry.getModule(EventEmitter.class), this, barCode);
  }

  public void onBarCodeScanningTaskCompleted() {
    barCodeScannerTaskLock = false;
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
      CameraViewHelper.emitMountErrorEvent(mModuleRegistry.getModule(EventEmitter.class), this,  "Camera permissions not granted - component could not be rendered.");
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

  public void setShouldDetectFaces(boolean shouldDetectFaces) {
    mShouldDetectFaces = shouldDetectFaces;
    setScanning(mShouldScanBarCodes || mShouldDetectFaces);
  }

  public void setFaceDetectorSettings(Map<String, Object> settings) {
    if (mFaceDetector != null) {
      mFaceDetector.setSettings(settings);
    }
  }

  @Override
  public void onFacesDetected(List<Bundle> facesReported) {
    if (!mShouldDetectFaces) {
      return;
    }

    List<Bundle> facesDetected = facesReported == null ? new ArrayList<Bundle>() : facesReported;
    CameraViewHelper.emitFacesDetectedEvent(mModuleRegistry.getModule(EventEmitter.class), this, facesDetected);
  }

  @Override
  public void onFaceDetectionError(FaceDetector faceDetector) {
    if (!mShouldDetectFaces) {
      return;
    }

    CameraViewHelper.emitFaceDetectionErrorEvent(mModuleRegistry.getModule(EventEmitter.class), this, faceDetector);
  }

  @Override
  public void onFaceDetectingTaskCompleted() {
    faceDetectorTaskLock = false;
  }
}
