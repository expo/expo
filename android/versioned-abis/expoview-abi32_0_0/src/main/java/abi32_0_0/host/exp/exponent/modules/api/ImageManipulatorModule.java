package abi32_0_0.host.exp.exponent.modules.api;

import android.graphics.Bitmap;
import android.graphics.Matrix;
import android.net.Uri;
import android.util.Base64;

import com.facebook.common.executors.CallerThreadExecutor;
import com.facebook.common.executors.UiThreadImmediateExecutorService;
import com.facebook.common.references.CloseableReference;
import com.facebook.datasource.DataSource;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.imagepipeline.common.RotationOptions;
import com.facebook.imagepipeline.datasource.BaseBitmapDataSubscriber;
import com.facebook.imagepipeline.image.CloseableImage;
import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.imagepipeline.request.ImageRequestBuilder;
import abi32_0_0.com.facebook.react.bridge.Arguments;
import abi32_0_0.com.facebook.react.bridge.Promise;
import abi32_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi32_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi32_0_0.com.facebook.react.bridge.ReactMethod;
import abi32_0_0.com.facebook.react.bridge.ReadableArray;
import abi32_0_0.com.facebook.react.bridge.ReadableMap;
import abi32_0_0.com.facebook.react.bridge.WritableMap;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

import host.exp.exponent.analytics.EXL;
import host.exp.exponent.utils.ExpFileUtils;
import host.exp.exponent.utils.ScopedContext;

public class ImageManipulatorModule extends ReactContextBaseJavaModule {
  private static final String DECODE_ERROR_TAG = "E_DECODE_ERR";
  private static final String ARGS_ERROR_TAG = "E_ARGS_ERR";
  private static final String TAG = "ExpoImageManipulator";
  private ScopedContext mScopedContext;

  public ImageManipulatorModule(ReactApplicationContext reactContext, ScopedContext scopedContext) {
    super(reactContext);
    mScopedContext = scopedContext;
  }

  @Override
  public String getName() {
    return "ExponentImageManipulator";
  }

  @ReactMethod
  public void manipulate(final String uriString, final ReadableArray actions, final ReadableMap saveOptions, final Promise promise) {
    if (uriString == null || uriString.length() == 0) {
      promise.reject(ARGS_ERROR_TAG, "Uri passed to ImageManipulator cannot be empty!");
      return;
    }
    ImageRequest imageRequest =
        ImageRequestBuilder
            .newBuilderWithSource(Uri.parse(uriString))
            .setRotationOptions(RotationOptions.autoRotate())
            .build();
    final DataSource<CloseableReference<CloseableImage>> dataSource
        = Fresco.getImagePipeline().fetchDecodedImage(imageRequest, getReactApplicationContext());
    dataSource.subscribe(new BaseBitmapDataSubscriber() {
                           @Override
                           public void onNewResultImpl(Bitmap bitmap) {
                             if (bitmap != null) {
                               processBitmapWithActions(bitmap, actions, saveOptions, promise);
                             } else {
                               onFailureImpl(dataSource);
                             }
                           }

                           @Override
                           public void onFailureImpl(DataSource dataSource) {
                             // No cleanup required here.
                             String basicMessage = "Could not get decoded bitmap of " + uriString;
                             if (dataSource.getFailureCause() != null) {
                               promise.reject(DECODE_ERROR_TAG,
                                   basicMessage + ": " + dataSource.getFailureCause().toString(), dataSource.getFailureCause());
                             } else {
                               promise.reject(DECODE_ERROR_TAG, basicMessage + ".");
                             }
                           }
                         },
        CallerThreadExecutor.getInstance()
    );
  }

