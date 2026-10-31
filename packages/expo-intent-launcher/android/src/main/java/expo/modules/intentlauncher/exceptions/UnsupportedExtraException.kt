package expo.modules.intentlauncher.exceptions

import expo.modules.kotlin.exception.CodedException

class UnsupportedExtraException(key: String, type: Class<*>) :
  CodedException(
    message = "The started activity returned the extra '$key' of type '${type.name}', which cannot be passed to JavaScript. " +
      "Only strings, numbers, booleans, URIs, bundles, and arrays of them are supported. " +
      "Read this extra in native code, or ask the activity to return a supported type."
  )
