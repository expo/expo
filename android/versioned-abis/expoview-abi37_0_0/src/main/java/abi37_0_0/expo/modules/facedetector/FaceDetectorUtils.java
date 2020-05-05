package abi37_0_0.expo.modules.facedetector;

import android.graphics.Rect;
import android.os.Bundle;

import com.google.android.gms.vision.face.Landmark;
import com.google.firebase.ml.vision.common.FirebaseVisionPoint;
import com.google.firebase.ml.vision.face.FirebaseVisionFace;
import com.google.firebase.ml.vision.face.FirebaseVisionFaceLandmark;

public class FaceDetectorUtils {
  // All the landmarks reported by Google Mobile Vision in constants' order.
  // https://developers.google.com/android/reference/com/google/android/gms/vision/face/Landmark

  private enum LandmarkId {
    BOTTOM_MOUTH(Landmark.BOTTOM_MOUTH, "bottomMouthPosition"),
    LEFT_CHEEK(Landmark.LEFT_CHEEK, "leftCheekPosition"),
    LEFT_EAR(Landmark.LEFT_EAR, "leftEarPosition"),
    LEFT_EAR_TIP(Landmark.LEFT_EAR_TIP, "leftEarTipPosition"),
    LEFT_EYE(Landmark.LEFT_EYE, "leftEyePosition"),
    LEFT_MOUTH(Landmark.LEFT_MOUTH, "leftMouthPosition"),
    NOSE_BASE(Landmark.NOSE_BASE, "noseBasePosition"),
    RIGHT_CHEEK(Landmark.RIGHT_CHEEK, "rightCheekPosition"),
    RIGHT_EAR(Landmark.RIGHT_EAR, "rightEarPosition"),
    RIGHT_EAR_TIP(Landmark.RIGHT_EAR_TIP, "rightEarTipPosition"),
    RIGHT_EYE(Landmark.RIGHT_EYE, "rightEyePosition"),
    RIGHT_MOUTH(Landmark.RIGHT_MOUTH, "rightMouthPosition");

    private int id;
    private String name;

    LandmarkId(int id, String name) {
      this.id = id;
      this.name = name;
    }
  }

  public static Bundle serializeFace(FirebaseVisionFace face) {
    return serializeFace(face, 1, 1);
  }

  public static Bundle serializeFace(FirebaseVisionFace face, double scaleX, double scaleY) {
    Bundle encodedFace = new Bundle();
    encodedFace.putInt("faceID", face.getTrackingId());
    encodedFace.putDouble("rollAngle", face.getHeadEulerAngleZ());
    encodedFace.putDouble("yawAngle", face.getHeadEulerAngleY());

    if (face.getSmilingProbability() >= 0) {
      encodedFace.putDouble("smilingProbability", face.getSmilingProbability());
    }
    if (face.getLeftEyeOpenProbability() >= 0) {
      encodedFace.putDouble("leftEyeOpenProbability", face.getLeftEyeOpenProbability());
    }
    if (face.getRightEyeOpenProbability() >= 0) {
      encodedFace.putDouble("rightEyeOpenProbability", face.getRightEyeOpenProbability());
    }

    for (LandmarkId id : LandmarkId.values()) {
      FirebaseVisionFaceLandmark faceLandmark = face.getLandmark(id.id);
      if (faceLandmark != null) {
        encodedFace.putBundle(id.name, mapFromPoint(faceLandmark.getPosition(), scaleX, scaleY));
      }
    }

    Rect box = face.getBoundingBox();

    Bundle origin = new Bundle(2);
    origin.putDouble("x", box.left * scaleX);
    origin.putDouble("y", box.top * scaleY);

    Bundle size = new Bundle(2);
    size.putDouble("width", (box.right - box.left) * scaleX);
    size.putDouble("height", (box.bottom - box.top) * scaleY);

    Bundle bounds = new Bundle(2);
    bounds.putBundle("origin", origin);
    bounds.putBundle("size", size);

    encodedFace.putBundle("bounds", bounds);

    return mirrorRollAngle(encodedFace);
  }

  public static Bundle rotateFaceX(Bundle face, int sourceWidth, double scaleX) {
    Bundle faceBounds = face.getBundle("bounds");

    Bundle oldOrigin = faceBounds.getBundle("origin");
    Bundle mirroredOrigin = positionMirroredHorizontally(oldOrigin, sourceWidth, scaleX);

    double translateX = -faceBounds.getBundle("size").getDouble("width");
    Bundle translatedMirroredOrigin = positionTranslatedHorizontally(mirroredOrigin, translateX);

    Bundle newBounds = new Bundle(faceBounds);
    newBounds.putBundle("origin", translatedMirroredOrigin);

    for (LandmarkId id : LandmarkId.values()) {
      Bundle landmark = face.getBundle(id.name);
      if (landmark != null) {
        Bundle mirroredPosition = positionMirroredHorizontally(landmark, sourceWidth, scaleX);
        face.putBundle(id.name, mirroredPosition);
      }
    }

    face.putBundle("bounds", newBounds);

    return mirrorYawAngle(mirrorRollAngle(face));
  }

  public static Bundle mirrorRollAngle(Bundle face) {
    face.putDouble("rollAngle", (-face.getDouble("rollAngle") + 360) % 360);
    return face;
  }

  public static Bundle mirrorYawAngle(Bundle face) {
    face.putDouble("yawAngle", (-face.getDouble("yawAngle") + 360) % 360);
    return face;
  }

  public static Bundle mapFromPoint(FirebaseVisionPoint point, double scaleX, double scaleY) {
    Bundle map = new Bundle();
    map.putDouble("x", point.getX() * scaleX);
    map.putDouble("y", point.getY() * scaleY);
    return map;
  }

  public static Bundle positionTranslatedHorizontally(Bundle position, double translateX) {
    Bundle newPosition = new Bundle(position);
    newPosition.putDouble("x", position.getDouble("x") + translateX);
    return newPosition;
  }

  public static Bundle positionMirroredHorizontally(Bundle position, int containerWidth, double scaleX) {
    Bundle newPosition = new Bundle(position);
    newPosition.putDouble("x", valueMirroredHorizontally(position.getDouble("x"), containerWidth, scaleX));
    return newPosition;
  }

  public static double valueMirroredHorizontally(double elementX, int containerWidth, double scaleX) {
    return -elementX + (containerWidth * scaleX);
  }
}
