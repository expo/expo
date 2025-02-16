// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

extension ExpoSwiftUIView {
  /// A view that contains the children of a ExpoSwiftUIView, with all `HostingViews` stripped out.
  /// Optionally applies a transformation to the children for more granular control.
  ///
  /// - Parameters:
  ///   - transform: A closure that takes an AnyView and a boolean indicating whether the view
  ///               is a hosting view, and returns a transformed view of type T.
  ///
  /// - Returns: A view containing the transformed children, or an empty view if there are no children.
  ///
  /// - Example:
  ///
  ///   Use the children as is
  ///   ```swift
  ///   UnwrappedChildren()
  ///   ```
  ///
  ///   In Sections, we want to apply an offset to the non-SwiftUI children
  ///   ```swift
  ///   UnwrappedChildren { view, isHostingView in
  ///     if isHostingView {
  ///       view
  ///     } else {
  ///       view.offset(x: 40)
  ///     }
  ///   }
  ///   ```
  func UnwrappedChildren<T: View>( // swiftlint:disable:this identifier_name
    @ViewBuilder transform: @escaping (_ child: AnyView, _ isHostingView: Bool)
    -> T
  ) -> some View {
    guard let children = props.children else {
      return AnyView(EmptyView())
    }
    let childrenArray = Array(children)
    return AnyView(
      ForEach(0..<childrenArray.count, id: \.self) { index in
        let child = childrenArray[index]
        if let hostingView = child.view as? (any ExpoSwiftUI.AnyHostingView) {
          let content = hostingView.getContentView()
          let shadowNodeProxy = hostingView.getShadowNodeProxy()
          let propsObject = hostingView.getProps() as any ObservableObject
          transform(
            AnyView(
              content
                .environmentObject(propsObject)
                .environmentObject(shadowNodeProxy)), true)
        } else {
          transform(AnyView(child), false)
        }
      }
    )
  }
}
