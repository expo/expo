package expo.modules.storereview

import expo.modules.kotlin.exception.CodedException

internal class MissingCurrentActivityException :
  CodedException("Activity which was provided during module initialization is no longer available")

internal class RMTaskException :
  CodedException("Android ReviewManager task failed")

internal class RMUnsuccessfulTaskException :
  CodedException("Android ReviewManager task was not successful")
