// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore

internal struct BufferOptions: Record {
  @Field
  var preferredForwardBufferDuration: Double = 0

  @Field
  var waitsToMinimizeStalling: Bool = true
}
