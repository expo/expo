package expo.modules.screenorientation

import expo.modules.kotlin.exception.CodedException

private const val ERR_SCREEN_ORIENTATION_UNSUPPORTED_ORIENTATION_LOCK = "ERR_SCREEN_ORIENTATION_UNSUPPORTED_ORIENTATION_LOCK"
private const val ERR_SCREEN_ORIENTATION_INVALID_ORIENTATION_LOCK = "ERR_SCREEN_ORIENTATION_INVALID_ORIENTATION_LOCK"
private const val ERR_SCREEN_ORIENTATION_GET_ORIENTATION_LOCK = "ERR_SCREEN_ORIENTATION_GET_ORIENTATION_LOCK"
private const val ERR_SCREEN_ORIENTATION_GET_PLATFORM_ORIENTATION_LOCK = "ERR_SCREEN_ORIENTATION_GET_PLATFORM_ORIENTATION_LOCK"

internal class UnsupportedOrientationLockException(orientationLock: Int, cause: Exception) :
  CodedException(ERR_SCREEN_ORIENTATION_UNSUPPORTED_ORIENTATION_LOCK, "Could not apply the ScreenOrientation lock: $orientationLock", cause)

internal class UnsupportedOrientationPlatformLockException(orientationLock: Int, cause: Exception) :
  CodedException(ERR_SCREEN_ORIENTATION_UNSUPPORTED_ORIENTATION_LOCK, "Could not apply the ScreenOrientation platform lock: $orientationLock", cause)

internal class InvalidOrientationLockException(orientationLock: Int, cause: Exception) :
  CodedException(ERR_SCREEN_ORIENTATION_INVALID_ORIENTATION_LOCK, "An invalid OrientationLock was passed in: $orientationLock", cause)

internal class GetOrientationLockException(cause: Exception) :
  CodedException(ERR_SCREEN_ORIENTATION_GET_ORIENTATION_LOCK, "Could not get the current screen orientation lock: ", cause)

internal class GetPlatformOrientationLockException(cause: Exception) :
  CodedException(ERR_SCREEN_ORIENTATION_GET_PLATFORM_ORIENTATION_LOCK, "Could not get the current screen orientation platform lock", cause)
