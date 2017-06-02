package versioned.host.exp.exponent.modules.api;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableMap;
import com.nostra13.universalimageloader.core.DisplayImageOptions;
import com.nostra13.universalimageloader.core.ImageLoader;
import com.nostra13.universalimageloader.utils.IoUtils;
import com.theartofdev.edmodo.cropper.CropImage;

import host.exp.exponent.ActivityResultListener;
import host.exp.exponent.utils.ExpFileUtils;
import host.exp.exponent.utils.ScopedContext;
import host.exp.expoview.Exponent;
import versioned.host.exp.exponent.ReadableObjectUtils;

public class ImagePickerModule extends ReactContextBaseJavaModule implements ActivityResultListener {
  static final int REQUEST_LAUNCH_CAMERA = 1;
  static final int REQUEST_LAUNCH_IMAGE_LIBRARY = 2;

  private Uri mCameraCaptureURI;
  private Promise mPromise;
  private Boolean mLaunchedCropper = false;

  final String OPTION_QUALITY = "quality";
  final String OPTION_ALLOWS_EDITING = "allowsEditing";
  final String OPTION_ASPECT = "aspect";
  final String OPTION_BASE64 = "base64";

  private int quality = 100;
  private Boolean allowsEditing = false;
  private ReadableArray forceAspect = null;
  private Boolean base64 = false;

  private ScopedContext mScopedContext;

  public ImagePickerModule(ReactApplicationContext reactContext, ScopedContext scopedContext) {
    super(reactContext);
    mScopedContext = scopedContext;
    Exponent.getInstance().addActivityResultListener(this);
  }

  @Override
  public String getName() {
    return "ExponentImagePicker";
  }

  private boolean readOptions(final ReadableMap options, final Promise promise) {
    if (options.hasKey(OPTION_QUALITY)) {
      quality = (int) (options.getDouble(OPTION_QUALITY) * 100);
    }
    if (options.hasKey(OPTION_ALLOWS_EDITING)) {
      allowsEditing = options.getBoolean(OPTION_ALLOWS_EDITING);
    }
    if (options.hasKey(OPTION_ASPECT)) {
      forceAspect = options.getArray(OPTION_ASPECT);
      if (forceAspect.size() != 2 || forceAspect.getType(0) != ReadableType.Number ||
              forceAspect.getType(1) != ReadableType.Number) {
        promise.reject(new IllegalArgumentException("'aspect option must be of form [Number, Number]"));
        return false;
      }
    }
    if (options.hasKey(OPTION_BASE64)) {
      base64 = options.getBoolean(OPTION_BASE64);
    }
    return true;
  }

