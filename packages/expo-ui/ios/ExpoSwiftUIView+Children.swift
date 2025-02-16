// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

extension ExpoSwiftUIView {
  /// A view that contains the children of a ExpoSwiftUIView, with all `HostingViews` stripped out.
  /// Optionally applies a transformation to
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
  func UnwrappedChildren<T: View>(
    @ViewBuilder transform: @escaping (_ view: AnyView, _ isHostingView: Bool)
      -> T
  ) -> some View {
    guard let children = props.children else { return AnyView(EmptyView()) }
    let childrenArray = Array(children)

    return AnyView(
      ForEach(0..<childrenArray.count, id: \.self) { index in
        let child = childrenArray[index]
        if let hostingView = child.view as? (any ExpoSwiftUI.AnyHostingView) {
          let content = hostingView.getContentView()
          let shadowNodeProxy = hostingView.getShadowNodeProxy()
          if let propsObject = Mirror(reflecting: hostingView).children.first(
            where: {
              $0.label == "props"
            })?.value
          {
            let _ = type(of: child.view).getDynamicType()
            if let observableProps = propsObject as? any ObservableObject {
              transform(AnyView(content
                .environmentObject(observableProps)
                .environmentObject(shadowNodeProxy)), true)
            } else {
              transform(AnyView(content), true)
            }
          } else {
            transform(AnyView(content), true)
          }
        } else {
          transform(AnyView(child), false)
        }
      }
    )
  }
}
