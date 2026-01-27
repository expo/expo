// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

struct RenderToImageOptions: Record {
  @Field var fontFamily: String = ""
  @Field var lineHeight: CGFloat? = nil
  @Field var size: CGFloat = 24
  @Field var color: Color = .black
}
