// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

struct ValueOptions: Record {
  @Field var value: Double
  @Field var label: String?
  @Field var color: Color?
}

internal enum GaugeStyle: String, Enumerable {
  case `default`
  case circular
  case circularCapacity
  case linear
  case linearCapacity
}

class GaugeProps: ExpoSwiftUI.ViewProps {
  @Field var label: String?
  @Field var labelColor: Color?
  @Field var current: ValueOptions
  @Field var min: ValueOptions?
  @Field var max: ValueOptions?
  @Field var type: GaugeStyle = .default
  @Field var color: [Color] = []
}
