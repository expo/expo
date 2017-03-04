package abi7_0_0.host.exp.exponent.modules.api;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Environment;
import android.provider.MediaStore;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.UUID;

import abi7_0_0.com.facebook.react.bridge.Arguments;
import abi7_0_0.com.facebook.react.bridge.Promise;
import abi7_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi7_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi7_0_0.com.facebook.react.bridge.ReactMethod;
import abi7_0_0.com.facebook.react.bridge.ReadableArray;
import abi7_0_0.com.facebook.react.bridge.ReadableMap;
import abi7_0_0.com.facebook.react.bridge.ReadableType;
import abi7_0_0.com.facebook.react.bridge.WritableMap;
import com.nostra13.universalimageloader.core.DisplayImageOptions;
import com.nostra13.universalimageloader.core.ImageLoader;
import com.theartofdev.edmodo.cropper.CropImage;

import host.exp.exponent.ActivityResultListener;
import host.exp.exponent.experience.BaseExperienceActivity;
import host.exp.exponent.utils.ExpFileUtils;
import host.exp.expoview.Exponent;

public class ImagePickerModule extends ReactContextBaseJavaModule implements ActivityResultListener {
  static final int REQUEST_LAUNCH_CAMERA = 1;
  static final int REQUEST_LAUNCH_IMAGE_LIBRARY = 2;

  private final ReactApplicationContext mReactContext;

  private Uri mCameraCaptureURI;
  private Promise mPromise;
  private Boolean mLaunchedCropper = false;

  final String OPTION_QUALITY = "quality";
  final String OPTION_ALLOWS_EDITING = "allowsEditing";
  final String OPTION_ASPECT = "aspect";

  private int quality = 100;
  private Boolean allowsEditing = false;
  private ReadableArray forceAspect = null;

  public ImagePickerModule(ReactApplicationContext reactContext) {
    super(reactContext);

    mReactContext = reactContext;
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
        Uri uri = result.getUri();

        WritableMap response = Arguments.createMap();
        response.putString("uri", uri.toString());
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
        Uri uri = requestCode == REQUEST_LAUNCH_CAMERA ? mCameraCaptureURI : intent.getData();

        if (allowsEditing) {
          mLaunchedCropper = true;
          mPromise = promise; // Need promise again later

          CropImage.ActivityBuilder cropImage = CropImage.activity(uri);
          if (forceAspect != null) {
            cropImage.
              setAspectRatio(forceAspect.getInt(0), forceAspect.getInt(1)).
              setFixAspectRatio(true).
              setInitialCropWindowPaddingRatio(0);
          }
          cropImage.start(Exponent.getInstance().getCurrentActivity());
        } else {
          String beforeDecode = uri.toString();
          String afterDecode = Uri.decode(beforeDecode);
          Bitmap bmp = null;
          try {
            bmp = ImageLoader.getInstance().loadImageSync(afterDecode,
                    new DisplayImageOptions.Builder()
                            .considerExifParams(true)
                            .build());
          } catch (Throwable e) {}
          if (bmp == null) {
            try {
              bmp = ImageLoader.getInstance().loadImageSync(beforeDecode,
                      new DisplayImageOptions.Builder()
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
          response.putInt("width", bmp.getWidth());
          response.putInt("height", bmp.getHeight());
          response.putBoolean("cancelled", false);
          promise.resolve(response);
        }
      }
    });
  }

  private String writeImage(Bitmap image) {
    FileOutputStream out = null;
    String filename = UUID.randomUUID().toString();
    String path = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES) + File.separator + filename + ".jpg";
    try {
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
