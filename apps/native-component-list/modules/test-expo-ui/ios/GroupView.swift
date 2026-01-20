// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore
import ExpoUI

public final class TestGroupViewProps: UIBaseViewProps {}

public struct TestGroupView: ExpoSwiftUI.View {
  @ObservedObject public var props: TestGroupViewProps

  public init(props: TestGroupViewProps) {
    self.props = props
  }

  public var body: some View {
    Group {
      Children()
    }
  }
}
