// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal struct LastKnownLocationRequirements: Record {
  @Field var maxAge: Double = .greatestFiniteMagnitude
  @Field var requiredAccuracy: Double = .greatestFiniteMagnitude
}
