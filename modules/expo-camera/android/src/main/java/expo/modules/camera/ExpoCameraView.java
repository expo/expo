package expo.modules.camera;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.media.CamcorderProfile;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;

import com.google.android.cameraview.CameraView;
import com.google.android.cameraview.Size;

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
import expo.interfaces.barcodescanner.BarCodeScanner;
import expo.interfaces.barcodescanner.BarCodeScannerProvider;
import expo.interfaces.barcodescanner.BarCodeScannerResult;
import expo.interfaces.barcodescanner.BarCodeScannerSettings;
import expo.interfaces.camera.ExpoCameraViewInterface;
import expo.interfaces.facedetector.FaceDetector;
import expo.interfaces.facedetector.FaceDetectorProvider;
import expo.interfaces.permissions.Permissions;
import expo.modules.camera.tasks.BarCodeScannerAsyncTask;
import expo.modules.camera.tasks.BarCodeScannerAsyncTaskDelegate;
import expo.modules.camera.tasks.FaceDetectorAsyncTask;
import expo.modules.camera.tasks.FaceDetectorAsyncTaskDelegate;
import expo.modules.camera.tasks.PictureSavedDelegate;
import expo.modules.camera.tasks.ResolveTakenPictureAsyncTask;
import expo.modules.camera.utils.FileSystemUtils;
import expo.modules.camera.utils.ImageDimensions;

public class ExpoCameraView extends CameraView implements LifecycleEventListener, BarCodeScannerAsyncTaskDelegate, FaceDetectorAsyncTaskDelegate, PictureSavedDelegate, ExpoCameraViewInterface {
  private static final String MUTE_KEY = "mute";
  private static final String QUALITY_KEY = "quality";
  private static final String FAST_MODE_KEY = "fastMode";
  private static final String MAX_DURATION_KEY = "maxDuration";
  private static final String MAX_FILE_SIZE_KEY = "maxFileSize";

  private Queue<Promise> mPictureTakenPromises = new ConcurrentLinkedQueue<>();
  private Map<Promise, Map<String, Object>> mPictureTakenOptions = new ConcurrentHashMap<>();
  private Map<Promise, File> mPictureTakenDirectories = new ConcurrentHashMap<>();
  private Promise mVideoRecordedPromise;

  private boolean mIsPaused = false;
  private boolean mIsNew = true;

  // Concurrency lock for scanners to avoid flooding the runtime
  public volatile boolean barCodeScannerTaskLock = false;
  public volatile boolean faceDetectorTaskLock = false;

  // Scanning-related properties
  private BarCodeScanner mBarCodeScanner;
  private FaceDetector mFaceDetector;
  private boolean mShouldDetectFaces = false;
  private boolean mShouldScanBarCodes = false;

  private ModuleRegistry mModuleRegistry;

