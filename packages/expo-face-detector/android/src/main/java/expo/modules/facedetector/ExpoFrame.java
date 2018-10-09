package expo.modules.facedetector;

import com.google.android.gms.vision.Frame;

/**
 * Wrapper around Frame allowing us to track Frame dimensions.
 * Tracking dimensions is used in ExpoFaceDetector to provide painless FaceDetector recreation
 * when image dimensions change.
 */

public class ExpoFrame {
  private Frame mFrame;
  private ImageDimensions mDimensions;

  public ExpoFrame(Frame frame, ImageDimensions dimensions) {
    mFrame = frame;
    mDimensions = dimensions;
  }

  public Frame getFrame() {
    return mFrame;
  }

  public ImageDimensions getDimensions() {
    return mDimensions;
  }
}