  // NOTE: Currently not reentrant / doesn't support concurrent requests
  @ReactMethod
  public void launchCameraAsync(final ReadableMap options, final Promise promise) {
    if (!readOptions(options, promise)) {
      return;
    }

    final Intent cameraIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
    if (cameraIntent.resolveActivity(Exponent.getInstance().getApplication().getPackageManager()) == null) {
      promise.reject(new IllegalStateException("Error resolving activity"));
      return;
    }

    Exponent.getInstance().getPermissions(new Exponent.PermissionsListener() {
      @Override
      public void permissionsGranted() {
        launchCameraWithPermissionsGranted(promise, cameraIntent);
      }

      @Override
      public void permissionsDenied() {
        promise.reject(new SecurityException("User rejected permissions"));
      }
    }, new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.CAMERA});
  }

  private void launchCameraWithPermissionsGranted(Promise promise, Intent cameraIntent) {
    File imageFile;
    try {
      imageFile = File.createTempFile("exponent_capture_", ".jpg",
          Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES));
    } catch (IOException e) {
      e.printStackTrace();
      return;
    }
    if (imageFile == null) {
      promise.reject(new IOException("Could not create temporary image file."));
      return;
    }
    cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, ExpFileUtils.uriFromFile(imageFile));
    mCameraCaptureURI = ExpFileUtils.uriFromFile(imageFile);
    mPromise = promise;
    Exponent.getInstance().getCurrentActivity().startActivityForResult(cameraIntent, REQUEST_LAUNCH_CAMERA);
  }

  // NOTE: Currently not reentrant / doesn't support concurrent requests
  @ReactMethod
  public void launchImageLibraryAsync(final ReadableMap options, final Promise promise) {
    if (!readOptions(options, promise)) {
      return;
    }

    Exponent.getInstance().getPermissions(new Exponent.PermissionsListener() {
      @Override
      public void permissionsGranted() {
        launchImageLibraryWithPermissionsGranted(promise);
      }

      @Override
      public void permissionsDenied() {
        promise.reject(new SecurityException("User rejected permissions."));
      }
    }, new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE});
  }

  private void launchImageLibraryWithPermissionsGranted(Promise promise) {
    Intent libraryIntent = new Intent();
    libraryIntent.setType("image/*");
    libraryIntent.setAction(Intent.ACTION_GET_CONTENT);
    mPromise = promise;
    Exponent.getInstance().getCurrentActivity().startActivityForResult(libraryIntent, REQUEST_LAUNCH_IMAGE_LIBRARY);
  }

  public void onActivityResult(final int requestCode, final int resultCode, final Intent intent) {
    if (requestCode == CropImage.CROP_IMAGE_ACTIVITY_REQUEST_CODE) {
      if (mLaunchedCropper) {
        mLaunchedCropper = false;
        final Promise promise = mPromise;
        mPromise = null;

        if (promise == null) {
          return;
        }
        if (resultCode != Activity.RESULT_OK) {
          WritableMap response = Arguments.createMap();
          response.putBoolean("cancelled", true);
          promise.resolve(response);
          return;
        }

        CropImage.ActivityResult result = CropImage.getActivityResult(intent);

        WritableMap response = Arguments.createMap();
        response.putString("uri", result.getUri().toString());
        int rot = result.getRotation() % 360;
        if (rot < 0) {
          rot += 360;
        }
        if (rot == 0 || rot == 180) { // Rotation is right-angled only
          response.putInt("width", result.getCropRect().width());
          response.putInt("height", result.getCropRect().height());
        } else {
          response.putInt("width", result.getCropRect().height());
          response.putInt("height", result.getCropRect().width());
        }
        if (base64) {
          ByteArrayOutputStream out = new ByteArrayOutputStream();
          try {
            // `CropImage` nullifies the `result.getBitmap()` after it writes out to a file, so
            // we have to read back...
            InputStream in = new FileInputStream(result.getUri().getPath());
            IoUtils.copyStream(in, out, null);
            response.putString("base64", Base64.encodeToString(out.toByteArray(), Base64.DEFAULT));
          } catch(IOException e) {
            promise.reject(e);
          }
        }
        response.putBoolean("cancelled", false);
        promise.resolve(response);
      }
      return;
    }

    if (mPromise == null || (mCameraCaptureURI == null && requestCode == REQUEST_LAUNCH_CAMERA)
        || (requestCode != REQUEST_LAUNCH_CAMERA && requestCode != REQUEST_LAUNCH_IMAGE_LIBRARY)) {
      return;
    }

    final Promise promise = mPromise;
    mPromise = null;

    // User cancel
    if (resultCode != Activity.RESULT_OK) {
      WritableMap response = Arguments.createMap();
      response.putBoolean("cancelled", true);
      promise.resolve(response);
      return;
    }

    AsyncTask.execute(new Runnable() {
      @Override
      public void run() {
        try {
          Uri uri = requestCode == REQUEST_LAUNCH_CAMERA ? mCameraCaptureURI : intent.getData();

          if (allowsEditing) {
            mLaunchedCropper = true;
            mPromise = promise; // Need promise again later

            CropImage.ActivityBuilder cropImage = CropImage.activity(uri);
            if (forceAspect != null) {
              cropImage
                  .setAspectRatio(forceAspect.getInt(0), forceAspect.getInt(1))
                  .setFixAspectRatio(true)
                  .setInitialCropWindowPaddingRatio(0);
            }
            cropImage
                .setOutputUri(ExpFileUtils.uriFromFile(new File(generateOutputPath())))
                .setOutputCompressQuality(quality)
                .start(Exponent.getInstance().getCurrentActivity());
          } else {
            // On some devices this has worked without decoding the URI and on some it has worked
            // with decoding, so we try both...
            // The `.cacheOnDisk(true)` and `.considerExifParams(true)` is to reflect EXIF rotation
            // metadata.
            // See https://github.com/nostra13/Android-Universal-Image-Loader/issues/630#issuecomment-204338289
            String beforeDecode = uri.toString();
            String afterDecode = Uri.decode(beforeDecode);
            Bitmap bmp = null;
            try {
              bmp = ImageLoader.getInstance().loadImageSync(afterDecode,
                  new DisplayImageOptions.Builder()
                      .cacheOnDisk(true)
                      .considerExifParams(true)
                      .build());
            } catch (Throwable e) {}
            if (bmp == null) {
              try {
                bmp = ImageLoader.getInstance().loadImageSync(beforeDecode,
                    new DisplayImageOptions.Builder()
                        .cacheOnDisk(true)
                        .considerExifParams(true)
                        .build());
              } catch (Throwable e) {}
            }
            if (bmp == null) {
              promise.reject(new IllegalStateException("Image decoding failed."));
              return;
            }
            String path = writeImage(bmp);

            WritableMap response = Arguments.createMap();
            response.putString("uri", ExpFileUtils.uriFromFile(new File(path)).toString());
            if (base64) {
              ByteArrayOutputStream out = new ByteArrayOutputStream();
              bmp.compress(Bitmap.CompressFormat.JPEG, quality, out);
              response.putString("base64", Base64.encodeToString(out.toByteArray(), Base64.DEFAULT));
            }
            response.putInt("width", bmp.getWidth());
            response.putInt("height", bmp.getHeight());
            response.putBoolean("cancelled", false);
            promise.resolve(response);
          }
        } catch (Exception e) {
          e.printStackTrace();
        }
      }
    });
  }

  private String generateOutputPath() throws IOException {
    String filename = UUID.randomUUID().toString();
    WritableMap options = Arguments.createMap();
    options.putBoolean("cache", true);
    File directory = new File(mScopedContext.toScopedPath("ImagePicker", ReadableObjectUtils.readableToJson(options)));
    ExpFileUtils.ensureDirExists(directory);
    return directory + File.separator + filename + ".jpg";
  }

  private String writeImage(Bitmap image) {
    FileOutputStream out = null;
    String path = null;
    try {
      path = generateOutputPath();
      out = new FileOutputStream(path);
      image.compress(Bitmap.CompressFormat.JPEG, quality, out);
    } catch (Exception e) {
      e.printStackTrace();
    } finally {
      try {
        if (out != null) {
          out.close();
        }
      } catch (IOException e) {
        e.printStackTrace();
      }
    }
    return path;
  }
}
