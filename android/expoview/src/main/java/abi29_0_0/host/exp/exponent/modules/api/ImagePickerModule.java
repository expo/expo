package abi29_0_0.host.exp.exponent.modules.api;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.media.MediaMetadataRetriever;
import android.support.media.ExifInterface;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.MimeTypeMap;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.List;

import abi29_0_0.com.facebook.react.bridge.Arguments;
import abi29_0_0.com.facebook.react.bridge.Promise;
import abi29_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi29_0_0.com.facebook.react.bridge.ReactMethod;
import abi29_0_0.com.facebook.react.bridge.ReadableArray;
import abi29_0_0.com.facebook.react.bridge.ReadableMap;
import abi29_0_0.com.facebook.react.bridge.ReadableType;
import abi29_0_0.com.facebook.react.bridge.WritableMap;
import com.nostra13.universalimageloader.core.DisplayImageOptions;
import com.nostra13.universalimageloader.core.ImageLoader;
import com.nostra13.universalimageloader.core.assist.ImageScaleType;
import com.nostra13.universalimageloader.utils.IoUtils;
import com.theartofdev.edmodo.cropper.CropImage;

import host.exp.exponent.ActivityResultListener;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.utils.ExpFileUtils;
import host.exp.exponent.utils.ScopedContext;
import host.exp.expoview.Exponent;
import abi29_0_0.host.exp.exponent.modules.ExpoKernelServiceConsumerBaseModule;

public class ImagePickerModule extends ExpoKernelServiceConsumerBaseModule implements ActivityResultListener {

  public static final String TAG = "ExponentImagePicker";

  static final int REQUEST_LAUNCH_CAMERA = 1;
  static final int REQUEST_LAUNCH_IMAGE_LIBRARY = 2;

  static final int DEFAULT_QUALITY = 100;

  private Uri mCameraCaptureURI;
  private Promise mPromise;
  private Boolean mLaunchedCropper = false;
  private WritableMap mExifData = null;

  final String OPTION_QUALITY = "quality";
  final String OPTION_ALLOWS_EDITING = "allowsEditing";
  final String OPTION_MEDIA_TYPES = "mediaTypes";
  final String OPTION_ASPECT = "aspect";
  final String OPTION_BASE64 = "base64";
  final String OPTION_EXIF = "exif";

  private int quality = 100;
  private Boolean allowsEditing = false;
  private ReadableArray forceAspect = null;
  private Boolean base64 = false;
  private String mediaTypes = null;
  private Boolean exif = false;

  private ScopedContext mScopedContext;

  public ImagePickerModule(ReactApplicationContext reactContext, ScopedContext scopedContext,
                           ExperienceId experienceId) {
    super(reactContext, experienceId);
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
    } else {
      quality = DEFAULT_QUALITY;
    }
    allowsEditing = options.hasKey(OPTION_ALLOWS_EDITING) && options.getBoolean(OPTION_ALLOWS_EDITING);
    if (options.hasKey(OPTION_MEDIA_TYPES)) {
      mediaTypes = options.getString(OPTION_MEDIA_TYPES);
    }
    if (options.hasKey(OPTION_ASPECT)) {
      forceAspect = options.getArray(OPTION_ASPECT);
      if (forceAspect.size() != 2 || forceAspect.getType(0) != ReadableType.Number ||
              forceAspect.getType(1) != ReadableType.Number) {
        promise.reject(new IllegalArgumentException("'aspect option must be of form [Number, Number]"));
        return false;
      }
    } else {
      forceAspect = null;
    }
    base64 = options.hasKey(OPTION_BASE64) && options.getBoolean(OPTION_BASE64);
    exif = options.hasKey(OPTION_EXIF) && options.getBoolean(OPTION_EXIF);
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

