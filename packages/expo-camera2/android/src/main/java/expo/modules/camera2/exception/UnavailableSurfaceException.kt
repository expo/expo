package expo.modules.camera2.exception

/**
 * Thrown when the preview surface didn't become available.
 */
class UnavailableSurfaceException : CameraException(
  "No preview surface became available before Camera2View got detached from window. " +
    "Camera didn't start. You may ignore this exception."
)