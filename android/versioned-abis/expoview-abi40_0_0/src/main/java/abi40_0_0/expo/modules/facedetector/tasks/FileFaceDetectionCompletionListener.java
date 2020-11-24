package abi40_0_0.expo.modules.facedetector.tasks;

import android.os.Bundle;

public interface FileFaceDetectionCompletionListener {
  void resolve(Bundle result);
  void reject(String tag, String message);
}
