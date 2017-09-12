package versioned.host.exp.exponent.modules.api.components.camera;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Matrix;
import android.os.Build;
import android.support.media.ExifInterface;
import android.util.Base64;
import android.view.View;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.events.RCTEventEmitter;
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
import versioned.host.exp.exponent.modules.api.ImagePickerModule;

public class ExpoCameraView extends CameraView implements LifecycleEventListener {

  private RCTEventEmitter mEventEmitter;
  private Queue<Promise> pictureTakenPromises = new ConcurrentLinkedQueue<>();
  private Map<Promise, ReadableMap> pictureTakenOptions = new ConcurrentHashMap<>();

  public ExpoCameraView(ThemedReactContext themedReactContext) {
    super(themedReactContext);

    themedReactContext.addLifecycleEventListener(this);
    mEventEmitter = themedReactContext.getJSModule(RCTEventEmitter.class);

    addCallback(new Callback() {
      @Override
      public void onCameraOpened(CameraView cameraView) {
        mEventEmitter.receiveEvent(getId(), CameraViewManager.Events.EVENT_CAMERA_READY.toString(), Arguments.createMap());
      }

      @Override
      public void onPictureTaken(CameraView cameraView, final byte[] data) {
        final Promise promise = pictureTakenPromises.poll();
        final ReadableMap options = pictureTakenOptions.remove(promise);
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
    pictureTakenPromises.add(promise);
    pictureTakenOptions.put(promise, options);
    super.takePicture();
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
