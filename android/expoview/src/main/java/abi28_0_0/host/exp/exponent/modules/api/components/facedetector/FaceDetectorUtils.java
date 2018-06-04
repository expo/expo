package abi28_0_0.host.exp.exponent.modules.api.components.facedetector;

import android.graphics.PointF;

import abi28_0_0.com.facebook.react.bridge.Arguments;
import abi28_0_0.com.facebook.react.bridge.ReadableMap;
import abi28_0_0.com.facebook.react.bridge.WritableMap;
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

  public static WritableMap serializeFace(Face face) {
    return serializeFace(face, 1, 1);
  }

  public static WritableMap serializeFace(Face face, double scaleX, double scaleY) {
    WritableMap encodedFace = Arguments.createMap();

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
      encodedFace.putMap(landmarkNames[landmark.getType()], mapFromPoint(landmark.getPosition(), scaleX, scaleY));
    }

    WritableMap origin = Arguments.createMap();
    origin.putDouble("x", face.getPosition().x * scaleX);
    origin.putDouble("y", face.getPosition().y * scaleY);

    WritableMap size = Arguments.createMap();
    size.putDouble("width", face.getWidth() * scaleX);
    size.putDouble("height", face.getHeight() * scaleY);

    WritableMap bounds = Arguments.createMap();
    bounds.putMap("origin", origin);
    bounds.putMap("size", size);

    encodedFace.putMap("bounds", bounds);

    return encodedFace;
  }

  public static WritableMap rotateFaceX(WritableMap face, int sourceWidth, double scaleX) {
    ReadableMap faceBounds = face.getMap("bounds");

    ReadableMap oldOrigin = faceBounds.getMap("origin");
    WritableMap mirroredOrigin = positionMirroredHorizontally(oldOrigin, sourceWidth, scaleX);

    double translateX = -faceBounds.getMap("size").getDouble("width");
    WritableMap translatedMirroredOrigin = positionTranslatedHorizontally(mirroredOrigin, translateX);

    WritableMap newBounds = Arguments.createMap();
    newBounds.merge(faceBounds);
    newBounds.putMap("origin", translatedMirroredOrigin);

    for (String landmarkName : landmarkNames) {
      ReadableMap landmark = face.hasKey(landmarkName) ? face.getMap(landmarkName) : null;
      if (landmark != null) {
        WritableMap mirroredPosition = positionMirroredHorizontally(landmark, sourceWidth, scaleX);
        face.putMap(landmarkName, mirroredPosition);
      }
    }

    face.putMap("bounds", newBounds);

    return face;
  }

  public static WritableMap changeAnglesDirection(WritableMap face) {
    face.putDouble("rollAngle", (-face.getDouble("rollAngle") + 360) % 360);
    face.putDouble("yawAngle", (-face.getDouble("yawAngle") + 360) % 360);
    return face;
  }

  public static WritableMap mapFromPoint(PointF point, double scaleX, double scaleY) {
    WritableMap map = Arguments.createMap();
    map.putDouble("x", point.x * scaleX);
    map.putDouble("y", point.y * scaleY);
    return map;
  }

  public static WritableMap positionTranslatedHorizontally(ReadableMap position, double translateX) {
    WritableMap newPosition = Arguments.createMap();
    newPosition.merge(position);
    newPosition.putDouble("x", position.getDouble("x") + translateX);
    return newPosition;
  }

  public static WritableMap positionMirroredHorizontally(ReadableMap position, int containerWidth, double scaleX) {
    WritableMap newPosition = Arguments.createMap();
    newPosition.merge(position);
    newPosition.putDouble("x", valueMirroredHorizontally(position.getDouble("x"), containerWidth, scaleX));
    return newPosition;
  }

  public static double valueMirroredHorizontally(double elementX, int containerWidth, double scaleX) {
    double originalX = elementX / scaleX;
    double mirroredX = containerWidth - originalX;
    return mirroredX * scaleX;
  }
}
