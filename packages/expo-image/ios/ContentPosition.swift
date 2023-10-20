import ExpoModulesCore

/**
 Represents a position value that might be either `Double` or `String`.
 */
typealias ContentPositionValue = Either<Double, String>

/**
 Specifies the alignment of the image within the container's box.
 - Note: Its intention is to behave like the CSS [`object-position`](https://developer.mozilla.org/en-US/docs/Web/CSS/object-position) property.
 */
struct ContentPosition: Record, Equatable {
  static let center = Self()

  @Field
  var top: ContentPositionValue?

  @Field
  var bottom: ContentPositionValue?

  @Field
  var right: ContentPositionValue?

  @Field
  var left: ContentPositionValue?

  /**
   Returns a horizontal content offset based on the `left` or `right` field.
   */
  func offsetX(contentWidth: Double, containerWidth: Double) -> Double {
    let diff = containerWidth - contentWidth

    if let leftDistance = distance(from: left) {
      return -diff / 2 + leftDistance
    }
    if let rightDistance = distance(from: right) {
      return diff / 2 - rightDistance
    }
    if let factor = factor(from: left) {
      return -diff / 2 + diff * factor
    }
    if let factor = factor(from: right) {
      return diff / 2 - diff * factor
    }
    return 0
  }

  /**
   Returns a vertical content offset based on the `top` or `bottom` field.
   */
  func offsetY(contentHeight: Double, containerHeight: Double) -> Double {
    let diff = containerHeight - contentHeight

    if let topDistance = distance(from: top) {
      return -diff / 2 + topDistance
    }
    if let bottomDistance = distance(from: bottom) {
      return diff / 2 - bottomDistance
    }
    if let factor = factor(from: top) {
      return -diff / 2 + diff * factor
    }
    if let factor = factor(from: bottom) {
      return diff / 2 - diff * factor
    }
    return 0
  }

  /**
   A `CGPoint` with horizontal and vertical content offsets.
   */
  func offset(contentSize: CGSize, containerSize: CGSize) -> CGPoint {
    return CGPoint(
      x: offsetX(contentWidth: contentSize.width, containerWidth: containerSize.width),
      y: offsetY(contentHeight: contentSize.height, containerHeight: containerSize.height)
    )
  }

  static func == (lhs: ContentPosition, rhs: ContentPosition) -> Bool {
    return compareContentPositionValue(lhs.bottom, rhs.bottom) &&
    compareContentPositionValue(lhs.top, rhs.top) &&
    compareContentPositionValue(lhs.left, rhs.left) &&
    compareContentPositionValue(lhs.right, rhs.right)
  }

  private static func compareContentPositionValue(_ lhs: ContentPositionValue?, _ rhs: ContentPositionValue?) -> Bool {
    let lhsStringValue: String? = lhs?.get()
    let rhsStringValue: String? = rhs?.get()
    let lhsDoubleValue: Double? = lhs?.get()
    let rhsDoubleValue: Double? = rhs?.get()

    if let lhs = lhsStringValue, let rhs = rhsStringValue {
      return lhs == rhs
    }
    if let lhs = lhsDoubleValue, let rhs = rhsDoubleValue {
      return lhs == rhs
    }
    if lhs == nil && rhs == nil {
      return true
    }
    return false
  }
}

/**
 Returns a static offset from the given position value or `nil` when it cannot be cast to a `Double`.
 */
private func distance(from value: ContentPositionValue?) -> Double? {
  if let value: Double = value?.get() {
    return value
  }
  if let value: String = value?.get() {
    return Double(value)
  }
  return nil
}

/**
 Returns a factor from the percentage value from the given position.
 The value must be a string containing a number and `%` character, or equal to `"center"` which is an equivalent to `50%`.
 */
private func factor(from value: ContentPositionValue?) -> Double? {
  guard let value: String = value?.get() else {
    return nil
  }
  if value == "center" {
    return 0.5
  }
  guard value.contains("%"), let percentage = Double(value.replacingOccurrences(of: "%", with: "")) else {
    return nil
  }
  return percentage / 100
}
