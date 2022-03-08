package expo.modules.kotlin.records

import expo.modules.kotlin.exception.ValidationException

interface FieldValidator<T> {
  fun validate(value: T)
}

class NumericRangeValidator<T : Comparable<T>>(private val from: T, private val to: T) : FieldValidator<T> {
  override fun validate(value: T) {
    if (value < from || to <= value) {
      throw ValidationException("Value should be in range $from - $to, got $value")
    }
  }
}
