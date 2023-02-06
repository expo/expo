package abi48_0_0.expo.modules.network

import abi48_0_0.expo.modules.kotlin.exception.CodedException

internal class NetworkAccessException(e: Exception) :
  CodedException("Unable to access network information", e.cause)

internal class NetworkWifiException(e: Exception) :
  CodedException("Wi-Fi information could not be acquired", e.cause)
