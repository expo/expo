// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum TemplateRenderingModeOptions: String, Enumerable {
  case template
  case original

  var toTemplateRenderingMode: Image.TemplateRenderingMode {
    switch self {
    case .template: return .template
    case .original: return .original
    }
  }
}

internal struct RenderingModeModifier: Record {
  @Field var mode: TemplateRenderingModeOptions?
}