  public ExpoCameraView(Context themedReactContext, ModuleRegistry moduleRegistry) {
    super(themedReactContext, true);
    mModuleRegistry = moduleRegistry;
    initBarCodeScanner();

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

        if (options.containsKey(FAST_MODE_KEY) && (Boolean) options.get(FAST_MODE_KEY)) {
          promise.resolve(null);
        }

        new ResolveTakenPictureAsyncTask(data, promise, options, cacheDirectory, ExpoCameraView.this).execute();
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
          new BarCodeScannerAsyncTask(delegate, mBarCodeScanner, data, width, height, rotation).execute();
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

  public void takePicture(Map<String, Object> options, final Promise promise, File cacheDirectory) {
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
  public void onPictureSaved(Bundle response) {
    CameraViewHelper.emitPictureSavedEvent(mModuleRegistry.getModule(EventEmitter.class), this, response);
  }

  public void record(Map<String, Object> options, final Promise promise, File cacheDirectory) {
    try {
      String path = FileSystemUtils.generateOutputPath(cacheDirectory, "Camera", ".mp4");
      double maxDuration = -1;
      if (options.get(MAX_DURATION_KEY) != null) {
        maxDuration = (double) options.get(MAX_DURATION_KEY);
      }

      double maxFileSize = -1;
      if (options.get(MAX_FILE_SIZE_KEY) != null) {
        maxFileSize = (double) options.get(MAX_FILE_SIZE_KEY);
      }

      CamcorderProfile profile = CamcorderProfile.get(getCameraId(), CamcorderProfile.QUALITY_HIGH);
      if (options.get(QUALITY_KEY) != null) {
        profile = CameraViewHelper.getCamcorderProfile(getCameraId(), ((Double) options.get(QUALITY_KEY)).intValue());
      }

      Boolean muteValue = (Boolean) options.get(MUTE_KEY);
      boolean recordAudio = muteValue == null || !muteValue;

      if (super.record(path, (int) maxDuration * 1000, (int) maxFileSize, recordAudio, profile)) {
        mVideoRecordedPromise = promise;
      } else {
        promise.reject("E_RECORDING_FAILED", "Starting video recording failed. Another recording might be in progress.");
      }
    } catch (IOException e) {
      promise.reject("E_RECORDING_FAILED", "Starting video recording failed - could not create video file.");
    }
  }

  /**
   * Initialize the barcode scanner.
   * Supports all iOS codes except [code138, code39mod43, itf14]
   * Additionally supports [codabar, code128, maxicode, rss14, rssexpanded, upc_a, upc_ean]
   */
  private void initBarCodeScanner() {
    BarCodeScannerProvider barCodeScannerProvider = mModuleRegistry.getModule(BarCodeScannerProvider.class);
    if (barCodeScannerProvider != null) {
      mBarCodeScanner = barCodeScannerProvider.createBarCodeDetectorWithContext(getContext());
    }
  }

  public void setShouldScanBarCodes(boolean shouldScanBarCodes) {
    this.mShouldScanBarCodes = shouldScanBarCodes;
    setScanning(mShouldScanBarCodes || mShouldDetectFaces);
  }

  public void setBarCodeScannerSettings(BarCodeScannerSettings settings) {
    if (mBarCodeScanner != null) {
      mBarCodeScanner.setSettings(settings);
    }
  }

  @Override
  public void onBarCodeScanned(BarCodeScannerResult barCode) {
    if (!mShouldScanBarCodes) {
      return;
    }

    CameraViewHelper.emitBarCodeReadEvent(mModuleRegistry.getModule(EventEmitter.class), this, barCode);
  }

  public void onBarCodeScanningTaskCompleted() {
    barCodeScannerTaskLock = false;
  }

  public int[] getPreviewSizeAsArray() {
    Size previewSize = getPreviewSize();
    return new int[]{previewSize.getWidth(), previewSize.getHeight()};
  }

  @Override
  public void onHostResume() {
    if (hasCameraPermissions()) {
      if ((mIsPaused && !isCameraOpened()) || mIsNew) {
        mIsPaused = false;
        mIsNew = false;
        if (!Build.FINGERPRINT.contains("generic")) {
          start();

          FaceDetectorProvider faceDetectorProvider = mModuleRegistry.getModule(FaceDetectorProvider.class);
          if (faceDetectorProvider != null) {
            mFaceDetector = faceDetectorProvider.createFaceDetectorWithContext(getContext());
          }
        }
      }
    } else {
      CameraViewHelper.emitMountErrorEvent(mModuleRegistry.getModule(EventEmitter.class), this,  "Camera permissions not granted - component could not be rendered.");
    }
  }

  @Override
  public void onHostPause() {
    if (!mIsPaused && isCameraOpened()) {
      if (mFaceDetector != null) {
        mFaceDetector.release();
      }
      mIsPaused = true;
      stop();
    }
  }

  @Override
  public void onHostDestroy() {
    if (mFaceDetector != null) {
      mFaceDetector.release();
    }
    stop();
  }

  private boolean hasCameraPermissions() {
    int[] permissions = mModuleRegistry.getModule(Permissions.class).getPermissions(new String[]{ Manifest.permission.CAMERA });
    return permissions.length == 1 && permissions[0] == PackageManager.PERMISSION_GRANTED;
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
