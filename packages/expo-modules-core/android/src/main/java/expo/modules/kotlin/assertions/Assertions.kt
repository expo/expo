package expo.modules.kotlin.assertions

import expo.modules.kotlin.exception.CodedException

fun assertValueInRange(value: Number, lowerBound: Number, upperBound: Number) {
  if (value.toDouble() < lowerBound.toDouble() || value.toDouble() > upperBound.toDouble()) {
    throw OutOfRangeException(value, lowerBound = lowerBound, upperBound = upperBound)
  }
}

fun assertValueGreaterOrEqual(value: Number, lowerBound: Number) {
  if (value.toDouble() < lowerBound.toDouble()) {
    throw OutOfRangeException(value, lowerBound = lowerBound)
  }
}

class OutOfRangeException(value: Number, lowerBound: Number? = null, upperBound: Number? = null) :
  CodedException(message = "Received '$value', but expected value ${
    if (upperBound != null && lowerBound != null)
      "from range $lowerBound..$upperBound"
    else if (lowerBound != null)
      "not smaller than $lowerBound"
    else
      "not greater than $upperBound"
  }")