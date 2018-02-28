package abi22_0_0.host.exp.exponent.modules.api.components.camera;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Matrix;
import android.media.CamcorderProfile;
import android.os.Build;
import android.support.media.ExifInterface;
import android.util.Base64;
import android.view.View;

import abi22_0_0.com.facebook.react.bridge.Arguments;
import abi22_0_0.com.facebook.react.bridge.LifecycleEventListener;
import abi22_0_0.com.facebook.react.bridge.Promise;
import abi22_0_0.com.facebook.react.bridge.ReadableMap;
import abi22_0_0.com.facebook.react.bridge.WritableMap;
import abi22_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi22_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;
import com.google.android.cameraview.CameraView;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Map;
import java.util.Queue;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

import host.exp.exponent.utils.ExpFileUtils;
import io.fabric.sdk.android.services.concurrency.AsyncTask;
import abi22_0_0.host.exp.exponent.modules.api.ImagePickerModule;

public class ExpoCameraView extends CameraView implements LifecycleEventListener {

  private RCTEventEmitter mEventEmitter;
  private Queue<Promise> mPictureTakenPromises = new ConcurrentLinkedQueue<>();
  private Map<Promise, ReadableMap> mPictureTakenOptions = new ConcurrentHashMap<>();
  private Promise mVideoRecordedPromise;

