// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public final class GroupViewProps: UIBaseViewProps {
  @Field var useTapGesture: Bool?
  var onTap = EventDispatcher()
}

public struct GroupView: ExpoSwiftUI.View {
  @ObservedObject public var props: GroupViewProps

  public init(props: GroupViewProps) {
    self.props = props
  }

  public var body: some View {
    Group {
      Children()
    }
    .applyOnTapGesture(useTapGesture: props.useTapGesture, eventDispatcher: props.onTap, useContentShape: true)
  }
}