  private void processBitmapWithActions(Bitmap bmp, ReadableArray actions, ReadableMap saveOptions, Promise promise) {
    int imageWidth, imageHeight;

    for (int idx = 0; idx < actions.size(); idx ++) {
      ReadableMap options = actions.getMap(idx);

      imageWidth = bmp.getWidth();
      imageHeight = bmp.getHeight();

      if (options.hasKey("resize")) {
        ReadableMap resize = options.getMap("resize");
        int requestedWidth = 0;
        int requestedHeight = 0;
        float imageRatio = 1.0f * imageWidth / imageHeight;

        if (resize.hasKey("width")) {
          requestedWidth = (int) resize.getDouble("width");
          requestedHeight = (int) (requestedWidth / imageRatio);
        }
        if (resize.hasKey("height")) {
          requestedHeight = (int) resize.getDouble("height");
          requestedWidth = requestedWidth == 0 ? (int) (imageRatio * requestedHeight) : requestedWidth;
        }

        bmp = Bitmap.createScaledBitmap(bmp, requestedWidth, requestedHeight, true);
      } else if (options.hasKey("rotate")) {
        int requestedRotation = options.getInt("rotate");
        Matrix rotationMatrix = new Matrix();
        rotationMatrix.postRotate(requestedRotation);
        bmp = Bitmap.createBitmap(bmp, 0, 0, bmp.getWidth(), bmp.getHeight(), rotationMatrix, true);
      } else if (options.hasKey("flip")) {
        Matrix rotationMatrix = new Matrix();
        ReadableMap flip = options.getMap("flip");
        if (flip.hasKey("horizontal") && flip.getBoolean("horizontal")) {
          rotationMatrix.postScale(-1, 1);
        }
        if (flip.hasKey("vertical") && flip.getBoolean("vertical")) {
          rotationMatrix.postScale(1, -1);
        }
        bmp = Bitmap.createBitmap(bmp, 0, 0, bmp.getWidth(), bmp.getHeight(), rotationMatrix, true);
      } else if (options.hasKey("crop")) {
        ReadableMap crop = options.getMap("crop");
        if (!crop.hasKey("originX") || !crop.hasKey("originY") || !crop.hasKey("width") || !crop.hasKey("height")) {
          promise.reject("E_INVALID_CROP_DATA", "Invalid crop options has been passed. Please make sure the object contains originX, originY, width and height.");
          return;
        }
        int originX, originY, requestedWidth, requestedHeight;
        originX = (int) crop.getDouble("originX");
        originY = (int) crop.getDouble("originY");
        requestedWidth = (int) crop.getDouble("width");
        requestedHeight = (int) crop.getDouble("height");
        if (originX > imageWidth || originY > imageHeight || requestedWidth > bmp.getWidth() || requestedHeight > bmp.getHeight()) {
          promise.reject("E_INVALID_CROP_DATA", "Invalid crop options has been passed. Please make sure the requested crop rectangle is inside source image.");
          return;
        }
        bmp = Bitmap.createBitmap(bmp, originX, originY, requestedWidth, requestedHeight);
      }
    }

    int compressionQuality = 100;
    if (saveOptions.hasKey("compress")) {
      compressionQuality = (int) (100 * saveOptions.getDouble("compress"));
    }
    String format, extension;
    Bitmap.CompressFormat compressFormat;

    if (saveOptions.hasKey("format")) {
      format = saveOptions.getString("format");
    } else {
      format = "jpeg";
    }

    if (format.equals("png")) {
      compressFormat = Bitmap.CompressFormat.PNG;
      extension = ".png";
    } else if (format.equals("jpeg")) {
      compressFormat = Bitmap.CompressFormat.JPEG;
      extension = ".jpg";
    } else {
      EXL.w(TAG, "Unsupported format: " + format + ", using JPEG instead");
      compressFormat = Bitmap.CompressFormat.JPEG;
      extension = ".jpg";
    }

    boolean base64 = saveOptions.hasKey("base64") && saveOptions.getBoolean("base64");

    FileOutputStream out = null;
    ByteArrayOutputStream byteOut = null;
    String path = null;
    String base64String = null;
    try {
      path = ExpFileUtils.generateOutputPath(mScopedContext.getCacheDir(), "ImageManipulator", extension);
      out = new FileOutputStream(path);
      bmp.compress(compressFormat, compressionQuality, out);

      if (base64) {
        byteOut = new ByteArrayOutputStream();
        bmp.compress(compressFormat, compressionQuality, byteOut);
        base64String = Base64.encodeToString(byteOut.toByteArray(), Base64.DEFAULT);
      }
    } catch (Exception e) {
      e.printStackTrace();
    } finally {
      try {
        if (out != null) {
          out.close();
        }
        if (byteOut != null) {
          byteOut.close();
        }
      } catch (IOException e) {
        e.printStackTrace();
      }
    }

    WritableMap response = Arguments.createMap();
    response.putString("uri", Uri.fromFile(new File(path)).toString());
    response.putInt("width", bmp.getWidth());
    response.putInt("height", bmp.getHeight());
    if (base64) {
      response.putString("base64", base64String);
    }
    promise.resolve(response);
  }
}
