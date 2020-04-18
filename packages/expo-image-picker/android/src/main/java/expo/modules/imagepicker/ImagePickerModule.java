package expo.modules.imagepicker;

import android.Manifest;
import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;

import com.theartofdev.edmodo.cropper.CropImage;

import org.apache.commons.io.IOUtils;
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

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.exifinterface.media.ExifInterface;

public class ImagePickerModule extends ExportedModule implements ActivityEventListener {

  public static final String TAG = "ExponentImagePicker";
  private static final String ERR_MISSING_ACTIVITY = "ERR_MISSING_ACTIVITY";
  private static final String MISSING_ACTIVITY_MESSAGE = "Activity which was provided during module initialization is no longer available";
  private static final String ERR_CAN_NOT_DEDUCE_TYPE = "ERR_CAN_NOT_DEDUCE_TYPE";
  private static final String CAN_NOT_DEDUCE_TYPE_MESSAGE = "Can not deduce type of the returned file.";
  // We need to explicitly get latitude, longitude, altitude with their specific accessor functions
  // separately so we skip them in this list.
  public static final String[][] exifTags = new String[][]{
      {"string", ExifInterface.TAG_ARTIST},
      {"int", ExifInterface.TAG_BITS_PER_SAMPLE},
      {"int", ExifInterface.TAG_COMPRESSION},
      {"string", ExifInterface.TAG_COPYRIGHT},
      {"string", ExifInterface.TAG_DATETIME},
      {"string", ExifInterface.TAG_IMAGE_DESCRIPTION},
      {"int", ExifInterface.TAG_IMAGE_LENGTH},
      {"int", ExifInterface.TAG_IMAGE_WIDTH},
      {"int", ExifInterface.TAG_JPEG_INTERCHANGE_FORMAT},
      {"int", ExifInterface.TAG_JPEG_INTERCHANGE_FORMAT_LENGTH},
      {"string", ExifInterface.TAG_MAKE},
      {"string", ExifInterface.TAG_MODEL},
      {"int", ExifInterface.TAG_ORIENTATION},
      {"int", ExifInterface.TAG_PHOTOMETRIC_INTERPRETATION},
      {"int", ExifInterface.TAG_PLANAR_CONFIGURATION},
      {"double", ExifInterface.TAG_PRIMARY_CHROMATICITIES},
      {"double", ExifInterface.TAG_REFERENCE_BLACK_WHITE},
      {"int", ExifInterface.TAG_RESOLUTION_UNIT},
      {"int", ExifInterface.TAG_ROWS_PER_STRIP},
      {"int", ExifInterface.TAG_SAMPLES_PER_PIXEL},
      {"string", ExifInterface.TAG_SOFTWARE},
      {"int", ExifInterface.TAG_STRIP_BYTE_COUNTS},
      {"int", ExifInterface.TAG_STRIP_OFFSETS},
      {"int", ExifInterface.TAG_TRANSFER_FUNCTION},
      {"double", ExifInterface.TAG_WHITE_POINT},
      {"double", ExifInterface.TAG_X_RESOLUTION},
      {"double", ExifInterface.TAG_Y_CB_CR_COEFFICIENTS},
      {"int", ExifInterface.TAG_Y_CB_CR_POSITIONING},
      {"int", ExifInterface.TAG_Y_CB_CR_SUB_SAMPLING},
      {"double", ExifInterface.TAG_Y_RESOLUTION},
      {"double", ExifInterface.TAG_APERTURE_VALUE},
      {"double", ExifInterface.TAG_BRIGHTNESS_VALUE},
      {"string", ExifInterface.TAG_CFA_PATTERN},
      {"int", ExifInterface.TAG_COLOR_SPACE},
      {"string", ExifInterface.TAG_COMPONENTS_CONFIGURATION},
      {"double", ExifInterface.TAG_COMPRESSED_BITS_PER_PIXEL},
      {"int", ExifInterface.TAG_CONTRAST},
      {"int", ExifInterface.TAG_CUSTOM_RENDERED},
      {"string", ExifInterface.TAG_DATETIME_DIGITIZED},
      {"string", ExifInterface.TAG_DATETIME_ORIGINAL},
      {"string", ExifInterface.TAG_DEVICE_SETTING_DESCRIPTION},
      {"double", ExifInterface.TAG_DIGITAL_ZOOM_RATIO},
      {"string", ExifInterface.TAG_EXIF_VERSION},
      {"double", ExifInterface.TAG_EXPOSURE_BIAS_VALUE},
      {"double", ExifInterface.TAG_EXPOSURE_INDEX},
      {"int", ExifInterface.TAG_EXPOSURE_MODE},
      {"int", ExifInterface.TAG_EXPOSURE_PROGRAM},
      {"double", ExifInterface.TAG_EXPOSURE_TIME},
      {"double", ExifInterface.TAG_F_NUMBER},
      {"string", ExifInterface.TAG_FILE_SOURCE},
      {"int", ExifInterface.TAG_FLASH},
      {"double", ExifInterface.TAG_FLASH_ENERGY},
      {"string", ExifInterface.TAG_FLASHPIX_VERSION},
      {"double", ExifInterface.TAG_FOCAL_LENGTH},
      {"int", ExifInterface.TAG_FOCAL_LENGTH_IN_35MM_FILM},
      {"int", ExifInterface.TAG_FOCAL_PLANE_RESOLUTION_UNIT},
      {"double", ExifInterface.TAG_FOCAL_PLANE_X_RESOLUTION},
      {"double", ExifInterface.TAG_FOCAL_PLANE_Y_RESOLUTION},
      {"int", ExifInterface.TAG_GAIN_CONTROL},
      {"int", ExifInterface.TAG_ISO_SPEED_RATINGS},
      {"string", ExifInterface.TAG_IMAGE_UNIQUE_ID},
      {"int", ExifInterface.TAG_LIGHT_SOURCE},
      {"string", ExifInterface.TAG_MAKER_NOTE},
      {"double", ExifInterface.TAG_MAX_APERTURE_VALUE},
      {"int", ExifInterface.TAG_METERING_MODE},
      {"int", ExifInterface.TAG_NEW_SUBFILE_TYPE},
      {"string", ExifInterface.TAG_OECF},
      {"int", ExifInterface.TAG_PIXEL_X_DIMENSION},
      {"int", ExifInterface.TAG_PIXEL_Y_DIMENSION},
      {"string", ExifInterface.TAG_RELATED_SOUND_FILE},
      {"int", ExifInterface.TAG_SATURATION},
      {"int", ExifInterface.TAG_SCENE_CAPTURE_TYPE},
      {"string", ExifInterface.TAG_SCENE_TYPE},
      {"int", ExifInterface.TAG_SENSING_METHOD},
      {"int", ExifInterface.TAG_SHARPNESS},
      {"double", ExifInterface.TAG_SHUTTER_SPEED_VALUE},
      {"string", ExifInterface.TAG_SPATIAL_FREQUENCY_RESPONSE},
      {"string", ExifInterface.TAG_SPECTRAL_SENSITIVITY},
      {"int", ExifInterface.TAG_SUBFILE_TYPE},
      {"string", ExifInterface.TAG_SUBSEC_TIME},
      {"string", ExifInterface.TAG_SUBSEC_TIME_DIGITIZED},
      {"string", ExifInterface.TAG_SUBSEC_TIME_ORIGINAL},
      {"int", ExifInterface.TAG_SUBJECT_AREA},
      {"double", ExifInterface.TAG_SUBJECT_DISTANCE},
      {"int", ExifInterface.TAG_SUBJECT_DISTANCE_RANGE},
      {"int", ExifInterface.TAG_SUBJECT_LOCATION},
      {"string", ExifInterface.TAG_USER_COMMENT},
      {"int", ExifInterface.TAG_WHITE_BALANCE},
      {"int", ExifInterface.TAG_GPS_ALTITUDE_REF},
      {"string", ExifInterface.TAG_GPS_AREA_INFORMATION},
      {"double", ExifInterface.TAG_GPS_DOP},
      {"string", ExifInterface.TAG_GPS_DATESTAMP},
      {"double", ExifInterface.TAG_GPS_DEST_BEARING},
      {"string", ExifInterface.TAG_GPS_DEST_BEARING_REF},
      {"double", ExifInterface.TAG_GPS_DEST_DISTANCE},
      {"string", ExifInterface.TAG_GPS_DEST_DISTANCE_REF},
      {"double", ExifInterface.TAG_GPS_DEST_LATITUDE},
      {"string", ExifInterface.TAG_GPS_DEST_LATITUDE_REF},
      {"double", ExifInterface.TAG_GPS_DEST_LONGITUDE},
      {"string", ExifInterface.TAG_GPS_DEST_LONGITUDE_REF},
      {"int", ExifInterface.TAG_GPS_DIFFERENTIAL},
      {"double", ExifInterface.TAG_GPS_IMG_DIRECTION},
      {"string", ExifInterface.TAG_GPS_IMG_DIRECTION_REF},
      {"string", ExifInterface.TAG_GPS_LATITUDE_REF},
      {"string", ExifInterface.TAG_GPS_LONGITUDE_REF},
      {"string", ExifInterface.TAG_GPS_MAP_DATUM},
      {"string", ExifInterface.TAG_GPS_MEASURE_MODE},
      {"string", ExifInterface.TAG_GPS_PROCESSING_METHOD},
      {"string", ExifInterface.TAG_GPS_SATELLITES},
      {"double", ExifInterface.TAG_GPS_SPEED},
      {"string", ExifInterface.TAG_GPS_SPEED_REF},
      {"string", ExifInterface.TAG_GPS_STATUS},
      {"string", ExifInterface.TAG_GPS_TIMESTAMP},
      {"double", ExifInterface.TAG_GPS_TRACK},
      {"string", ExifInterface.TAG_GPS_TRACK_REF},
      {"string", ExifInterface.TAG_GPS_VERSION_ID},
      {"string", ExifInterface.TAG_INTEROPERABILITY_INDEX},
      {"int", ExifInterface.TAG_THUMBNAIL_IMAGE_LENGTH},
      {"int", ExifInterface.TAG_THUMBNAIL_IMAGE_WIDTH},
      {"int", ExifInterface.TAG_DNG_VERSION},
      {"int", ExifInterface.TAG_DEFAULT_CROP_SIZE},
      {"int", ExifInterface.TAG_ORF_PREVIEW_IMAGE_START},
      {"int", ExifInterface.TAG_ORF_PREVIEW_IMAGE_LENGTH},
      {"int", ExifInterface.TAG_ORF_ASPECT_FRAME},
      {"int", ExifInterface.TAG_RW2_SENSOR_BOTTOM_BORDER},
      {"int", ExifInterface.TAG_RW2_SENSOR_LEFT_BORDER},
      {"int", ExifInterface.TAG_RW2_SENSOR_RIGHT_BORDER},
      {"int", ExifInterface.TAG_RW2_SENSOR_TOP_BORDER},
      {"int", ExifInterface.TAG_RW2_ISO},
  };
  static final int REQUEST_LAUNCH_CAMERA = 1;
  static final int REQUEST_LAUNCH_IMAGE_LIBRARY = 2;
  private static final int DEFAULT_QUALITY = 100;
  final String OPTION_QUALITY = "quality";
  final String OPTION_ALLOWS_EDITING = "allowsEditing";
  final String OPTION_MEDIA_TYPES = "mediaTypes";
  final String OPTION_ASPECT = "aspect";
  final String OPTION_BASE64 = "base64";
  final String OPTION_EXIF = "exif";
  private Uri mCameraCaptureURI;
  private Promise mPromise;
  private Boolean mLaunchedCropper = false;
  private Bundle mExifData = null;
  private Integer quality = null;
  private Boolean allowsEditing = false;
  private ArrayList<Object> forceAspect = null;
  private Boolean base64 = false;
  private String mediaTypes = null;
  private Boolean exif = false;
  private WeakReference<Activity> mExperienceActivity;
  private boolean mInitialized = false;
  private Context mContext;
  private ModuleRegistry mModuleRegistry;
  private ImageLoader mImageLoader;

