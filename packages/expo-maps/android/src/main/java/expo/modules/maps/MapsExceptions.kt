package expo.modules.maps

import expo.modules.kotlin.exception.CodedException

internal class MissingUIManagerException :
  CodedException("UIManager is unavailable")