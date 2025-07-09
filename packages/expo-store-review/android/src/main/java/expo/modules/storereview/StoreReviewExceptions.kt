package expo.modules.storereview

import expo.modules.kotlin.exception.CodedException

internal class RMTaskException :
  CodedException("Android ReviewManager task failed")

internal class RMUnsuccessfulTaskException :
  CodedException("Android ReviewManager task was not successful")
