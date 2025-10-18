// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal class PopoverViewProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var isPresented: Bool = false
  var onIsPresentedChange = EventDispatcher()
  @Field var attachmentAnchor: PopoverAttachmentAnchorOption?
  @Field var arrowEdge: PopoverArrowEdgeOption?
}

internal final class PopoverViewContentPorps: ExpoSwiftUI.ViewProps {}
internal struct PopoverViewContent: ExpoSwiftUI.View {
  @ObservedObject var props: PopoverViewContentPorps

  var body: some View {
    Children()
  }
}

internal final class PopoverViewPopContentPorps: ExpoSwiftUI.ViewProps {}
internal struct PopoverViewPopContent: ExpoSwiftUI.View {
  @ObservedObject var props: PopoverViewPopContentPorps

  var body: some View {
    Children()
  }
}

internal enum PopoverAttachmentAnchorOption: String, Enumerable {
  case top
  case center
  case bottom
  case leading
  case trailing

  var anchor: PopoverAttachmentAnchor {
    switch self {
    case .top:
      return .point(.top)
    case .center:
      return .point(.center)
    case .bottom:
      return .point(.bottom)
    case .leading:
      return .point(.leading)
    case .trailing:
      return .point(.trailing)
    }
  }
}

internal enum PopoverArrowEdgeOption: String, Enumerable {
  case top
  case bottom
  case leading
  case trailing
  case none

  var edge: Edge? {
    switch self {
    case .top:
      return .top
    case .bottom:
      return .bottom
    case .leading:
      return .leading
    case .trailing:
      return .trailing
    case .none:
      return nil
    }
  }
}

internal struct PopoverView: ExpoSwiftUI.View {
  @ObservedObject var props: PopoverViewProps
  @State private var isPresented: Bool = false

  var body: some View {
    #if os(tvOS)
      triggerContent
    #else
      triggerContent
        .popover(
          isPresented: $isPresented,
          attachmentAnchor: props.attachmentAnchor?.anchor ?? .rect(.bounds),
          arrowEdge: props.arrowEdge?.edge
        ) {
          if #available(iOS 16.4, *) {
            popoverContent
              .presentationCompactAdaptation(.popover)
          } else {
            popoverContent
          }
        }
        .modifier(CommonViewModifiers(props: props))
        .onChange(
          of: isPresented,
          perform: { newValue in
            if props.isPresented != newValue {
              props.onIsPresentedChange(["isPresented": newValue])
            }
          }
        )
        .onChange(of: props.isPresented) { newValue in
          isPresented = newValue
        }
        .onAppear {
          isPresented = props.isPresented
        }
    #endif
  }

  @ViewBuilder
  private var triggerContent: some View {
    if let content = props.children?
      .compactMap({ $0.childView as? PopoverViewContent })
      .first
    {
      content
    }
  }

  @ViewBuilder
  private var popoverContent: some View {
    if let content = props.children?
      .compactMap({ $0.childView as? PopoverViewPopContent })
      .first
    {
      content
    }
  }

}
