package abi34_0_0.expo.modules.facedetector.tasks;

import android.net.Uri;
import android.os.Bundle;
import androidx.exifinterface.media.ExifInterface;

import abi34_0_0.org.unimodules.interfaces.facedetector.FaceDetector;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;

public class FileFaceDetectionTask {
  private static final String ERROR_TAG = "E_FACE_DETECTION_FAILED";

  private FileFaceDetectionCompletionListener mListener;
  private int mWidth = 0;
  private int mHeight = 0;
  private int mOrientation = ExifInterface.ORIENTATION_UNDEFINED;
  private FaceDetector mExpoFaceDetector;
  private Uri mFilePath;

  public FileFaceDetectionTask(FaceDetector faceDetector, HashMap<String, Object> options, FileFaceDetectionCompletionListener promise) {
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
      ExifInterface exif = new ExifInterface(mFilePath.getPath());
      mOrientation = exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_UNDEFINED);

      if (mOrientation == ExifInterface.ORIENTATION_ROTATE_270
          || mOrientation == ExifInterface.ORIENTATION_ROTATE_90) {
        mWidth = exif.getAttributeInt(ExifInterface.TAG_IMAGE_LENGTH, ExifInterface.ORIENTATION_UNDEFINED);
        mHeight = exif.getAttributeInt(ExifInterface.TAG_IMAGE_WIDTH, ExifInterface.ORIENTATION_UNDEFINED);
      } else {
        mWidth = exif.getAttributeInt(ExifInterface.TAG_IMAGE_WIDTH, ExifInterface.ORIENTATION_UNDEFINED);
        mHeight = exif.getAttributeInt(ExifInterface.TAG_IMAGE_LENGTH, ExifInterface.ORIENTATION_UNDEFINED);
      }

      mExpoFaceDetector.detectFaces(mFilePath, this::processFaces, this::detectionError);
    } catch (IOException e) {
      mListener.reject(ERROR_TAG, "Problem while accesing file: `" + mFilePath.getPath() + "`.");
    }
  }

  private void processFaces(ArrayList<Bundle> faces) {
    resolveWithFaces(faces);
  }

  private void detectionError(Throwable error) {
    mListener.reject(ERROR_TAG, "Unable to detect faces!");
  }

  private void resolveWithFaces(ArrayList<Bundle> faces) {
    Bundle result = new Bundle();

    result.putParcelableArrayList("faces", faces);

    Bundle image = new Bundle();
    image.putInt("width", mWidth);
    image.putInt("height", mHeight);
    image.putInt("orientation", mOrientation);
    image.putString("uri", mFilePath.getPath());
    result.putBundle("image", image);

    mExpoFaceDetector.release();
    mListener.resolve(result);
  }


}