    if (Exponent.getInstance().getPermissions(Manifest.permission.WRITE_EXTERNAL_STORAGE, this.experienceId) &&
        Exponent.getInstance().getPermissions(Manifest.permission.CAMERA, this.experienceId)) {
      launchCameraWithPermissionsGranted(promise, cameraIntent);
    } else {
      promise.reject(new SecurityException("User rejected permissions"));
    }
  }

  private void launchCameraWithPermissionsGranted(Promise promise, Intent cameraIntent) {
    File imageFile;
    try {
      imageFile = new File(ExpFileUtils.generateOutputPath(mScopedContext.getCacheDir(),
          "ImagePicker", ".jpg"));
    } catch (IOException e) {
      e.printStackTrace();
      return;
    }
    if (imageFile == null) {
      promise.reject(new IOException("Could not create image file."));
      return;
    }
    mCameraCaptureURI = ExpFileUtils.uriFromFile(imageFile);

    // fix for Permission Denial in Android < 21
    List<ResolveInfo> resolvedIntentActivities = Exponent.getInstance().getApplication()
      .getPackageManager().queryIntentActivities(cameraIntent, PackageManager.MATCH_DEFAULT_ONLY);

    for (ResolveInfo resolvedIntentInfo : resolvedIntentActivities) {
      String packageName = resolvedIntentInfo.activityInfo.packageName;
      Exponent.getInstance().getApplication().grantUriPermission(
        packageName,
        mCameraCaptureURI,
        Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION
      );
    }

    // camera intent needs a content URI but we need a file one
    cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, ExpFileUtils.contentUriFromFile(imageFile));
    mPromise = promise;
    Exponent.getInstance().getCurrentActivity().startActivityForResult(cameraIntent, REQUEST_LAUNCH_CAMERA);
  }

  // NOTE: Currently not reentrant / doesn't support concurrent requests
  @ReactMethod
  public void launchImageLibraryAsync(final ReadableMap options, final Promise promise) {
    if (!readOptions(options, promise)) {
      return;
    }

    Intent libraryIntent = new Intent();
    if (mediaTypes != null) {
      if (mediaTypes.equals("Images")) {
        libraryIntent.setType("image/*");
      } else if (mediaTypes.equals("Videos")) {
        libraryIntent.setType("video/*");
      } else if (mediaTypes.equals("All")) {
        libraryIntent.setType("*/*");
        String[] mimetypes = {"image/*", "video/*"};
        libraryIntent.putExtra(Intent.EXTRA_MIME_TYPES, mimetypes);
      }
    } else {
      libraryIntent.setType("image/*");
    }

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
        WritableMap exifData = mExifData;
        mExifData = null;

        if (promise == null) {
          return;
        }
        if (resultCode != Activity.RESULT_OK) {
          WritableMap response = Arguments.createMap();
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
      WritableMap response = Arguments.createMap();
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
          Uri uri = requestCode == REQUEST_LAUNCH_CAMERA ? mCameraCaptureURI : intent.getData();
          WritableMap exifData = exif ? readExif(uri) : null;
          String type = getReactApplicationContext().getContentResolver().getType(uri);

          // previous method sometimes returns null
          if (type == null) {
            String extension = MimeTypeMap.getFileExtensionFromUrl(uri.toString());
            if (extension != null) {
              type = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
            }
          }

          boolean isImage = type.contains("image");

          if (isImage) {
            String extension = ".jpg";
            Bitmap.CompressFormat compressFormat = Bitmap.CompressFormat.JPEG;
            if (type.contains("png")) {
              compressFormat = Bitmap.CompressFormat.PNG;
              extension = ".png";
            } else if (!type.contains("jpeg")) {
              EXL.w(TAG, "Image type not supported. Falling back to JPEG instead.");
              extension = ".jpg";
            }

            // if the image is created by camera intent we don't need a new path - it's been already saved
            String path = requestCode == REQUEST_LAUNCH_CAMERA ?
                uri.getPath() :
                ExpFileUtils.generateOutputPath(mScopedContext.getCacheDir(), "ImagePicker", extension);
            Uri fileUri = requestCode == REQUEST_LAUNCH_CAMERA ? uri : Uri.fromFile(new File(path));

            if (allowsEditing) {
              mLaunchedCropper = true;
              mPromise = promise; // Need promise again later
              mExifData = exifData; // Need EXIF data later

              CropImage.ActivityBuilder cropImage = CropImage.activity(uri);
              if (forceAspect != null) {
                cropImage
                    .setAspectRatio(forceAspect.getInt(0), forceAspect.getInt(1))
                    .setFixAspectRatio(true)
                    .setInitialCropWindowPaddingRatio(0);
              }
              cropImage
                  .setOutputUri(fileUri)
                  .setOutputCompressFormat(compressFormat)
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
                        .imageScaleType(ImageScaleType.NONE)
                        .build());
              } catch (Throwable e) {}
              if (bmp == null) {
                try {
                  bmp = ImageLoader.getInstance().loadImageSync(beforeDecode,
                      new DisplayImageOptions.Builder()
                          .cacheOnDisk(true)
                          .considerExifParams(true)
                          .imageScaleType(ImageScaleType.NONE)
                          .build());
                } catch (Throwable e) {}
              }
              if (bmp == null) {
                promise.reject(new IllegalStateException("Image decoding failed."));
                if (requestCode == REQUEST_LAUNCH_CAMERA) {
                  revokeUriPermissionForCamera();
                }
                return;
              }
              // create a cache file for an image picked from gallery
              if (!new File(path).exists()) {
                writeImage(bmp, path, compressFormat);
              }

              ByteArrayOutputStream out = null;
              if (base64) {
                out = new ByteArrayOutputStream();
                bmp.compress(Bitmap.CompressFormat.JPEG, quality, out);
              }

              returnImageResult(exifData, fileUri.toString(), bmp.getWidth(), bmp.getHeight(), out, promise);
            }
          } else {
            WritableMap response = Arguments.createMap();
            response.putString("uri", Uri.fromFile(new File(writeVideo(uri))).toString());
            response.putBoolean("cancelled", false);
            response.putString("type", "video");

            MediaMetadataRetriever retriever = new MediaMetadataRetriever();
            try {
              retriever.setDataSource(mScopedContext, uri);
              response.putInt("width", Integer.valueOf(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)));
              response.putInt("height", Integer.valueOf(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)));
              response.putInt("rotation", Integer.valueOf(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)));
              response.putInt("duration", Integer.valueOf(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)));
            } catch (IllegalArgumentException | SecurityException e){
              EXL.d(ImagePickerModule.class.getSimpleName(), "Could not read metadata from video: " + uri);
            }
            promise.resolve(response);
          }
        } catch (Exception e) {
          e.printStackTrace();
        }
      }
    });
  }

  private void handleCropperResult(Intent intent, Promise promise, WritableMap exifData) {
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
    ByteArrayOutputStream out = null;
    if (base64) {
      out = new ByteArrayOutputStream();
      try {
        // `CropImage` nullifies the `result.getBitmap()` after it writes out to a file, so
        // we have to read back...
        InputStream in = new FileInputStream(result.getUri().getPath());
        IoUtils.copyStream(in, out, null);
      } catch(IOException e) {
        promise.reject(e);
        return;
      }
    }
    returnImageResult(exifData, result.getUri().toString(), width, height, out, promise);
  }

  private void returnImageResult(WritableMap exifData, String uri, int width, int height,
                                 ByteArrayOutputStream base64OutputStream, Promise promise) {
    WritableMap response = Arguments.createMap();
    response.putString("uri", uri);
    if (base64) {
      response.putString("base64", Base64.encodeToString(base64OutputStream.toByteArray(), Base64.DEFAULT));
    }
    response.putInt("width", width);
    response.putInt("height", height);
    if (exifData != null) {
      response.putMap("exif", exifData);
    }
    response.putBoolean("cancelled", false);
    response.putString("type", "image");
    promise.resolve(response);
  }

  private void writeImage(Bitmap image, String path, Bitmap.CompressFormat compressFormat) {
    FileOutputStream out = null;
    try {
      out = new FileOutputStream(path);
      image.compress(compressFormat, quality, out);
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
  }

  private String writeVideo(Uri uri) {
    InputStream in;
    OutputStream out = null;
    String path = null;
    try {
      in = getReactApplicationContext().getContentResolver().openInputStream(uri);
      if (in != null) {
        byte[] buffer = new byte[in.available()];
        in.read(buffer);

        path = ExpFileUtils.generateOutputPath(mScopedContext.getCacheDir(), "ImagePicker", ".mp4");
        out = new FileOutputStream(path);
        out.write(buffer);
      }
    } catch (IOException e) {
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

  private WritableMap readExif(Uri uri) throws IOException {
    InputStream in = getReactApplicationContext().getContentResolver().openInputStream(uri);
    if (Build.VERSION.SDK_INT < 21) {
      return null;
    }

    ExifInterface exifInterface = new ExifInterface(in);
    WritableMap exifMap = Arguments.createMap();
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

    return exifMap;
  }

  private void revokeUriPermissionForCamera() {
    Exponent.getInstance().getApplication()
      .revokeUriPermission(
        mCameraCaptureURI,
        Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION
      );
  }

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
}
