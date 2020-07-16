package expo.modules.imagepicker;

import android.Manifest;
import android.app.Activity;
import android.app.Application;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Log;

import com.theartofdev.edmodo.cropper.CropImage;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ActivityEventListener;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.services.UIManager;
import org.unimodules.interfaces.imageloader.ImageLoader;
import org.unimodules.interfaces.permissions.Permissions;
import org.unimodules.interfaces.permissions.PermissionsStatus;

import java.io.File;
import java.io.IOException;
import java.lang.ref.WeakReference;
import java.util.List;
import java.util.Map;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import expo.modules.imagepicker.exporters.CompressionImageExporter;
import expo.modules.imagepicker.exporters.CropImageExporter;
import expo.modules.imagepicker.exporters.ImageExporter;
import expo.modules.imagepicker.exporters.RawImageExporter;
import expo.modules.imagepicker.tasks.CropResultTask;
import expo.modules.imagepicker.tasks.ImageResultTask;
import expo.modules.imagepicker.tasks.VideoResultTask;

import static com.theartofdev.edmodo.cropper.CropImage.CROP_IMAGE_ACTIVITY_REQUEST_CODE;

public class ImagePickerModule extends ExportedModule implements ActivityEventListener {
  private Uri mCameraCaptureURI;
  private Promise mPromise;
  private PickerOptions mPickerOptions;

  private WeakReference<Activity> mExperienceActivity;
  private boolean mInitialized = false;
  private Context mContext;
  private ModuleRegistry mModuleRegistry;
  private ImageLoader mImageLoader;

  private UIManager mUIManager;

  public ImagePickerModule(Context context) {
    super(context);
    mContext = context;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
    mImageLoader = moduleRegistry.getModule(ImageLoader.class);

    mUIManager = mModuleRegistry.getModule(UIManager.class);
  }

  @Override
  public String getName() {
    return "ExponentImagePicker";
  }

  @ExpoMethod
  public void requestCameraRollPermissionsAsync(final Promise promise) {
    Permissions.askForPermissionsWithPermissionsManager(mModuleRegistry.getModule(Permissions.class), promise, Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE);
  }

  @ExpoMethod
  public void getCameraRollPermissionsAsync(final Promise promise) {
    Permissions.getPermissionsWithPermissionsManager(mModuleRegistry.getModule(Permissions.class), promise, Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE);
  }

  @ExpoMethod
  public void requestCameraPermissionsAsync(final Promise promise) {
    Permissions.askForPermissionsWithPermissionsManager(mModuleRegistry.getModule(Permissions.class), promise, Manifest.permission.CAMERA);
  }

  @ExpoMethod
  public void getCameraPermissionsAsync(final Promise promise) {
    Permissions.getPermissionsWithPermissionsManager(mModuleRegistry.getModule(Permissions.class), promise, Manifest.permission.CAMERA);
  }

  // NOTE: Currently not reentrant / doesn't support concurrent requests
  @ExpoMethod
  public void launchCameraAsync(final Map<String, Object> options, final Promise promise) {
    mPickerOptions = PickerOptions.fromMap(options, promise);
    if (mPickerOptions == null) {
      return;
    }

    Activity activity = getExperienceActivity();
    if (activity == null) {
      promise.reject(ImagePickerConstance.ERR_MISSING_ACTIVITY, ImagePickerConstance.MISSING_ACTIVITY_MESSAGE);
      return;
    }

    final Intent cameraIntent = new Intent(mPickerOptions.getMediaTypes().equals("Videos") ?
      MediaStore.ACTION_VIDEO_CAPTURE :
      MediaStore.ACTION_IMAGE_CAPTURE);

    if (cameraIntent.resolveActivity(activity.getApplication().getPackageManager()) == null) {
      promise.reject(new IllegalStateException("Error resolving activity"));
      return;
    }

    Permissions permissionsModule = mModuleRegistry.getModule(Permissions.class);
    if (permissionsModule == null) {
      promise.reject("E_NO_PERMISSIONS", "Permissions module is null. Are you sure all the installed Expo modules are properly linked?");
      return;
    }
    permissionsModule.askForPermissions(permissionsResponse -> {
      if (permissionsResponse.get(Manifest.permission.WRITE_EXTERNAL_STORAGE).getStatus() == PermissionsStatus.GRANTED
        && permissionsResponse.get(Manifest.permission.CAMERA).getStatus() == PermissionsStatus.GRANTED) {
        launchCameraWithPermissionsGranted(promise, cameraIntent);
      } else {
        promise.reject(new SecurityException("User rejected permissions"));
      }
    }, Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.CAMERA);
  }

