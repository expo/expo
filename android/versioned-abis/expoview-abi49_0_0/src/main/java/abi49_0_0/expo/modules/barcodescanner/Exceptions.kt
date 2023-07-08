package abi49_0_0.expo.modules.barcodescanner

import abi49_0_0.expo.modules.kotlin.exception.CodedException

class ImageRetrievalException(url: String) :
  CodedException("Could not get the image from given url: '$url'")
