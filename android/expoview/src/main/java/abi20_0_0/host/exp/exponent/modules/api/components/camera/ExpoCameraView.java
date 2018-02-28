package abi20_0_0.host.exp.exponent.modules.api.components.camera;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.support.media.ExifInterface;
import android.view.View;

import abi20_0_0.com.facebook.react.bridge.Arguments;
import abi20_0_0.com.facebook.react.bridge.LifecycleEventListener;
import abi20_0_0.com.facebook.react.bridge.Promise;
import abi20_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi20_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;
import com.google.android.cameraview.CameraView;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Queue;
import java.util.UUID;
import java.util.concurrent.ConcurrentLinkedQueue;

import host.exp.exponent.utils.ExpFileUtils;
import io.fabric.sdk.android.services.concurrency.AsyncTask;

public class ExpoCameraView extends CameraView implements LifecycleEventListener {

  private RCTEventEmitter mEventEmitter;
  private Queue<Promise> pictureTakenPromises = new ConcurrentLinkedQueue<>();

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
        final Promise promise = pictureTakenPromises.poll();
        AsyncTask.execute(new Runnable() {
          @Override
          public void run() {
            Bitmap bitmap = BitmapFactory.decodeByteArray(data, 0, data.length);
            try {
              ExifInterface exifInterface = new ExifInterface(new ByteArrayInputStream(data));
              int orientation = exifInterface.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_UNDEFINED);

              if (orientation != ExifInterface.ORIENTATION_UNDEFINED) {
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
                bitmap = rotateBitmap(bitmap, rotationDegrees);
              }
            } catch (IOException e) {
              e.printStackTrace();
            }
            promise.resolve(
              ExpFileUtils.uriFromFile(
                new File(writeImage(bitmap))
              ).toString()
            );
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

  private String writeImage(Bitmap image) {
    FileOutputStream out = null;
    String path = null;
    try {
      path = getCacheFilename() + ".jpg";
      out = new FileOutputStream(path);
      image.compress(Bitmap.CompressFormat.JPEG, 100, out);
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

  public void takePicture(final Promise promise) {
    pictureTakenPromises.add(promise);
    super.takePicture();
  }

  @Override
  public void onHostResume() {
    start();
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
}
