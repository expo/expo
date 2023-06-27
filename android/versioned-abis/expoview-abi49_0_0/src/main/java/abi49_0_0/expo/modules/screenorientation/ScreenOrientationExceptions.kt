package abi49_0_0.expo.modules.screenorientation

import abi49_0_0.expo.modules.kotlin.exception.CodedException

internal class InvalidOrientationLockException(orientationLock: Int, cause: Exception) :
  CodedException("An invalid OrientationLock was passed in: $orientationLock", cause)

internal class GetOrientationLockException(cause: Exception) :
  CodedException("Could not get the current screen orientation lock: ", cause)

internal class GetPlatformOrientationLockException(cause: Exception) :
  CodedException("Could not get the current screen orientation platform lock", cause)
