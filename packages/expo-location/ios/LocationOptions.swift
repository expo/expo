// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal struct LocationOptions: Record {
  @Field var accuracy: LocationAccuracy = .balanced
  @Field var distanceInterval: Double = 0.0
}

internal struct HeadingOptions: Record {
  /// Minimum angular change, in degrees, before an update is delivered.
  /// When `nil`, the system default of 1 degree applies.
  /// Values `<= 0` map to `kCLHeadingFilterNone`, delivering every reading.
  @Field var headingFilter: Double? = nil
}
