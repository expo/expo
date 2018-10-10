package expo.modules.barcodescanner;

import android.content.Context;
import android.graphics.SurfaceTexture;
import android.hardware.Camera;
import android.os.AsyncTask;
import android.os.Handler;
import android.os.Looper;
import android.view.TextureView;

import java.util.List;

import expo.core.ModuleRegistry;
import expo.interfaces.barcodescanner.BarCodeScanner;
import expo.interfaces.barcodescanner.BarCodeScannerProvider;
import expo.interfaces.barcodescanner.BarCodeScannerResult;
import expo.interfaces.barcodescanner.BarCodeScannerSettings;

class BarCodeScannerViewFinder extends TextureView implements TextureView.SurfaceTextureListener, Camera.PreviewCallback {
  private final ModuleRegistry mModuleRegistry;
  private int mCameraType;
  private SurfaceTexture mSurfaceTexture;
  private boolean mIsStarting;
  private boolean mIsStopping;
  private boolean mIsChanging;
  private BarCodeScannerView mBarCodeScannerView;
  private Camera mCamera;

  // Concurrency lock for barcode scanner to avoid flooding the runtime
  public static volatile boolean barCodeScannerTaskLock = false;

  // Scanner instance for the barcode scanning
  private BarCodeScanner mBarCodeScanner;

  public BarCodeScannerViewFinder(Context context, int type, BarCodeScannerView barCodeScannerView, ModuleRegistry moduleRegistry) {
    super(context);
    mModuleRegistry = moduleRegistry;
    mCameraType = type;
    mBarCodeScannerView = barCodeScannerView;
    setSurfaceTextureListener(this);
    initBarCodeScanner();
  }

  @Override
  public void onSurfaceTextureAvailable(SurfaceTexture surface, int width, int height) {
    mSurfaceTexture = surface;
    startCamera();
  }

  @Override
  public void onSurfaceTextureSizeChanged(SurfaceTexture surface, int width, int height) {
  }

  @Override
  public boolean onSurfaceTextureDestroyed(SurfaceTexture surface) {
    mSurfaceTexture = null;
    stopCamera();
    return true;
  }

  @Override
  public void onSurfaceTextureUpdated(SurfaceTexture surface) {
    mSurfaceTexture = surface;
  }

  public double getRatio() {
    int width = ExpoBarCodeScanner.getInstance().getPreviewWidth(this.mCameraType);
    int height = ExpoBarCodeScanner.getInstance().getPreviewHeight(this.mCameraType);
    return ((float) width) / ((float) height);
  }

  public void setCameraType(final int type) {
    if (this.mCameraType == type) {
      return;
    }
    new Thread(new Runnable() {
      @Override
      public void run() {
        mIsChanging = true;
        stopPreview();
        mCameraType = type;
        startPreview();
        mIsChanging = false;
      }
    }).start();
  }

  private void startPreview() {
    if (mSurfaceTexture != null) {
      startCamera();
    }
  }

  private void stopPreview() {
    if (mCamera != null) {
      stopCamera();
    }
  }

  synchronized private void startCamera() {
    if (!mIsStarting) {
      mIsStarting = true;
      try {
        mCamera = ExpoBarCodeScanner.getInstance().acquireCameraInstance(mCameraType);
        Camera.Parameters parameters = mCamera.getParameters();
        // set autofocus
        List<String> focusModes = parameters.getSupportedFocusModes();
        if (focusModes.contains(Camera.Parameters.FOCUS_MODE_CONTINUOUS_PICTURE)) {
          parameters.setFocusMode(Camera.Parameters.FOCUS_MODE_CONTINUOUS_PICTURE);
        }
        // set picture size
        // defaults to max available size
        Camera.Size optimalPictureSize = ExpoBarCodeScanner.getInstance().getBestSize(
            parameters.getSupportedPictureSizes(),
            Integer.MAX_VALUE,
            Integer.MAX_VALUE
        );
        parameters.setPictureSize(optimalPictureSize.width, optimalPictureSize.height);

        mCamera.setParameters(parameters);
        mCamera.setPreviewTexture(mSurfaceTexture);
        mCamera.startPreview();
        // send previews to `onPreviewFrame`
        mCamera.setPreviewCallback(this);
      } catch (NullPointerException e) {
        e.printStackTrace();
      } catch (Exception e) {
        e.printStackTrace();
        stopCamera();
      } finally {
        mIsStarting = false;
      }
    }
  }

  synchronized private void stopCamera() {
    if (!mIsStopping) {
      mIsStopping = true;
      try {
        if (mCamera != null) {
          mCamera.stopPreview();
          // stop sending previews to `onPreviewFrame`
          mCamera.setPreviewCallback(null);
          ExpoBarCodeScanner.getInstance().releaseCameraInstance();
          mCamera = null;
        }
      } catch (Exception e) {
        e.printStackTrace();
      } finally {
        mIsStopping = false;
      }
    }
  }

  /**
   * Initialize the barcode decoder.
   * Supports all iOS codes except [code138, code39mod43, interleaved2of5]
   * Additionally supports [codabar, code128, upc_a]
   */
  private void initBarCodeScanner() {
    BarCodeScannerProvider barCodeScannerProvider = mModuleRegistry.getModule(BarCodeScannerProvider.class);
    if (barCodeScannerProvider != null) {
      mBarCodeScanner = barCodeScannerProvider.createBarCodeDetectorWithContext(getContext());
    }
  }

  public void onPreviewFrame(byte[] data, Camera camera) {
    if (!BarCodeScannerViewFinder.barCodeScannerTaskLock) {
      BarCodeScannerViewFinder.barCodeScannerTaskLock = true;
      new BarCodeScannerAsyncTask(camera, data, mBarCodeScannerView).execute();
    }
  }

  public void setBarCodeScannerSettings(BarCodeScannerSettings settings) {
    mBarCodeScanner.setSettings(settings);
  }

  private class BarCodeScannerAsyncTask extends AsyncTask<Void, Void, Void> {
    private byte[] mImageData;
    private final Camera mCamera;

    BarCodeScannerAsyncTask(Camera camera, byte[] imageData, BarCodeScannerView barCodeScannerView) {
      mCamera = camera;
      mImageData = imageData;
      mBarCodeScannerView = barCodeScannerView;
    }

    @Override
    protected Void doInBackground(Void... ignored) {
      if (isCancelled()) {
        return null;
      }

      // setting PreviewCallback does not really have an effect - this method is called anyway so we
      // need to check if camera changing is in progress or not
      if (!mIsChanging && mCamera != null) {
        Camera.Size size = mCamera.getParameters().getPreviewSize();

        int width = size.width;
        int height = size.height;


        final BarCodeScannerResult result = mBarCodeScanner.scan(mImageData, width,
            height, ExpoBarCodeScanner.getInstance().getActualDeviceOrientation());

        if (result != null) {
          new Handler(Looper.getMainLooper()).post(new Runnable() {
            @Override
            public void run() {
              mBarCodeScannerView.onBarCodeScanned(result);
            }
          });
        }
      }

      BarCodeScannerViewFinder.barCodeScannerTaskLock = false;
      return null;
    }
  }
}
