// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

public final class LinkViewProps: UIBaseViewProps {
  @Field var label: String?
  @Field var destination: URL?
}

public struct LinkView: ExpoSwiftUI.View {
  @ObservedObject public var props: LinkViewProps

  public init(props: LinkViewProps) {
    self.props = props
  }

  public var body: some View {
    if let url = props.destination {
      if let label = props.label {
        Link(label, destination: url)
      } else {
        Link(destination: url) {
          Children()
        }
      }
    }
  }
}
