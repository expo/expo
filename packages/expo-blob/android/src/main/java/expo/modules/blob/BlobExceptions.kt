package expo.modules.blob

import expo.modules.kotlin.exception.CodedException
import io.github.expo.modules.v2.jsi.JavaScriptValue

internal class InvalidBlobPartException(kind: JavaScriptValue.Kind) :
  CodedException(
    "Cannot create a Blob from a part of type ${kind.name.lowercase()}. Pass each part as a string, " +
      "a typed array, a DataView or a Blob."
  )
