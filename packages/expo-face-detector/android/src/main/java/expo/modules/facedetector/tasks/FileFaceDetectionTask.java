package expo.modules.facedetector.tasks;

import android.net.Uri;
import android.os.Bundle;
import android.support.media.ExifInterface;

import com.google.android.gms.tasks.Task;
import com.google.firebase.ml.vision.face.FirebaseVisionFace;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import expo.modules.facedetector.ExpoFaceDetector;
import expo.modules.facedetector.FaceDetectorUtils;

public class FileFaceDetectionTask {
  private static final String ERROR_TAG = "E_FACE_DETECTION_FAILED";

  private FileFaceDetectionCompletionListener mListener;
  private int mWidth = 0;
  private int mHeight = 0;
  private int mOrientation = ExifInterface.ORIENTATION_UNDEFINED;
  private ExpoFaceDetector mExpoFaceDetector;
  private Uri mFilePath;

  public FileFaceDetectionTask(ExpoFaceDetector faceDetector, HashMap<String, Object> options, FileFaceDetectionCompletionListener promise) {
    mFilePath = Uri.parse((String) options.get("uri"));
    mListener = promise;
    mExpoFaceDetector = faceDetector;
  }

  private boolean ensurePath() {
    if (mFilePath == null) {
      mListener.reject(ERROR_TAG, "You have to provide an URI of an image.");
      return false;
    }

    if (mFilePath.getPath() == null) {
      mListener.reject(ERROR_TAG, "Invalid URI provided: `" + mFilePath.getPath() + "`.");
      return false;
    }
    return true;
  }

  public void execute() {

    if (!ensurePath()) {
      return;
    }

    try {
      mExpoFaceDetector.detect(mFilePath, this::processFaces);
    } catch (IOException e) {
      mListener.reject(ERROR_TAG, "Problem while accesing file: `" + mFilePath.getPath() + "`.");
    }
  }

  private void processFaces(Task<List<FirebaseVisionFace>> faces) {
    if (faces.isComplete() && faces.isSuccessful()) {
      resolveWithFaces(faces.getResult());
    } else if (!faces.isSuccessful()) {
      mListener.reject(ERROR_TAG, "Unable to detect faces!");
    }
  }

  private void resolveWithFaces(List<FirebaseVisionFace> faces) {
    Bundle result = new Bundle();
    ArrayList<Bundle> facesArray = new ArrayList<>();

    if (faces != null) {
      for (FirebaseVisionFace face : faces) {
        Bundle encodedFace = FaceDetectorUtils.serializeFace(face);
        encodedFace.putDouble("yawAngle", (-encodedFace.getDouble("yawAngle") + 360) % 360);
        encodedFace.putDouble("rollAngle", (-encodedFace.getDouble("rollAngle") + 360) % 360);
        facesArray.add(encodedFace);
      }

      result.putParcelableArrayList("faces", facesArray);
    }

    mExpoFaceDetector.release();
    mListener.resolve(result);
  }


}
