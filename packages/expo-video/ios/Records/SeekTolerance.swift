import Foundation
import ExpoModulesCore

internal struct SeekTolerance: Record {
  @Field
  var toleranceBefore: Double = 0

  @Field
  var toleranceAfter: Double = 0

  // Use a large timescale to keep seeking range accuracy
  private let timescale: Int32 = 10_000_000

  var cmTimeToleranceBefore: CMTime {
    CMTime(value: CMTimeValue(toleranceBefore * Double(timescale)), timescale: timescale)
  }
  var cmTimeToleranceAfter: CMTime {
    CMTime(value: CMTimeValue(toleranceAfter * Double(timescale)), timescale: timescale)
  }
}
