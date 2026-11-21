// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum DynamicTypeSizeType: String, Enumerable {
  case xSmall
  case small
  case medium
  case large
  case xLarge
  case xxLarge
  case xxxLarge
  case accessibility1
  case accessibility2
  case accessibility3
  case accessibility4
  case accessibility5

  func toSwiftUI() -> SwiftUI.DynamicTypeSize {
    switch self {
    case .xSmall: .xSmall
    case .small: .small
    case .medium: .medium
    case .large: .large
    case .xLarge: .xLarge
    case .xxLarge: .xxLarge
    case .xxxLarge: .xxxLarge
    case .accessibility1: .accessibility1
    case .accessibility2: .accessibility2
    case .accessibility3: .accessibility3
    case .accessibility4: .accessibility4
    case .accessibility5: .accessibility5
    }
  }
}

@MainActor @AnyViewBuilder
internal func dynamicTypeSizeModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let size: DynamicTypeSizeType? = try p.value("size", nil)
  let min: DynamicTypeSizeType? = try p.value("min", nil)
  let max: DynamicTypeSizeType? = try p.value("max", nil)
  if let size {
    content.dynamicTypeSize(size.toSwiftUI())
  } else if let min, let max {
    content.dynamicTypeSize(min.toSwiftUI()...max.toSwiftUI())
  } else if let max {
    content.dynamicTypeSize(...max.toSwiftUI())
  } else if let min {
    content.dynamicTypeSize(min.toSwiftUI()...)
  } else {
    content
  }
}
