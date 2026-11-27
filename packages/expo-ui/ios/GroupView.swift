// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

@ExpoView<ExpoUIViewProps>
public struct GroupView: View {
  @Environment(\.universalPercentageParent) private var universalPercentageParent

  public var body: some View {
    Group {
      children
    }
    // Group does not size its children, so they keep this view's parent.
    .environment(\.universalPercentageParent, universalPercentageParent)
    .applyExpoUIViewProps(props, appContext: appContext)
  }
}
