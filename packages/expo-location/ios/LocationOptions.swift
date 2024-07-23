// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal struct LocationOptions: Record {
  @Field var accuracy: LocationAccuracy = .balanced
  @Field var distanceInterval: Double = 0.0
}
