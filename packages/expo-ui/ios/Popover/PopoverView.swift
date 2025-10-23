// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

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
