// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore
import ExpoUI

final class TestGroupViewProps: UIBaseViewProps {}

struct TestGroupView: ExpoSwiftUI.View {
  @ObservedObject public var props: TestGroupViewProps

  var body: some View {
    Group {
      Children()
    }
  }
}
