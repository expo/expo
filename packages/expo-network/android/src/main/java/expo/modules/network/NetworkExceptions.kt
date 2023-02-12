package expo.modules.network

import expo.modules.kotlin.exception.CodedException

internal class NetworkAccessException(e: Exception) :
  CodedException("Unable to access network information", e.cause)

internal class NetworkWifiException(e: Exception) :
  CodedException("Wi-Fi information could not be acquired", e.cause)