  public ImagePickerModule(Context context) {
    super(context);
    mContext = context;
  }

  @Override
  public String getName() {
    return "ExponentImagePicker";
  }

  private boolean readOptions(final Map<String, Object> options, final Promise promise) {
    if (options.containsKey((OPTION_QUALITY))) {
      quality = (int) (((Double) options.get(OPTION_QUALITY)) * 100);
    }
    allowsEditing = options.containsKey(OPTION_ALLOWS_EDITING) && ((Boolean) options.get(OPTION_ALLOWS_EDITING));
    if (options.containsKey(OPTION_MEDIA_TYPES)) {
      mediaTypes = (String) options.get(OPTION_MEDIA_TYPES);
    } else {
      mediaTypes = "Images";
    }
    if (options.containsKey(OPTION_ASPECT)) {
      forceAspect = (ArrayList<Object>) options.get(OPTION_ASPECT);
      if (forceAspect.size() != 2 || !(forceAspect.get(0) instanceof Number) ||
          !(forceAspect.get(1) instanceof Number)) {
        promise.reject(new IllegalArgumentException("'aspect option must be of form [Number, Number]"));
        return false;
      }
    } else {
      forceAspect = null;
    }
    base64 = options.containsKey(OPTION_BASE64) && ((Boolean) options.get(OPTION_BASE64));
    exif = options.containsKey(OPTION_EXIF) && (Boolean) options.get(OPTION_EXIF);
    return true;
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
    if (!readOptions(options, promise)) {
      return;
    }

    if (getExperienceActivity() == null) {
      promise.reject(ERR_MISSING_ACTIVITY, MISSING_ACTIVITY_MESSAGE);
      return;
    }

    final Intent cameraIntent = new Intent(mediaTypes.equals("Videos") ?
        MediaStore.ACTION_VIDEO_CAPTURE :
        MediaStore.ACTION_IMAGE_CAPTURE);
    if (cameraIntent.resolveActivity(getApplication(null).getPackageManager()) == null) {
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
          "ImagePicker", mediaTypes.equals("Videos") ? ".mp4" : ".jpg"));
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

