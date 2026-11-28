// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

@ViewProps(extending: ExpoUIViewProps.self)
public struct NavigationLinkViewProps {
  var value: String = ""
}

@ExpoView<NavigationLinkViewProps>
public struct NavigationLinkView: View {
  public var body: some View {
    NavigationLink(value: props.value) {
      children
    }
    .applyExpoUIViewProps(props.base, appContext: appContext)
  }
}
