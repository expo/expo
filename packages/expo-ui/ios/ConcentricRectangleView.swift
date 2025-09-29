// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal enum EdgeCornerStyleType: String, Enumerable {
  case concentric
  case fixed
}

internal struct CornerStyleConfig: Record {
  @Field var type: EdgeCornerStyleType = .concentric
  @Field var radius: CGFloat?
  @Field var minimumRadius: CGFloat?
}

internal struct ConcentricRectangleCornerParams: Record {
  @Field var topLeadingCorner: CornerStyleConfig?
  @Field var topTrailingCorner: CornerStyleConfig?
  @Field var bottomLeadingCorner: CornerStyleConfig?
  @Field var bottomTrailingCorner: CornerStyleConfig?
}

internal final class ConcentricRectangleViewProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var corners: ConcentricRectangleCornerParams?
}

internal struct ConcentricRectangleView: ExpoSwiftUI.View {
  @ObservedObject var props: ConcentricRectangleViewProps

  #if compiler(>=6.2) // Xcode 26
  @available(iOS 26.0, tvOS 26.0, *)
  private func cornerStyle(from config: CornerStyleConfig?) -> Edge.Corner.Style {
    // default to concentric
    guard let config = config else {
      return .concentric(minimum: nil)
    }

    switch config.type {
    case .concentric:
      let minimum: Edge.Corner.Style? = {
        if let minimumRadius = config.minimumRadius {
          return .fixed(minimumRadius)
        }
        return nil
      }()
      return .concentric(minimum: minimum)
    case .fixed:
      return .fixed(config.radius ?? 0)
    }
  }
  #endif

  var body: some View {
    #if compiler(>=6.2) // Xcode 26
    if #available(iOS 26.0, tvOS 26.0, *) {
      let topLeadingCorner = cornerStyle(from: props.corners?.topLeadingCorner)
      let topTrailingCorner = cornerStyle(from: props.corners?.topTrailingCorner)
      let bottomLeadingCorner = cornerStyle(from: props.corners?.bottomLeadingCorner)
      let bottomTrailingCorner = cornerStyle(from: props.corners?.bottomTrailingCorner)

      ConcentricRectangle(
        topLeadingCorner: topLeadingCorner,
        topTrailingCorner: topTrailingCorner,
        bottomLeadingCorner: bottomLeadingCorner,
        bottomTrailingCorner: bottomTrailingCorner
      )
      .modifier(CommonViewModifiers(props: props))
    } else {
      EmptyView()
    }
    #else
    EmptyView()
    #endif
  }
}
