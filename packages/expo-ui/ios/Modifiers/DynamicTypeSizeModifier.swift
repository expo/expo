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

internal struct DynamicTypeSizeModifier: ViewModifier, Record {
  @Field var size: DynamicTypeSizeType?
  @Field var min: DynamicTypeSizeType?
  @Field var max: DynamicTypeSizeType?

  func body(content: Content) -> some View {
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
}
