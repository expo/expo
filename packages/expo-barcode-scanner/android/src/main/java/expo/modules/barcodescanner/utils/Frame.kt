package expo.modules.barcodescanner.utils

import com.google.android.gms.vision.Frame

/**
 * Wrapper around Frame allowing us to track Frame dimensions.
 * Tracking dimensions is used in ExpoFaceDetector to provide painless FaceDetector recreation
 * when image dimensions change.
 */
data class Frame(
  val frame: Frame,
  val dimensions: ImageDimensions
)
