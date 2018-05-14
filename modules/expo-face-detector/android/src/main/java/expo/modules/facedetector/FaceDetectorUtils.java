package expo.modules.facedetector;

import android.graphics.PointF;
import android.os.Bundle;

import com.google.android.gms.vision.face.Face;
import com.google.android.gms.vision.face.Landmark;

public class FaceDetectorUtils {
  // All the landmarks reported by Google Mobile Vision in constants' order.
  // https://developers.google.com/android/reference/com/google/android/gms/vision/face/Landmark
  private static final String[] landmarkNames = {
    "bottomMouthPosition", "leftCheekPosition", "leftEarPosition", "leftEarTipPosition",
      "leftEyePosition", "leftMouthPosition", "noseBasePosition", "rightCheekPosition",
      "rightEarPosition", "rightEarTipPosition", "rightEyePosition", "rightMouthPosition"
  };

  public static Bundle serializeFace(Face face) {
    return serializeFace(face, 1, 1);
  }

  public static Bundle serializeFace(Face face, double scaleX, double scaleY) {
    Bundle encodedFace = new Bundle();
    encodedFace.putInt("faceID", face.getId());
    encodedFace.putDouble("rollAngle", face.getEulerZ());
    encodedFace.putDouble("yawAngle", face.getEulerY());

    if (face.getIsSmilingProbability() >= 0) {
      encodedFace.putDouble("smilingProbability", face.getIsSmilingProbability());
    }
    if (face.getIsLeftEyeOpenProbability() >= 0) {
      encodedFace.putDouble("leftEyeOpenProbability", face.getIsLeftEyeOpenProbability());
    }
    if (face.getIsRightEyeOpenProbability() >= 0) {
      encodedFace.putDouble("rightEyeOpenProbability", face.getIsRightEyeOpenProbability());
    }

    for(Landmark landmark : face.getLandmarks()) {
      encodedFace.putBundle(landmarkNames[landmark.getType()], mapFromPoint(landmark.getPosition(), scaleX, scaleY));
    }

    Bundle origin = new Bundle(2);
    origin.putDouble("x", face.getPosition().x * scaleX);
    origin.putDouble("y", face.getPosition().y * scaleY);

    Bundle size = new Bundle(2);
    size.putDouble("width", face.getWidth() * scaleX);
    size.putDouble("height", face.getHeight() * scaleY);

    Bundle bounds = new Bundle(2);
    bounds.putBundle("origin", origin);
    bounds.putBundle("size", size);

    encodedFace.putBundle("bounds", bounds);

    return encodedFace;
  }

  public static Bundle rotateFaceX(Bundle face, int sourceWidth, double scaleX) {
    Bundle faceBounds = face.getBundle("bounds");

    Bundle oldOrigin = faceBounds.getBundle("origin");
    Bundle mirroredOrigin = positionMirroredHorizontally(oldOrigin, sourceWidth, scaleX);

    double translateX = -faceBounds.getBundle("size").getDouble("width");
    Bundle translatedMirroredOrigin = positionTranslatedHorizontally(mirroredOrigin, translateX);

    Bundle newBounds = new Bundle(faceBounds);
    newBounds.putBundle("origin", translatedMirroredOrigin);

    for (String landmarkName : landmarkNames) {
      Bundle landmark = face.getBundle(landmarkName);
      if (landmark != null) {
        Bundle mirroredPosition = positionMirroredHorizontally(landmark, sourceWidth, scaleX);
        face.putBundle(landmarkName, mirroredPosition);
      }
    }

    face.putBundle("bounds", newBounds);

    return face;
  }

  public static Bundle changeAnglesDirection(Bundle face) {
    face.putDouble("rollAngle", (-face.getDouble("rollAngle") + 360) % 360);
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
    double originalX = elementX / scaleX;
    double mirroredX = containerWidth - originalX;
    return mirroredX * scaleX;
  }
}
