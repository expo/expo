// Copyright 2022-present 650 Industries. All rights reserved.

/**
 Generic TypedArray with an associated numeric ContentType (e.g. UInt8, Int16, Double).
 */
public class GenericTypedArray<ContentType: Numeric>: TypedArray {
  /**
   The unsafe mutable typed buffer that shares the same memory as the underlying JavaScript `ArrayBuffer`.
   */
  lazy var buffer = UnsafeMutableBufferPointer<ContentType>(start: pointer, count: length)

  /**
   The unsafe mutable typed pointer to the start of the array buffer.
   */
  lazy var pointer = rawPointer.bindMemory(to: ContentType.self, capacity: length)

  public subscript(index: Int) -> ContentType {
    get {
      return buffer[index]
    }
    set {
      buffer[index] = newValue
    }
  }

  subscript(range: Range<Int>) -> [ContentType] {
    get {
      return Array(buffer[range])
    }
    set {
      var newValues = newValue
      newValues.withUnsafeMutableBufferPointer { newValuesBuffer in
        buffer[range] = newValuesBuffer[0..<(range.upperBound - range.lowerBound)]
      }
    }
  }

  subscript(range: ClosedRange<Int>) -> [ContentType] {
    get {
      return Array(buffer[range])
    }
    set {
      var newValues = newValue
      newValues.withUnsafeMutableBufferPointer { newValuesBuffer in
        buffer[range] = newValuesBuffer[0...(range.upperBound - range.lowerBound)]
      }
    }
  }
}