  private void launchCameraWithPermissionsGranted(Promise promise, Intent cameraIntent) {
    File imageFile = null;
    try {
      imageFile = new File(ImagePickerFileUtils.generateOutputPath(mContext.getCacheDir(),
        "ImagePicker", mPickerOptions.getMediaTypes().equals("Videos") ? ".mp4" : ".jpg"));
      boolean fileExists = !imageFile.createNewFile();
      if (fileExists) {
        Log.w(getName(), String.format("File %s already exists.", imageFile.getAbsolutePath()));
      }
    } catch (IOException e) {
      e.printStackTrace();
    }

    if (imageFile == null) {
      promise.reject(new IOException("Could not create image file."));
      return;
    }
    mCameraCaptureURI = ImagePickerFileUtils.uriFromFile(imageFile);

    Activity activity = getExperienceActivity();
    if (activity == null) {
      promise.reject(ImagePickerConstance.ERR_MISSING_ACTIVITY, ImagePickerConstance.MISSING_ACTIVITY_MESSAGE);
      return;
    }

    Application application = activity.getApplication();

    // fix for Permission Denial in Android < 21
    List<ResolveInfo> resolvedIntentActivities = application
      .getPackageManager().queryIntentActivities(cameraIntent, PackageManager.MATCH_DEFAULT_ONLY);

    for (ResolveInfo resolvedIntentInfo : resolvedIntentActivities) {
      String packageName = resolvedIntentInfo.activityInfo.packageName;
      application.grantUriPermission(
        packageName,
        mCameraCaptureURI,
        Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION
      );
    }
    mPromise = promise;
    // camera intent needs a content URI but we need a file one
    cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, ImagePickerFileUtils.contentUriFromFile(imageFile, getApplication()));
    startActivityOnResult(cameraIntent, ImagePickerConstance.REQUEST_LAUNCH_CAMERA, promise);
  }

  // NOTE: Currently not reentrant / doesn't support concurrent requests
  @ExpoMethod
  public void launchImageLibraryAsync(final Map<String, Object> options, final Promise promise) {
    mPickerOptions = PickerOptions.fromMap(options, promise);
    if (mPickerOptions == null) {
      return;
    }

    Intent libraryIntent = new Intent();

    switch (mPickerOptions.getMediaTypes()) {
      case "Images":
        libraryIntent.setType("image/*");
        break;
      case "Videos":
        libraryIntent.setType("video/*");
        break;
      case "All":
        libraryIntent.setType("*/*");
        libraryIntent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"image/*", "video/*"});
        break;
    }

    mPromise = promise;

    libraryIntent.setAction(Intent.ACTION_GET_CONTENT);
    startActivityOnResult(libraryIntent, ImagePickerConstance.REQUEST_LAUNCH_IMAGE_LIBRARY, promise);
  }

  @ExpoMethod
  public void startObserving(Promise promise) {
    promise.resolve(null);
  }

  @ExpoMethod
  public void stopObserving(Promise promise) {
    promise.resolve(null);
  }

  public void startCropIntent(Uri uri, String type, int requestCode) throws IOException {
    String extension = ".jpg";
    Bitmap.CompressFormat compressFormat = Bitmap.CompressFormat.JPEG;
    if (type.contains("png")) {
      compressFormat = Bitmap.CompressFormat.PNG;
      extension = ".png";
    } else if (type.contains("gif")) {
      // If we allow editing, the result image won't ever be a GIF as the cropper doesn't support it.
      // Let's convert to PNG in such case.
      extension = ".png";
      compressFormat = Bitmap.CompressFormat.PNG;

    } else if (type.contains("bmp")) {
      // If we allow editing, the result image won't ever be a BMP as the cropper doesn't support it.
      // Let's convert to PNG in such case.
      extension = ".png";
      compressFormat = Bitmap.CompressFormat.PNG;

    } else if (!type.contains("jpeg")) {
      Log.w(ImagePickerConstance.TAG, "Image type not supported. Falling back to JPEG instead.");
      extension = ".jpg";
    }

    Uri fileUri;
    if (requestCode == ImagePickerConstance.REQUEST_LAUNCH_CAMERA) {
      // if the image is created by camera intent we don't need a new path - it's been already saved
      fileUri = uri;
    } else {
      File file = new File(ImagePickerFileUtils.generateOutputPath(mContext.getCacheDir(), "ImagePicker", extension));
      fileUri = Uri.fromFile(file);
    }

    CropImage.ActivityBuilder cropImage = CropImage.activity(uri);
    if (mPickerOptions.getForceAspect() != null) {
      cropImage
        .setAspectRatio(((Number) mPickerOptions.getForceAspect().get(0)).intValue(), ((Number) mPickerOptions.getForceAspect().get(1)).intValue())
        .setFixAspectRatio(true)
        .setInitialCropWindowPaddingRatio(0);
    }
    Intent cropIntent = cropImage
      .setOutputUri(fileUri)
      .setOutputCompressFormat(compressFormat)
      .setOutputCompressQuality(mPickerOptions.getQuality())
      .getIntent(getContext());

    startActivityOnResult(cropIntent, CROP_IMAGE_ACTIVITY_REQUEST_CODE, mPromise);
  }

  public void handleOnActivityResult(@NonNull Activity activity, final int requestCode, final int resultCode, final Intent intent) {
    if (requestCode == ImagePickerConstance.REQUEST_LAUNCH_CAMERA) {
      revokeUriPermissionForCamera();
    }

    if (resultCode != Activity.RESULT_OK) {
      Bundle response = new Bundle();
      response.putBoolean("cancelled", true);
      mPromise.resolve(response);
      return;
    }

    ContentResolver contentResolver = activity.getApplication().getContentResolver();

    if (requestCode == CROP_IMAGE_ACTIVITY_REQUEST_CODE) {
      CropImage.ActivityResult result = CropImage.getActivityResult(intent);
      CropImageExporter exporter = new CropImageExporter(result.getRotation(), result.getCropRect(), mPickerOptions.isBase64());
      new CropResultTask(mPromise, result.getUri(), contentResolver, mContext.getCacheDir(), mPickerOptions.isExif(), exporter).execute();
      return;
    }

    Uri uri = requestCode == ImagePickerConstance.REQUEST_LAUNCH_CAMERA ? mCameraCaptureURI : intent.getData();
    if (uri == null) {
      mPromise.reject(ImagePickerConstance.ERR_MISSING_URL, ImagePickerConstance.MISSING_URL_MESSAGE);
      return;
    }

    String type = ImagePickerFileUtils.getType(contentResolver, uri);
    if (type == null) {
      mPromise.reject(ImagePickerConstance.ERR_CAN_NOT_DEDUCE_TYPE, ImagePickerConstance.CAN_NOT_DEDUCE_TYPE_MESSAGE);
      return;
    }

    if (type.contains("image")) {
      if (mPickerOptions.isAllowsEditing()) {
        try {
          startCropIntent(uri, type, requestCode);
        } catch (IOException e) {
          mPromise.reject(ImagePickerConstance.ERR_CAN_NOT_OPEN_CROP, ImagePickerConstance.CAN_NOT_OPEN_CROP_MESSAGE, e);
        }
        return;
      }

      ImageExporter exporter;
      if (mPickerOptions.getQuality() == ImagePickerConstance.DEFAULT_QUALITY) {
        exporter = new RawImageExporter(mContext, mPickerOptions.isBase64());
      } else {
        exporter = new CompressionImageExporter(mImageLoader, mPickerOptions.getQuality(), mPickerOptions.isBase64());
      }

      new ImageResultTask(mPromise, uri, contentResolver, mContext.getCacheDir(), mPickerOptions.isExif(), type, exporter).execute();
      return;
    }

    MediaMetadataRetriever metadataRetriever = new MediaMetadataRetriever();
    metadataRetriever.setDataSource(mContext, uri);
    new VideoResultTask(mPromise, uri, contentResolver, mContext.getCacheDir(), metadataRetriever).execute();
  }

  private void revokeUriPermissionForCamera() {
    Application application = getApplication();
    if (application == null) {
      return;
    }

    application
      .revokeUriPermission(
        mCameraCaptureURI,
        Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION
      );
  }

  @Nullable
  private Activity getExperienceActivity() {
    if (!mInitialized) {
      mInitialized = true;
      ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
      mExperienceActivity = new WeakReference<>(activityProvider.getCurrentActivity());
    }
    return mExperienceActivity.get();
  }

  @Override
  public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
    if (getExperienceActivity() != null && activity == getExperienceActivity()) {
      if (mUIManager != null) {
        mUIManager.unregisterActivityEventListener(this);
      }
      handleOnActivityResult(activity, requestCode, resultCode, data);
    }
  }

  @Override
  public void onNewIntent(Intent intent) {

  }

  private void startActivityOnResult(Intent intent, int requestCode, Promise promise) {
    if (mUIManager == null) {
      promise.reject(ImagePickerConstance.ERR_MISSING_UI_MANAGER, ImagePickerConstance.MISSING_UI_MANAGER_MESSAGE);
      return;
    }
    mUIManager.registerActivityEventListener(this);

    Activity activity = getExperienceActivity();
    if (activity == null) {
      promise.reject(ImagePickerConstance.ERR_MISSING_ACTIVITY, ImagePickerConstance.MISSING_ACTIVITY_MESSAGE);
      return;
    }

    activity.startActivityForResult(intent, requestCode);
  }

  @Nullable
  private Application getApplication() {
    Activity activity = getExperienceActivity();
    if (activity != null) {
      return activity.getApplication();
    }
    return null;
  }

}
