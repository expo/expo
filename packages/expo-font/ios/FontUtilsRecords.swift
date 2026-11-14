// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

@Record
struct RenderToImageOptions {
  var fontFamily: String = ""
  var lineHeight: CGFloat? = nil
  var size: CGFloat = 24
  var color: Color = .black
}

@Record
struct RenderToImageResult {
  var uri: String
  var width: CGFloat
  var height: CGFloat
  var scale: CGFloat
}
