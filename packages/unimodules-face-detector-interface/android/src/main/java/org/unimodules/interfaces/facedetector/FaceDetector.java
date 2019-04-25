package org.unimodules.interfaces.facedetector;

import android.os.Bundle;

import java.util.List;
import java.util.Map;

public interface FaceDetector {
  List<Bundle> detectFaces(byte[] imageData, int width, int height, int rotation, int facing, double scaleX, double scaleY);

  void setSettings(Map<String, Object> settings);

  void release();
}
