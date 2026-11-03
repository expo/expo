// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal final class ArrangementViewProps: UIBaseViewProps {}

internal struct ArrangementViewView: ExpoSwiftUI.View {
  @ObservedObject var props: ArrangementViewProps

  init(props: ArrangementViewProps) {
    self.props = props
  }

  var body: some View {
// `ArrangementView` ships in the iOS 27.1 SDK (SwiftUICore 8.0.85). `compiler(>=6.4)` is not enough:
// Xcode 27.1 also ships the tvOS and macOS 27.0 SDKs (SwiftUICore 8.0.84) on the same Swift version.
#if canImport(SwiftUICore, _version: 8.0.85)
    if #available(iOS 27.1, macOS 27.1, tvOS 27.1, visionOS 27.1, *) {
      ArrangementView {
        primary
      } secondary: {
        secondary
      }
    } else {
      Children()
    }
#else
    Children()
#endif
  }

  private var primary: SlotView? {
    props.children?.slot("primary")
  }

  private var secondary: SlotView? {
    props.children?.slot("secondary")
  }
}
