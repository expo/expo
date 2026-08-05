// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class ClosedRangeDate: Record {
  @Field public var lower: Date?
  @Field public var upper: Date?

  public required init() {}
}
