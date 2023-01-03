package expo.modules.barcodescanner

import expo.modules.kotlin.exception.CodedException

class ImageRetrievalException(url: String) :
  CodedException("Could not get the image from given url: '$url'")
