package expo.modules.camera2.exception

/**
 * A generic camera exception.
 */
open class CameraException(
  message: String,
  cause: Throwable? = null
) : RuntimeException(message, cause)
