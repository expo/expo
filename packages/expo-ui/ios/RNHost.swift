// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class RNHostProps: UIBaseViewProps {
  @Field var matchContentsHorizontal: Bool = false
  @Field var matchContentsVertical: Bool = false
}

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
    let content = ChildSizeWrapper(children: props.children ?? [], props: props) {
      Children()
    }
    
    if #available(iOS 16.0, *) {
      content.onGeometryChange(for: CGSize.self, of: { proxy in proxy.size }, action: {
        updateShadowNodeSize($0)
      })
    } else {
      content.overlay {
        GeometryReader { geometry in
          Color.clear
            .hidden()
            .onAppear {
              updateShadowNodeSize(geometry.size)
            }
            .onChange(of: geometry.size) { updateShadowNodeSize($0) }
        }
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
    let shouldMatchContents = props.matchContentsHorizontal || props.matchContentsVertical

    if shouldMatchContents {
      content()
        .frame(
          width: props.matchContentsHorizontal ? childSizeModel.childSize.width : nil,
          height: props.matchContentsVertical ? childSizeModel.childSize.height : nil
        )
    } else {
      content()
    }
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
