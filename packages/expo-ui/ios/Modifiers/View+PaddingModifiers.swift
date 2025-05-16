// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct PaddingOptions: Record {
  @Field var top: Double?
  @Field var leading: Double?
  @Field var bottom: Double?
  @Field var trailing: Double?
}

internal extension View {
  @ViewBuilder
  func applyPadding(_ padding: PaddingOptions?) -> some View {
    if let padding {
      self.padding(EdgeInsets(
        top: padding.top.map { CGFloat($0) } ?? 0,
        leading: padding.leading.map { CGFloat($0) } ?? 0,
        bottom: padding.bottom.map { CGFloat($0) } ?? 0,
        trailing: padding.trailing.map { CGFloat($0) } ?? 0
      ))
    } else {
      self
    }
  }
}
