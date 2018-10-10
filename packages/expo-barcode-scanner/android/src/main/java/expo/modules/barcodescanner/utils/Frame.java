package expo.modules.barcodescanner.utils;

/**
 * Wrapper around Frame allowing us to track Frame dimensions.
 * Tracking dimensions is used in ExpoFaceDetector to provide painless FaceDetector recreation
 * when image dimensions change.
 */

public class Frame {
  private com.google.android.gms.vision.Frame mFrame;
  private ImageDimensions mDimensions;

  public Frame(com.google.android.gms.vision.Frame frame, ImageDimensions dimensions) {
    mFrame = frame;
    mDimensions = dimensions;
  }

  public com.google.android.gms.vision.Frame getFrame() {
    return mFrame;
  }

  public ImageDimensions getDimensions() {
    return mDimensions;
  }
}
