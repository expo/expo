package abi18_0_0.host.exp.exponent.modules.api.components.barcodescanner;

import android.content.Context;
import android.graphics.SurfaceTexture;
import android.hardware.Camera;
import android.os.AsyncTask;
import android.os.Looper;
import android.view.TextureView;

import abi18_0_0.com.facebook.react.bridge.Arguments;
import abi18_0_0.com.facebook.react.bridge.WritableMap;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.DecodeHintType;
import com.google.zxing.MultiFormatReader;
import com.google.zxing.PlanarYUVLuminanceSource;
import com.google.zxing.Result;
import com.google.zxing.common.HybridBinarizer;
import android.os.Handler;


import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;

class BarCodeScannerViewFinder extends TextureView implements TextureView.SurfaceTextureListener, Camera.PreviewCallback {
  private int mCameraType;
  private SurfaceTexture mSurfaceTexture;
  private boolean mIsStarting;
  private boolean mIsStopping;
  private boolean mIsChanging;
  private BarCodeScannerView mBarCodeScannerView;
  private Camera mCamera;

  // Concurrency lock for barcode scanner to avoid flooding the runtime
  public static volatile boolean barCodeScannerTaskLock = false;

  // Reader instance for the barcode scanner
  private final MultiFormatReader mMultiFormatReader = new MultiFormatReader();

  public BarCodeScannerViewFinder(Context context, int type, BarCodeScannerView barCodeScannerView) {
    super(context);
    this.setSurfaceTextureListener(this);
    mCameraType = type;
    mBarCodeScannerView = barCodeScannerView;
    this.initBarcodeReader(BarCodeScanner.getInstance().getBarCodeTypes());
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
    int width = BarCodeScanner.getInstance().getPreviewWidth(this.mCameraType);
    int height = BarCodeScanner.getInstance().getPreviewHeight(this.mCameraType);
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

  public void setTorchMode(int torchMode) {
    BarCodeScanner.getInstance().setTorchMode(torchMode);
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
        mCamera = BarCodeScanner.getInstance().acquireCameraInstance(mCameraType);
        Camera.Parameters parameters = mCamera.getParameters();
        // set autofocus
        List<String> focusModes = parameters.getSupportedFocusModes();
        if (focusModes.contains(Camera.Parameters.FOCUS_MODE_CONTINUOUS_PICTURE)) {
          parameters.setFocusMode(Camera.Parameters.FOCUS_MODE_CONTINUOUS_PICTURE);
        }
        // set picture size
        // defaults to max available size
        Camera.Size optimalPictureSize = BarCodeScanner.getInstance().getBestSize(
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
          BarCodeScanner.getInstance().releaseCameraInstance();
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
   * Supports all iOS codes except [code138, code39mod43, itf14]
   * Additionally supports [codabar, code128, maxicode, rss14, rssexpanded, upc_a, upc_ean]
   */
  private void initBarcodeReader(List<String> barCodeTypes) {
    EnumMap<DecodeHintType, Object> hints = new EnumMap<>(DecodeHintType.class);
    EnumSet<BarcodeFormat> decodeFormats = EnumSet.noneOf(BarcodeFormat.class);

    if (barCodeTypes != null) {
      for (String code : barCodeTypes) {
        String formatString = (String) BarCodeScannerModule.VALID_BARCODE_TYPES.get(code);
        if (formatString != null) {
          decodeFormats.add(BarcodeFormat.valueOf(code));
        }
      }
    }

    hints.put(DecodeHintType.POSSIBLE_FORMATS, decodeFormats);
    mMultiFormatReader.setHints(hints);
  }

  public void onPreviewFrame(byte[] data, Camera camera) {
    if (!BarCodeScannerViewFinder.barCodeScannerTaskLock) {
      BarCodeScannerViewFinder.barCodeScannerTaskLock = true;
      new ReaderAsyncTask(camera, data, mBarCodeScannerView).execute();
    }
  }

  private class ReaderAsyncTask extends AsyncTask<Void, Void, Void> {
    private byte[] mImageData;
    private final Camera mCamera;

    ReaderAsyncTask(Camera camera, byte[] imageData, BarCodeScannerView barCodeScannerView) {
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
      if (!mIsChanging) {
        Camera.Size size = mCamera.getParameters().getPreviewSize();

        int width = size.width;
        int height = size.height;

        // rotate for zxing if orientation is portrait
        if (BarCodeScanner.getInstance().getActualDeviceOrientation() == 0) {
          byte[] rotated = new byte[mImageData.length];
          for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
              rotated[x * height + height - y - 1] = mImageData[x + y * width];
            }
          }
          width = size.height;
          height = size.width;
          mImageData = rotated;
        }

        try {
          PlanarYUVLuminanceSource source = new PlanarYUVLuminanceSource(mImageData, width, height, 0, 0, width, height, false);
          BinaryBitmap bitmap = new BinaryBitmap(new HybridBinarizer(source));
          final Result result = mMultiFormatReader.decodeWithState(bitmap);

          new Handler(Looper.getMainLooper()).post(new Runnable() {
            @Override
            public void run() {
              String type = result.getBarcodeFormat().toString();
              if (BarCodeScanner.getInstance().getBarCodeTypes().contains(type)) {
                WritableMap event = Arguments.createMap();
                event.putString("data", result.getText());
                event.putString("type", type);
                mBarCodeScannerView.onBarCodeRead(event);
              }
            }
          });

        } catch (Throwable t) {
          // Unhandled error, unsure what would cause this
        } finally {
          mMultiFormatReader.reset();
          BarCodeScannerViewFinder.barCodeScannerTaskLock = false;
          return null;
        }
      } else {
        mMultiFormatReader.reset();
        BarCodeScannerViewFinder.barCodeScannerTaskLock = false;
        return null;
      }
    }
  }
}
