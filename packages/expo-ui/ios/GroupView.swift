// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public final class GroupViewProps: UIBaseViewProps {}

public struct GroupView: ExpoSwiftUI.View {
  @ObservedObject public var props: GroupViewProps
  @Environment(\.resolvesOwnPercentage) private var resolvesOwnPercentage

  public init(props: GroupViewProps) {
    self.props = props
  }

  public var body: some View {
    Group {
      Children()
    }
    // Group does not size its children, so they keep this view's parent.
    .environment(\.universalPercentageParent, resolvesOwnPercentage)
  }
}