  public ExpoCameraView(ThemedReactContext themedReactContext) {
    super(themedReactContext, false);

    themedReactContext.addLifecycleEventListener(this);
    mEventEmitter = themedReactContext.getJSModule(RCTEventEmitter.class);

    addCallback(new Callback() {
      @Override
      public void onCameraOpened(CameraView cameraView) {
        mEventEmitter.receiveEvent(getId(), CameraViewManager.Events.EVENT_CAMERA_READY.toString(), Arguments.createMap());
      }

      @Override
      public void onPictureTaken(CameraView cameraView, final byte[] data) {
        final Promise promise = mPictureTakenPromises.poll();
        final ReadableMap options = mPictureTakenOptions.remove(promise);
        final int quality = (int) (options.getDouble("quality") * 100);
        AsyncTask.execute(new Runnable() {
          @Override
          public void run() {
            Bitmap bitmap = BitmapFactory.decodeByteArray(data, 0, data.length);
            WritableMap response = Arguments.createMap();
            try {
              ExifInterface exifInterface = new ExifInterface(new ByteArrayInputStream(data));
              int orientation = exifInterface.getAttributeInt(
                  ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_UNDEFINED);

              if (orientation != ExifInterface.ORIENTATION_UNDEFINED) {
                bitmap = rotateBitmap(bitmap, getImageRotation(orientation));
              }

              if (options.hasKey("exif")) {
                WritableMap exifData = getExifData(exifInterface);
                if (exifData != null) {
                  response.putMap("exif", exifData);
                }
              }
            } catch (IOException e) {
              e.printStackTrace();
            }

            response.putString("uri", ExpFileUtils.uriFromFile(new File(writeImage(bitmap, quality))).toString());
            if (options.hasKey("base64")) {
              ByteArrayOutputStream out = new ByteArrayOutputStream();
              bitmap.compress(Bitmap.CompressFormat.JPEG, quality, out);
              response.putString("base64", Base64.encodeToString(out.toByteArray(), Base64.DEFAULT));
            }
            response.putInt("width", bitmap.getWidth());
            response.putInt("height", bitmap.getHeight());
            promise.resolve(response);
          }
        });
      }

      @Override
      public void onVideoRecorded(CameraView cameraView, String path) {
        if (mVideoRecordedPromise != null) {
          if (path != null) {
            WritableMap result = Arguments.createMap();
            result.putString("uri", ExpFileUtils.uriFromFile(new File(path)).toString());
            mVideoRecordedPromise.resolve(result);
          } else {
            mVideoRecordedPromise.reject("E_RECORDING", "Couldn't stop recording - there is none in progress");
          }
          mVideoRecordedPromise = null;
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
    preview.layout(
        0,
        0,
        right - left,
        bottom - top
    );
  }

  @Override
  public void requestLayout() { }

  @Override
  public void onViewAdded(View child) {
    if (this.getView() == child || this.getView() == null) return;
    // remove and readd view to make sure it is in the back.
    // @TODO figure out why there was a z order issue in the first place and fix accordingly.
    this.removeView(this.getView());
    this.addView(this.getView(), 0);
  }

  private String getCacheFilename() throws IOException {
    File directory = new File(CameraModule.getScopedContextSingleton().getCacheDir() + File.separator + "Camera");
    ExpFileUtils.ensureDirExists(directory);
    String filename = UUID.randomUUID().toString();
    return directory + File.separator + filename;
  }

  public String writeImage(Bitmap image, int quality) {
    FileOutputStream out = null;
    String path = null;
    try {
      path = getCacheFilename() + ".jpg";
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

  public void takePicture(ReadableMap options, final Promise promise) {
    mPictureTakenPromises.add(promise);
    mPictureTakenOptions.put(promise, options);
    super.takePicture();
  }

  public void record(ReadableMap options, final Promise promise) {
    try {
      String path = getCacheFilename() + ".mp4";

      int maxDuration, maxFilesSize;
      if (options.hasKey("maxDuration")) {
        maxDuration = options.getInt("maxDuration");
      } else {
        maxDuration = -1;
      }
      if (options.hasKey("maxFileSize")) {
        maxFilesSize = options.getInt("maxFileSize");
      } else {
        maxFilesSize = -1;
      }

      CamcorderProfile profile = CamcorderProfile.get(CamcorderProfile.QUALITY_HIGH);
      if (options.hasKey("quality")) {
        profile = getCamcorderProfile(options.getInt("quality"));
      }

      boolean recordAudio = !options.hasKey("mute");

      if (super.record(path, maxDuration * 1000, maxFilesSize, recordAudio, profile)) {
        mVideoRecordedPromise = promise;
      } else {
        promise.reject("E_RECORDING_FAILED", "Starting video recording failed. Another recording might be in progress.");
      }
    } catch (IOException e) {
      promise.reject("E_RECORDING_FAILED", "Starting video recording failed - could not create video file.");
    }
  }

  public void stopRecording() {
    super.stopRecording();
  }

  @Override
  public void onHostResume() {
    if (!Build.FINGERPRINT.contains("generic")) {
      start();
    }
  }

  @Override
  public void onHostPause() {
    stop();
  }

  @Override
  public void onHostDestroy() {
    stop();
  }

  private Bitmap rotateBitmap(Bitmap source, int angle) {
    Matrix matrix = new Matrix();
    matrix.postRotate(angle);
    return Bitmap.createBitmap(source, 0, 0, source.getWidth(), source.getHeight(), matrix, true);
  }

  private CamcorderProfile getCamcorderProfile(int quality) {
    CamcorderProfile profile = CamcorderProfile.get(CamcorderProfile.QUALITY_HIGH);
    switch (quality) {
      case CameraModule.VIDEO_2160P:
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
          profile = CamcorderProfile.get(CamcorderProfile.QUALITY_2160P);
        }
        break;
      case CameraModule.VIDEO_1080P:
        profile = CamcorderProfile.get(CamcorderProfile.QUALITY_1080P);
        break;
      case CameraModule.VIDEO_720P:
        profile = CamcorderProfile.get(CamcorderProfile.QUALITY_720P);
        break;
      case CameraModule.VIDEO_480P:
        profile = CamcorderProfile.get(CamcorderProfile.QUALITY_480P);
        break;
      case CameraModule.VIDEO_4x3:
        profile = CamcorderProfile.get(CamcorderProfile.QUALITY_480P);
        profile.videoFrameWidth = 640;
        break;
    }
    return profile;
  }

  private int getImageRotation(int orientation) {
    int rotationDegrees = 0;
    switch (orientation) {
      case ExifInterface.ORIENTATION_ROTATE_90:
        rotationDegrees = 90;
        break;
      case ExifInterface.ORIENTATION_ROTATE_180:
        rotationDegrees = 180;
        break;
      case ExifInterface.ORIENTATION_ROTATE_270:
        rotationDegrees = 270;
        break;
    }
    return rotationDegrees;
  }

  private WritableMap getExifData(ExifInterface exifInterface) {
    WritableMap exifMap = Arguments.createMap();
    for (String[] tagInfo : ImagePickerModule.exifTags) {
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

    double[] latLong = exifInterface.getLatLong();
    if (latLong != null) {
      exifMap.putDouble(ExifInterface.TAG_GPS_LATITUDE, latLong[0]);
      exifMap.putDouble(ExifInterface.TAG_GPS_LONGITUDE, latLong[1]);
      exifMap.putDouble(ExifInterface.TAG_GPS_ALTITUDE, exifInterface.getAltitude(0));
    }

    return exifMap;
  }
}
