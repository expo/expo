package expo.modules.kotlin.records

import expo.modules.kotlin.exception.ValidationException

interface FieldValidator<T> {
  fun validate(value: T)
}

class NumericRangeValidator<T : Comparable<T>>(
  private val from: T,
  private val to: T,
  private val fromInclusive: Boolean,
  private val toInclusive: Boolean
) : FieldValidator<T> {
  override fun validate(value: T) {
    if (
      value < from ||
      to < value ||
      value == from && !fromInclusive ||
      value == to && !toInclusive
    ) {
      throw ValidationException("Value should be in range $from ${if (fromInclusive) "<=" else "<"} 'value' ${if (toInclusive) "<=" else "<"} $to, got $value")
    }
  }
}

class IsNotEmptyCollectionValidator : FieldValidator<Collection<*>> {
  override fun validate(value: Collection<*>) {
    if (value.isEmpty()) {
      throw ValidationException("Collection is empty")
    }
  }
}

class IsNotEmptyIntArrayValidator : FieldValidator<IntArray> {
  override fun validate(value: IntArray) {
    if (value.isEmpty()) {
      throw ValidationException("Array is empty")
    }
  }
}

class IsNotEmptyFloatArrayValidator : FieldValidator<FloatArray> {
  override fun validate(value: FloatArray) {
    if (value.isEmpty()) {
      throw ValidationException("Array is empty")
    }
  }
}

class IsNotEmptyDoubleArrayValidator : FieldValidator<DoubleArray> {
  override fun validate(value: DoubleArray) {
    if (value.isEmpty()) {
      throw ValidationException("Array is empty")
    }
  }
}

class IsNotEmptyArrayValidator : FieldValidator<Array<*>> {
  override fun validate(value: Array<*>) {
    if (value.isEmpty()) {
      throw ValidationException("Array is empty")
    }
  }
}

class CollectionSizeValidator(
  private val min: Int,
  private val max: Int
) : FieldValidator<Collection<*>> {
  override fun validate(value: Collection<*>) {
    if (value.size < min || value.size > max) {
      throw ValidationException("Number of elements in the collection should be between $min and $max, got ${value.size}")
    }
  }
}

class IntArraySizeValidator(
  private val min: Int,
  private val max: Int
) : FieldValidator<IntArray> {
  override fun validate(value: IntArray) {
    if (value.size < min || value.size > max) {
      throw ValidationException("Number of elements in the array should be between $min and $max, got ${value.size}")
    }
  }
}

class DoubleArraySizeValidator(
  private val min: Int,
  private val max: Int
) : FieldValidator<DoubleArray> {
  override fun validate(value: DoubleArray) {
    if (value.size < min || value.size > max) {
      throw ValidationException("Number of elements in the array should be between $min and $max, got ${value.size}")
    }
  }
}

class FloatArraySizeValidator(
  private val min: Int,
  private val max: Int
) : FieldValidator<FloatArray> {
  override fun validate(value: FloatArray) {
    if (value.size < min || value.size > max) {
      throw ValidationException("Number of elements in the array should be between $min and $max, got ${value.size}")
    }
  }
}

class ArraySizeValidator(
  private val min: Int,
  private val max: Int
) : FieldValidator<Array<*>> {
  override fun validate(value: Array<*>) {
    if (value.size < min || value.size > max) {
      throw ValidationException("Number of elements in the array should be between $min and $max, got ${value.size}")
    }
  }
}

class StringSizeValidator(
  private val min: Int,
  private val max: Int
) : FieldValidator<String> {
  override fun validate(value: String) {
    if (value.length < min || value.length > max) {
      throw ValidationException("Length of the string should be between $min and $max, got $value (${value.length} characters)")
    }
  }
}

class RegexValidator(private val regex: Regex) : FieldValidator<CharSequence> {
  override fun validate(value: CharSequence) {
    if (!regex.matches(value)) {
      throw ValidationException("Provided string $value didn't match regex $regex")
    }
  }
}