    if (getExperienceActivity() == null) {
      promise.reject(ERR_MISSING_ACTIVITY, MISSING_ACTIVITY_MESSAGE);
      return;
    }

    Application application = getExperienceActivity().getApplication();

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
    cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, ImagePickerFileUtils.contentUriFromFile(imageFile, getApplication(null)));
    startActivityOnResult(cameraIntent, REQUEST_LAUNCH_CAMERA, promise);
  }

  // NOTE: Currently not reentrant / doesn't support concurrent requests
  @ExpoMethod
  public void launchImageLibraryAsync(final Map<String, Object> options, final Promise promise) {
    if (!readOptions(options, promise)) {
      return;
    }

    Intent libraryIntent = new Intent();

    if (mediaTypes.equals("Images")) {
      libraryIntent.setType("image/*");
    } else if (mediaTypes.equals("Videos")) {
      libraryIntent.setType("video/*");
    } else if (mediaTypes.equals("All")) {
      libraryIntent.setType("*/*");
      String[] mimetypes = {"image/*", "video/*"};
      libraryIntent.putExtra(Intent.EXTRA_MIME_TYPES, mimetypes);
    }

    mPromise = promise;

    libraryIntent.setAction(Intent.ACTION_GET_CONTENT);
    startActivityOnResult(libraryIntent, REQUEST_LAUNCH_IMAGE_LIBRARY, promise);
  }

  public void onActivityResult(final int requestCode, final int resultCode, final Intent intent) {
    if (requestCode == CropImage.CROP_IMAGE_ACTIVITY_REQUEST_CODE) {
      if (mLaunchedCropper) {
        mLaunchedCropper = false;
        final Promise promise = mPromise;
        mPromise = null;
        Bundle exifData = mExifData;
        mExifData = null;

        if (promise == null) {
          return;
        }
        if (resultCode != Activity.RESULT_OK) {
          Bundle response = new Bundle();
          response.putBoolean("cancelled", true);
          promise.resolve(response);
          return;
        }

        handleCropperResult(intent, promise, exifData);
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
      Bundle response = new Bundle();
      response.putBoolean("cancelled", true);
      if (requestCode == REQUEST_LAUNCH_CAMERA) {
        revokeUriPermissionForCamera();
      }
      promise.resolve(response);
      return;
    }

    AsyncTask.execute(new Runnable() {
      @Override
      public void run() {
        try {
          final Uri uri = requestCode == REQUEST_LAUNCH_CAMERA ? mCameraCaptureURI : intent.getData();
          final Bundle exifData = exif ? readExif(uri, promise) : null;

          if (getExperienceActivity() == null) {
            promise.reject(ERR_MISSING_ACTIVITY, MISSING_ACTIVITY_MESSAGE);
            return;
          }

          String type = ImagePickerFileUtils.getType(getExperienceActivity().getApplication().getContentResolver(), uri);

          if (type == null) {
            promise.reject(ERR_CAN_NOT_DEDUCE_TYPE, CAN_NOT_DEDUCE_TYPE_MESSAGE);
            return;
          }

          boolean isImage = type.contains("image");

          if (isImage) {
            String extension = ".jpg";
            Bitmap.CompressFormat compressFormat = Bitmap.CompressFormat.JPEG;
            if (type.contains("png")) {
              compressFormat = Bitmap.CompressFormat.PNG;
              extension = ".png";
            } else if (type.contains("gif")) {
              // If we allow editing, the result image won't ever be a GIF as the cropper doesn't support it.
              // Let's convert to PNG in such case.
              if (allowsEditing) {
                extension = ".png";
                compressFormat = Bitmap.CompressFormat.PNG;
              } else {
                extension = ".gif";
              }
            } else if (type.contains("bmp")) {
              // If we allow editing, the result image won't ever be a BMP as the cropper doesn't support it.
              // Let's convert to PNG in such case.
              if (allowsEditing) {
                extension = ".png";
                compressFormat = Bitmap.CompressFormat.PNG;
              } else {
                extension = ".bmp";
                compressFormat = null; //BMP is not compressed
              }
            } else if (!type.contains("jpeg")) {
              System.out.println(TAG + " Image type not supported. Falling back to JPEG instead.");
              extension = ".jpg";
            }

            // if the image is created by camera intent we don't need a new path - it's been already saved
            final String path = requestCode == REQUEST_LAUNCH_CAMERA ?
                uri.getPath() :
                ImagePickerFileUtils.generateOutputPath(mContext.getCacheDir(), "ImagePicker", extension);
            Uri fileUri = requestCode == REQUEST_LAUNCH_CAMERA ? uri : Uri.fromFile(new File(path));

            if (allowsEditing) {
              mLaunchedCropper = true;
              mPromise = promise; // Need promise again later
              mExifData = exifData; // Need EXIF data later

              CropImage.ActivityBuilder cropImage = CropImage.activity(uri);
              if (forceAspect != null) {
                cropImage
                    .setAspectRatio(((Number) forceAspect.get(0)).intValue(), ((Number) forceAspect.get(1)).intValue())
                    .setFixAspectRatio(true)
                    .setInitialCropWindowPaddingRatio(0);
              }
              cropImage
                  .setOutputUri(fileUri)
                  .setOutputCompressFormat(compressFormat)
                  .setOutputCompressQuality(quality == null ? DEFAULT_QUALITY : quality)
                  .start(getExperienceActivity());
            } else {
              // No modification requested
              if (quality == null || quality == 100) {
                try (ByteArrayOutputStream out = base64 ? new ByteArrayOutputStream() : null) {
                  File file = new File(path);
                  copyImage(uri, file, out);

                  BitmapFactory.Options options = new BitmapFactory.Options();
                  options.inJustDecodeBounds = true;
                  BitmapFactory.decodeFile(file.getAbsolutePath(), options);

                  returnImageResult(exifData, file.toURI().toString(), options.outWidth, options.outHeight, out, promise);
                } catch (IOException e) {
                  promise.reject("E_COPY_ERR", "Could not copy image from " + uri + ": " + e.getMessage(), e);
                }
              } else {
                final Bitmap.CompressFormat finalCompressFormat = compressFormat;
                mImageLoader.loadImageForManipulationFromURL(uri.toString(), new ImageLoader.ResultListener() {
                  @Override
                  public void onSuccess(@NonNull Bitmap bitmap) {
                    int width = bitmap.getWidth();
                    int height = bitmap.getHeight();

                    try (ByteArrayOutputStream out = base64 ? new ByteArrayOutputStream() : null) {
                      File file = new File(path);

                      // We have an image and should compress its quality
                      saveImage(bitmap, finalCompressFormat, file, out);
                      returnImageResult(exifData, file.toURI().toString(), width, height, out, promise);
                    } catch (IOException e) {
                      // This exception will come from `ByteArrayOutputStream.close()` method.
                      // We have already resolve promise.
                      e.printStackTrace();
                    }
                  }

                  @Override
                  public void onFailure(@Nullable Throwable cause) {
                    promise.reject("E_READ_ERR", "Could not open an image from " + uri);
                    if (requestCode == REQUEST_LAUNCH_CAMERA) {
                      revokeUriPermissionForCamera();
                    }
                  }
                });
              }
            }
          } else {
            Bundle response = new Bundle();
            response.putString("uri", Uri.fromFile(new File(writeVideo(uri))).toString());
            response.putBoolean("cancelled", false);
            response.putString("type", "video");

            MediaMetadataRetriever retriever = new MediaMetadataRetriever();
            try {
              retriever.setDataSource(mContext, uri);
              response.putInt("width", Integer.valueOf(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)));
              response.putInt("height", Integer.valueOf(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)));
              response.putInt("rotation", Integer.valueOf(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)));
              response.putInt("duration", Integer.valueOf(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)));
            } catch (IllegalArgumentException | SecurityException e) {
              System.out.println(ImagePickerModule.class.getSimpleName() + " Could not read metadata from video: " + uri);
            }
            promise.resolve(response);
          }
        } catch (Exception e) {
          e.printStackTrace();
        }
      }
    });
  }

  /**
   * Compress and save the {@code bitmap} to {@code file}, optionally saving it in {@code out} if
   * base64 is requested.
   *
   * @param bitmap         bitmap to be saved
   * @param compressFormat compression format to save the image in
   * @param file           file to save the image to
   * @param out            if not null, the stream to save the image to
   */
  private void saveImage(Bitmap bitmap, Bitmap.CompressFormat compressFormat, File file,
                         ByteArrayOutputStream out) {
    writeImage(bitmap, file.getPath(), compressFormat);

    if (base64) {
      bitmap.compress(Bitmap.CompressFormat.JPEG, quality, out);
    }
  }

  /**
   * Copy the image file from {@code originalUri} to {@code file}, optionally saving it in
   * {@code out} if base64 is requested.
   *
   * @param originalUri uri to the file to copy the data from
   * @param file        file to save the image to
   * @param out         if not null, the stream to save the image to
   */
  private void copyImage(Uri originalUri, File file, ByteArrayOutputStream out)
      throws IOException {
    try (InputStream is = Objects.requireNonNull(
        mContext.getApplicationContext().getContentResolver().openInputStream(originalUri))) {

      if (out != null) {
        IOUtils.copy(is, out);
      }

      if (originalUri.compareTo(Uri.fromFile(file)) != 0) { // do not copy file over the same file
        try (FileOutputStream fos = new FileOutputStream(file)) {
          if (out != null) {
            fos.write(out.toByteArray());
          } else {
            IOUtils.copy(is, fos);
          }
        }
      }
    }
  }

  private void handleCropperResult(Intent intent, Promise promise, Bundle exifData) {
    CropImage.ActivityResult result = CropImage.getActivityResult(intent);
    int width, height;
    int rot = result.getRotation() % 360;
    if (rot < 0) {
      rot += 360;
    }
    if (rot == 0 || rot == 180) { // Rotation is right-angled only
      width = result.getCropRect().width();
      height = result.getCropRect().height();
    } else {
      width = result.getCropRect().height();
      height = result.getCropRect().width();
    }

    try (InputStream in = new FileInputStream(result.getUri().getPath())) {
      if (base64) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
          // `CropImage` nullifies the `result.getBitmap()` after it writes out to a file, so
          // we have to read back..
          IOUtils.copy(in, out);
          returnImageResult(exifData, result.getUri().toString(), width, height, out, promise);
        }
      } else {
        returnImageResult(exifData, result.getUri().toString(), width, height, null, promise);
      }
    } catch (IOException e) {
      promise.reject(e);
    }
  }

  private void returnImageResult(Bundle exifData, String uri, int width, int height,
                                 ByteArrayOutputStream base64OutputStream, Promise promise) {
    Bundle response = new Bundle();
    response.putString("uri", uri);
    if (base64) {
      response.putString("base64", Base64.encodeToString(base64OutputStream.toByteArray(), Base64.NO_WRAP));
    }
    response.putInt("width", width);
    response.putInt("height", height);
    if (exifData != null) {
      response.putBundle("exif", exifData);
    }
    response.putBoolean("cancelled", false);
    response.putString("type", "image");

    promise.resolve(response);
  }

  private void writeImage(Bitmap image, String path, Bitmap.CompressFormat compressFormat) {
    try (FileOutputStream out = new FileOutputStream(path)) {
      image.compress(compressFormat, quality, out);
    } catch (Exception e) {
      e.printStackTrace();
    }
  }

  private String writeVideo(Uri uri) {
    String path = null;
    try (InputStream in = Objects.requireNonNull(getApplication(mPromise).getContentResolver().openInputStream(uri))) {
      path = ImagePickerFileUtils.generateOutputPath(mContext.getCacheDir(), "ImagePicker", ".mp4");

      try (OutputStream out = new FileOutputStream(path)) {
        byte[] buffer = new byte[4096];
        int bytesRead;
        while ((bytesRead = in.read(buffer)) > 0) {
          out.write(buffer, 0, bytesRead);
        }
      }
    } catch (IOException e) {
      e.printStackTrace();
    }

    return path;
  }

  private Bundle readExif(Uri uri, Promise promise) throws IOException {
    Application application = getApplication(promise);
    if (application == null) {
      return null;
    }

    Bundle exifMap = new Bundle();
    try (InputStream in = Objects.requireNonNull(application.getContentResolver().openInputStream(uri))) {
      ExifInterface exifInterface = new ExifInterface(in);

      for (String[] tagInfo : exifTags) {
        String name = tagInfo[1];
        if (exifInterface.getAttribute(name) != null) {
          String type = tagInfo[0];
          switch (type) {
            case "string":
              exifMap.putString(name, exifInterface.getAttribute(name));
              break;
            case "int":
              exifMap.putInt(name, exifInterface.getAttributeInt(name, 0));
              break;
            case "double":
              exifMap.putDouble(name, exifInterface.getAttributeDouble(name, 0));
              break;
          }
        }
      }

      // Explicitly get latitude, longitude, altitude with their specific accessor functions.
      double[] latLong = exifInterface.getLatLong();
      if (latLong != null) {
        exifMap.putDouble(ExifInterface.TAG_GPS_LATITUDE, latLong[0]);
        exifMap.putDouble(ExifInterface.TAG_GPS_LONGITUDE, latLong[1]);
        exifMap.putDouble(ExifInterface.TAG_GPS_ALTITUDE, exifInterface.getAltitude(0));
      }
    }
    return exifMap;
  }

  private void revokeUriPermissionForCamera() {
    if (getApplication(null) == null) {
      return;
    }

    getApplication(null)
        .revokeUriPermission(
            mCameraCaptureURI,
            Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION
        );
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
    mImageLoader = moduleRegistry.getModule(ImageLoader.class);
  }

  private Activity getExperienceActivity() {
    if (!mInitialized) {
      mInitialized = true;
      ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
      mExperienceActivity = new WeakReference<>(activityProvider.getCurrentActivity());

      UIManager uiManager = mModuleRegistry.getModule(UIManager.class);
      uiManager.registerActivityEventListener(this);
    }
    return mExperienceActivity.get();
  }

  @Override
  public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
    if (getExperienceActivity() != null && activity == getExperienceActivity()) {
      this.onActivityResult(requestCode, resultCode, data); // another function
    }
  }

  @Override
  public void onNewIntent(Intent intent) {

  }

  private void startActivityOnResult(Intent intent, int requestCode, Promise promise) {
    if (getExperienceActivity() != null) {
      getExperienceActivity().startActivityForResult(intent, requestCode);
    } else {
      promise.reject(ERR_MISSING_ACTIVITY,
          MISSING_ACTIVITY_MESSAGE);
    }
  }

  private Application getApplication(Promise promise) {
    if (getExperienceActivity() == null) {
      if (promise != null) {
        promise.reject(ERR_MISSING_ACTIVITY, MISSING_ACTIVITY_MESSAGE);
      }
      return null;
    } else {
      return getExperienceActivity().getApplication();
    }
  }
}
