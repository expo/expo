package abi28_0_0.host.exp.exponent.modules.api.components.facedetector.tasks;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.ExifInterface;
import android.net.Uri;
import android.os.AsyncTask;
import android.util.Log;
import android.util.SparseArray;

import abi28_0_0.com.facebook.react.bridge.Arguments;
import abi28_0_0.com.facebook.react.bridge.Promise;
import abi28_0_0.com.facebook.react.bridge.ReadableMap;
import abi28_0_0.com.facebook.react.bridge.WritableArray;
import abi28_0_0.com.facebook.react.bridge.WritableMap;
import com.google.android.gms.vision.Frame;
import com.google.android.gms.vision.face.Face;

import java.io.File;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;

import abi28_0_0.host.exp.exponent.modules.api.components.facedetector.ExpoFaceDetector;
import abi28_0_0.host.exp.exponent.modules.api.components.facedetector.ExpoFrame;
import abi28_0_0.host.exp.exponent.modules.api.components.facedetector.ExpoFrameFactory;
import abi28_0_0.host.exp.exponent.modules.api.components.facedetector.FaceDetectorUtils;

public class FileFaceDetectionAsyncTask extends AsyncTask<Void, Void, SparseArray<Face>> {
  private static final String ERROR_TAG = "E_FACE_DETECTION_FAILED";

  private static final String MODE_OPTION_KEY = "mode";
  private static final String DETECT_LANDMARKS_OPTION_KEY = "detectLandmarks";
  private static final String RUN_CLASSIFICATIONS_OPTION_KEY = "runClassifications";

  private String mUri;
  private String mPath;
  private Promise mPromise;
  private int mWidth = 0;
  private int mHeight = 0;
  private Context mContext;
  private ReadableMap mOptions;
  private int mOrientation = ExifInterface.ORIENTATION_UNDEFINED;
  private ExpoFaceDetector mExpoFaceDetector;

  public FileFaceDetectionAsyncTask(Context context, ReadableMap options, Promise promise) {
    mUri = options.getString("uri");
    mPromise = promise;
    mOptions = options;
    mContext = context;
  }

  @Override
  protected void onPreExecute() {
    if (mUri == null) {
      mPromise.reject(ERROR_TAG, "You have to provide an URI of an image.");
      cancel(true);
      return;
    }

    Uri uri = Uri.parse(mUri);
    mPath = uri.getPath();

    if (mPath == null) {
      mPromise.reject(ERROR_TAG, "Invalid URI provided: `" + mUri + "`.");
      cancel(true);
      return;
    }

    // We have to check if the requested image is in a directory safely accessible by our app.
    boolean fileIsInSafeDirectories =
          mPath.startsWith(mContext.getCacheDir().getPath()) || mPath.startsWith(mContext.getFilesDir().getPath());

    if (!fileIsInSafeDirectories) {
      mPromise.reject(ERROR_TAG, "The image has to be in the local app's directories.");
      cancel(true);
      return;
    }

    if(!new File(mPath).exists()) {
      mPromise.reject(ERROR_TAG, "The file does not exist. Given path: `" + mPath + "`.");
      cancel(true);
    }
  }

  @Override
  protected SparseArray<Face> doInBackground(Void... voids) {
    if (isCancelled()) {
      return null;
    }

    mExpoFaceDetector = detectorForOptions(mOptions, mContext);
    Bitmap bitmap = BitmapFactory.decodeFile(mPath);
    mWidth = bitmap.getWidth();
    mHeight = bitmap.getHeight();

    try {
      ExifInterface exif = new ExifInterface(mPath);
      mOrientation = exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_UNDEFINED);
    } catch (IOException e) {
      Log.e(ERROR_TAG, "Reading orientation from file `" + mPath + "` failed.", e);
    }

    ExpoFrame frame = ExpoFrameFactory.buildFrame(bitmap);
    return mExpoFaceDetector.detect(frame);
  }

  @Override
  protected void onPostExecute(SparseArray<Face> faces) {
    super.onPostExecute(faces);
    WritableMap result = Arguments.createMap();
    WritableArray facesArray = Arguments.createArray();

    for(int i = 0; i < faces.size(); i++) {
      Face face = faces.valueAt(i);
      WritableMap encodedFace = FaceDetectorUtils.serializeFace(face);
      encodedFace.putDouble("yawAngle", (-encodedFace.getDouble("yawAngle") + 360) % 360);
      encodedFace.putDouble("rollAngle", (-encodedFace.getDouble("rollAngle") + 360) % 360);
      facesArray.pushMap(encodedFace);
    }

    result.putArray("faces", facesArray);

    WritableMap image = Arguments.createMap();
    image.putInt("width", mWidth);
    image.putInt("height", mHeight);
    image.putInt("orientation", mOrientation);
    image.putString("uri", mUri);
    result.putMap("image", image);

    mExpoFaceDetector.release();
    mPromise.resolve(result);
  }

  private static ExpoFaceDetector detectorForOptions(ReadableMap options, Context context) {
    ExpoFaceDetector detector = new ExpoFaceDetector(context);
    detector.setTrackingEnabled(false);

    if(options.hasKey(MODE_OPTION_KEY)) {
      detector.setMode(options.getInt(MODE_OPTION_KEY));
    }

    if(options.hasKey(RUN_CLASSIFICATIONS_OPTION_KEY)) {
      detector.setClassificationType(options.getInt(RUN_CLASSIFICATIONS_OPTION_KEY));
    }

    if(options.hasKey(DETECT_LANDMARKS_OPTION_KEY)) {
      detector.setLandmarkType(options.getInt(DETECT_LANDMARKS_OPTION_KEY));
    }

    return detector;
  }
}
