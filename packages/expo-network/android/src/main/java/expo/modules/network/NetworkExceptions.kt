package expo.modules.network

import expo.modules.kotlin.exception.CodedException

internal class NetworkAccessException :
  CodedException("Unable to access network information")

internal class NetworkWifiException :
  CodedException("Wi-Fi information could not be acquired")
