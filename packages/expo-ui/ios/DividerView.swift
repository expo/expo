// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public final class DividerProps: UIBaseViewProps {}

public struct DividerView: ExpoSwiftUI.View {
  @ObservedObject public var props: DividerProps

  public init(props: DividerProps) {
    self.props = props
  }

  public var body: some View {
    Divider()
  }
}
