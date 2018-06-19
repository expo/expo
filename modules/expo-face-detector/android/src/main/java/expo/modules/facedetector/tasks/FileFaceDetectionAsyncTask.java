package expo.modules.facedetector.tasks;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.support.media.ExifInterface;
import android.net.Uri;
import android.os.AsyncTask;
import android.util.Log;
import android.util.SparseArray;

import com.google.android.gms.vision.face.Face;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;

import expo.modules.facedetector.ExpoFaceDetector;
import expo.modules.facedetector.ExpoFrame;
import expo.modules.facedetector.ExpoFrameFactory;
import expo.modules.facedetector.FaceDetectorUtils;

public class FileFaceDetectionAsyncTask extends AsyncTask<Void, Void, SparseArray<Face>> {
  private static final String ERROR_TAG = "E_FACE_DETECTION_FAILED";

  private String mUri;
  private String mPath;
  private FileFaceDetectionCompletionListener mListener;
  private int mWidth = 0;
  private int mHeight = 0;
  private int mOrientation = ExifInterface.ORIENTATION_UNDEFINED;
  private ExpoFaceDetector mExpoFaceDetector;
  private FileInputStream mFileInputStream;

  public FileFaceDetectionAsyncTask(ExpoFaceDetector faceDetector, HashMap<String, Object> options, FileFaceDetectionCompletionListener promise) {
    mUri = (String) options.get("uri");
    mListener = promise;
    mExpoFaceDetector = faceDetector;
  }

  @Override
  protected void onPreExecute() {
    if (mUri == null) {
      mListener.reject(ERROR_TAG, "You have to provide an URI of an image.");
      cancel(true);
      return;
    }

    Uri uri = Uri.parse(mUri);
    mPath = uri.getPath();

    if (mPath == null) {
      mListener.reject(ERROR_TAG, "Invalid URI provided: `" + mUri + "`.");
      cancel(true);
      return;
    }

    try {
      mFileInputStream = new FileInputStream(uri.getPath());
    } catch (FileNotFoundException e) {
      mListener.reject(ERROR_TAG, "The file does not exist. Given path: `" + mPath + "`.");
      cancel(true);
    }
  }

  @Override
  protected SparseArray<Face> doInBackground(Void... voids) {
    if (isCancelled()) {
      return null;
    }

    Bitmap bitmap = BitmapFactory.decodeStream(mFileInputStream);
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
    Bundle result = new Bundle();
    ArrayList<Bundle> facesArray = new ArrayList<>();

    for(int i = 0; i < faces.size(); i++) {
      Face face = faces.valueAt(i);
      Bundle encodedFace = FaceDetectorUtils.serializeFace(face);
      encodedFace.putDouble("yawAngle", (-encodedFace.getDouble("yawAngle") + 360) % 360);
      encodedFace.putDouble("rollAngle", (-encodedFace.getDouble("rollAngle") + 360) % 360);
      facesArray.add(encodedFace);
    }

    result.putParcelableArrayList("faces", facesArray);

    Bundle image = new Bundle();
    image.putInt("width", mWidth);
    image.putInt("height", mHeight);
    image.putInt("orientation", mOrientation);
    image.putString("uri", mUri);
    result.putBundle("image", image);

    mExpoFaceDetector.release();
    mListener.resolve(result);
  }


}
