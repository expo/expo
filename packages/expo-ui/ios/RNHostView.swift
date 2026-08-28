// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class RNHostViewProps: ExpoSwiftUI.ViewProps {
  @Field var matchContents: Bool = false
  /**
   Whether this view owns its subtree's touches and is the origin its content is measured from. Set
   by the JavaScript side for content presented in its own view controller — see `RNHostView.tsx`,
   which reads it from the sheet or popover presenting the content.

   Also read by `ExpoViewShadowNode` in C++, which turns it into the `RootNodeKind` trait so
   `measure()` stops its ancestor walk here.
   */
  @Field var layoutRoot: Bool = false
}

// Touches and `measure()` must agree on a coordinate space. Which space depends on where the
// content sits:
//  Normal tree:
//    The surface root above us already dispatches, in surface coordinates. We attach
//    nothing and publish a content origin, so `measure()` matches those touches.
//  Sheet, popover:  
//    Presented in its own view controller, so nothing above dispatches and the
//    content would get no touches at all. We attach our own handler, and
//   `layoutRoot` measures from this view — the space those touches arrive in.
//
// Attaching a handler in the normal tree would give the subtree two streams in two spaces: UIKit
// delivers a touch to the hit view and every ancestor, and the root's cannot be suppressed from
// below, so presses would cancel on any movement.
struct RNHostView: ExpoSwiftUI.View {

  @ObservedObject var props: RNHostViewProps
  @StateObject private var touchHandler = RNHostTouchHandler()

  var body: some View {
    hostedContent
      .modifier(
        PublishContentOriginModifier(
          shadowNodeProxy: props.shadowNodeProxy,
          isEnabled: !props.layoutRoot
        )
      )
  }

  @ViewBuilder
  private var hostedContent: some View {
    if props.matchContents, let childUIView = firstChildUIView {
      ApplySizeFromYogaNode(childUIView: childUIView) {
        Children()
      }
      .onAppear {
        if props.layoutRoot {
          touchHandler.attach(to: childUIView)
        }
      }
      .onDisappear {
        touchHandler.detach()
      }
    } else if props.matchContents {
      // No hosted UIView (a pure SwiftUI child, e.g. Text/Image). Render it at its
      // natural size instead of falling into the fill branch below, which would
      // stretch a self-sizing SwiftUI view to fill its container.
      Children()
    } else if props.children?.isEmpty ?? true {
      // Nothing is mounted yet (e.g. a hosted RN `Modal` renders null until `visible` is true).
      // Render nothing instead of an empty fill frame, which would take up space in the
      // surrounding SwiftUI container - e.g. a spurious empty row in a `Form`'s `Section`.
      EmptyView()
    } else {
      Children()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .modifier(ReportSizeToYogaNodeModifier(shadowNodeProxy: props.shadowNodeProxy))
        .onAppear {
          if props.layoutRoot, let view = firstChildUIView {
            touchHandler.attach(to: view)
          }
        }
        .onDisappear {
          touchHandler.detach()
        }
    }
  }

  private var firstChildUIView: UIView? {
    props.children?.first?.uiView
  }
}

// Publishes where SwiftUI placed this view inside its `Host`, so `measure()` reports the position
// the hosted content actually occupies.
private struct PublishContentOriginModifier: ViewModifier {
  let shadowNodeProxy: ExpoSwiftUI.ShadowNodeProxy
  let isEnabled: Bool

  func body(content: Content) -> some View {
    if isEnabled {
      content
        .onGeometryChange(for: CGRect.self) { proxy in
          proxy.frame(in: .named(expoHostCoordinateSpace))
        } action: { frame in
          shadowNodeProxy.setContentOrigin?(frame.origin)
        }
        .onDisappear {
          shadowNodeProxy.clearContentOrigin?()
        }
    } else {
      content
    }
  }
}

// Tracks the `RCTSurfaceTouchHandler` attached to a hosted RN view so it can be detached when the
// `RNHostView` disappears, instead of leaking onto the recycled component view.
private final class RNHostTouchHandler: ObservableObject {
  private weak var touchHandler: UIGestureRecognizer?
  private weak var attachedView: UIView?

  func attach(to view: UIView) {
    if attachedView === view, touchHandler != nil {
      return
    }
    detach()
    touchHandler = ExpoUITouchHandlerHelper.createAndAttachTouchHandler(for: view)
    attachedView = view
  }

  func detach() {
    if let touchHandler, let attachedView {
      ExpoUITouchHandlerHelper.detachTouchHandler(touchHandler, from: attachedView)
    }
    touchHandler = nil
    attachedView = nil
  }

  deinit {
    detach()
  }
}

// Sets SwiftUI view size from Yoga node size
// Listens to Yoga node size changes and updates the SwiftUI view size
private struct ApplySizeFromYogaNode<Content: SwiftUI.View>: SwiftUI.View {
  @StateObject private var observer: Observer
  let content: Content

  init(childUIView: UIView, @ViewBuilder content: () -> Content) {
    _observer = StateObject(wrappedValue: Observer(view: childUIView))
    self.content = content()
  }

  var body: some SwiftUI.View {
    content
      .frame(width: observer.size.width, height: observer.size.height)
  }

  @MainActor
  fileprivate class Observer: ObservableObject {
    @Published var size: CGSize
    private var kvoToken: NSKeyValueObservation?

    init(view: UIView) {
      self.size = view.bounds.size
      kvoToken = view.observe(\.bounds) { [weak self] view, _ in
        MainActor.assumeIsolated {
          self?.size = view.bounds.size
        }
      }
    }

    deinit {
      kvoToken?.invalidate()
    }
  }
}

// Sets Yoga node size from SwiftUI view size
// Listens to SwiftUI view size changes and updates the Yoga node size
private struct ReportSizeToYogaNodeModifier: ViewModifier {
  let shadowNodeProxy: ExpoSwiftUI.ShadowNodeProxy

  private func handleSizeChange(_ size: CGSize) {
    shadowNodeProxy.setViewSize?(size)
  }

  func body(content: Content) -> some View {
    if #available(iOS 16.0, tvOS 16.0, macOS 13.0, *) {
      content.onGeometryChange(for: CGSize.self, of: { proxy in proxy.size }) { size in
        handleSizeChange(size)
      }
    } else {
      content.overlay {
        GeometryReader { geometry in
          Color.clear
            .hidden()
            .onAppear {
              handleSizeChange(geometry.size)
            }
            .onChange(of: geometry.size) { handleSizeChange($0) }
        }
      }
    }
  }
}
