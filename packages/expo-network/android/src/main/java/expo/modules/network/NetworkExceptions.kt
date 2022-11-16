package expo.modules.network

import expo.modules.kotlin.exception.CodedException

internal class NetworkAccessException :
  CodedException("Unable to access network information")