package abi49_0_0.expo.modules.imagemanipulator

import abi49_0_0.expo.modules.kotlin.exception.CodedException

class ImageDecodeException(uri: String, e: Throwable?) :
  CodedException("Could not get decoded bitmap of $uri", e)
