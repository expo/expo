// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public final class BackgroundViewProps: UIBaseViewProps {
  @Field var alignment: AlignmentOptions?
}

// Draws the last child behind the remaining children using SwiftUI's
// `.background(alignment:content:)`. Unlike `ZStack`, the resulting view is sized to the
// FOREGROUND content (not the union of children), so a full-bleed background image does not
// expand or compress the content — the correct primitive for widget / Live Activity backgrounds,
// where `@expo/ui` otherwise only exposes a solid-color `containerBackground`.
public struct BackgroundView: ExpoSwiftUI.View {
  @ObservedObject public var props: BackgroundViewProps

  public init(props: BackgroundViewProps) {
    self.props = props
  }

  public var body: some View {
    let children = props.children ?? []
    let hasBackground = children.count > 1
    let backgroundChild = hasBackground ? children.last : nil
    foreground(hasBackground ? Array(children.dropLast()) : children)
      .background(alignment: props.alignment?.toAlignment() ?? .center) {
        if let backgroundChild {
          let view: any View = backgroundChild.childView
          AnyView(view)
        }
      }
  }

  @ViewBuilder
  private func foreground(_ children: [any ExpoSwiftUI.AnyChild]) -> some View {
    // Render a single foreground child directly: a bare `ForEach` can mis-size under
    // `.background`, which would let the background affect the foreground's layout.
    if children.count == 1 {
      let view: any View = children[0].childView
      AnyView(view)
    } else {
      ForEach(children, id: \.id) { child in
        let view: any View = child.childView
        AnyView(view)
      }
    }
  }
}
