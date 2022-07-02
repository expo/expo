package abi43_0_0.expo.modules.facedetector;

import android.graphics.PointF;
import android.graphics.Rect;
import android.os.Bundle;

import com.google.mlkit.vision.face.Face;
import com.google.mlkit.vision.face.FaceLandmark;

public class FaceDetectorUtils {
  // All the landmarks reported by Google Mobile Vision in constants' order.
  // https://developers.google.com/android/reference/com/google/android/gms/vision/face/Landmark

  private enum LandmarkId {
    BOTTOM_MOUTH(FaceLandmark.MOUTH_BOTTOM, "bottomMouthPosition"),
    RIGHT_MOUTH(FaceLandmark.MOUTH_RIGHT, "rightMouthPosition"),
    LEFT_MOUTH(FaceLandmark.MOUTH_LEFT, "leftMouthPosition"),
    LEFT_CHEEK(FaceLandmark.LEFT_CHEEK, "leftCheekPosition"),
    RIGHT_EYE(FaceLandmark.RIGHT_EYE, "rightEyePosition"),
    LEFT_EYE(FaceLandmark.LEFT_EYE, "leftEyePosition"),
    LEFT_EAR(FaceLandmark.LEFT_EAR, "leftEarPosition"),
    RIGHT_CHEEK(FaceLandmark.RIGHT_CHEEK, "rightCheekPosition"),
    RIGHT_EAR(FaceLandmark.RIGHT_EAR, "rightEarPosition"),
    NOSE_BASE(FaceLandmark.NOSE_BASE, "noseBasePosition");
//    LEFT_EAR_TIP(FaceLandmark.LEFT_EAR_TIP, "leftEarTipPosition"),
//    RIGHT_EAR_TIP(FaceLandmark.RIGHT_EAR_TIP, "rightEarTipPosition"),

    private int id;
    private String name;

    LandmarkId(int id, String name) {
      this.id = id;
      this.name = name;
    }
  }

  public static Bundle serializeFace(Face face) {
    return serializeFace(face, 1, 1);
  }

  public static Bundle serializeFace(Face face, double scaleX, double scaleY) {
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
      FaceLandmark faceLandmark = face.getLandmark(id.id);
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

  public static Bundle mapFromPoint(PointF point, double scaleX, double scaleY) {
    Bundle map = new Bundle();
    map.putDouble("x", point.x * scaleX);
    map.putDouble("y", point.y * scaleY);
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
