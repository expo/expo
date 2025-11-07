// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class RNHostProps: UIBaseViewProps {}

// This component should be used to Host React Native components in SwiftUI components.
// This sets it's own shadow node size so child RN components properties like flex: 1 work as expected
// This also listens to child RN view's bounds and sets frame modifier on it, so it's sizing can be controlled by yoga. SwiftUI does not respect view's bounds property.
// It also attaches RN's touch handler to React Native child view so touch events work.
internal struct RNHost: ExpoSwiftUI.View {
  @ObservedObject var props: RNHostProps
  
  func updateShadowNodeSize(_ size: CGSize) {
    props.virtualViewShadowNodeProxy?.setViewSize?(size)
  }

  var body: some View {
    ZStack {
      GeometryReader { sheetGeometry in
        Color.clear
          .onAppear {
            updateShadowNodeSize(sheetGeometry.size)
          }
          .onChange(of: sheetGeometry.size) { newSize in
            updateShadowNodeSize(newSize)
          }
      }
      .allowsHitTesting(false)
      
      ChildSizeWrapper(children: props.children ?? [], props: props) {
        Children()
      }
    }
  }
}

private struct ChildSizeWrapper<Content: View>: View {
  let children: [any ExpoSwiftUI.AnyChild]
  let props: RNHostProps
  let content: () -> Content
  @StateObject private var childSizeModel: ChildSizeModel

  init(children: [any ExpoSwiftUI.AnyChild], props: RNHostProps, @ViewBuilder content: @escaping () -> Content) {
    self.children = children
    self.props = props
    self.content = content
    _childSizeModel = StateObject(wrappedValue: ChildSizeModel(children: children))
  }

  var body: some View {
    content()
      .frame(
        width: childSizeModel.childSize.width,
        height: childSizeModel.childSize.height
      )
  }
}

@MainActor
private class ChildSizeModel: ObservableObject {
  @Published var childSize: CGSize
  private var observer: NSKeyValueObservation?
  private var touchHandler: UIGestureRecognizer?
  private weak var view: UIView?

  init(children: [any ExpoSwiftUI.AnyChild]) {
    if let firstChild = children.first,
       let viewHost = firstChild as? ExpoSwiftUI.UIViewHost {
      let view = viewHost.view
      self.view = view
      self.childSize = view.bounds.size

      observer = view.observe(\.bounds) { [weak self] view, _ in
        MainActor.assumeIsolated {
          self?.childSize = view.bounds.size
        }
      }
      
      // Enables touch events for views in bottomsheet
      let touchHandler = RCTTouchHandlerHelper.createAndAttachTouchHandler(for: view)
      self.touchHandler = touchHandler
    } else {
      self.childSize = .zero
    }
  }

  deinit {
    observer?.invalidate()
    if let touchHandler = touchHandler, let view = view {
      RCTTouchHandlerHelper.detachTouchHandler(touchHandler, from: view)
    }
    touchHandler = nil
  }
}
