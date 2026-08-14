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
   `measure()` stops its ancestor walk here. Dispatch and measurement come from this one prop so
   they cannot disagree, which is the failure mode that produced presses landing in the wrong place.
   */
  @Field var layoutRoot: Bool = false
}

// Who dispatches a hosted subtree's touches depends on where the content is presented.
//
//   - In the normal hierarchy the surface root above us already streams this subtree's touches.
//     Attaching a second handler would produce two streams in two coordinate spaces — UIKit delivers
//     a touch to recognizers on the hit view and every ancestor, and the root's cannot be suppressed
//     from below — which cancels presses on any movement. So we attach nothing and publish a content
//     origin instead, which is what keeps `measure()` agreeing with the root's surface-relative
//     touches.
//   - Content presented in its own view controller (a sheet, a popover) is not a descendant of the
//     surface, so nothing above it dispatches and it would receive no touches at all. There we
//     attach our own handler, and `layoutRoot` makes `measure()` report positions relative to this
//     view — the space those touches arrive in. No content origin is needed, because the `measure()`
//     walk stops here and there is no ancestor chain left to correct.
struct RNHostView: ExpoSwiftUI.View {

  @ObservedObject var props: RNHostViewProps
  // Owns the RCTSurfaceTouchHandler we attach to the hosted RN view so it is detached again when
  // this host disappears.
  @StateObject private var touchHandler = RNHostTouchHandler()

  var body: some View {
    hostedContent
      // Only meaningful while the surface root owns dispatch: it corrects a `measure()` walk that
      // runs through this node up to the surface. As a `layoutRoot` that walk stops here, so there
      // is nothing to correct.
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
// the hosted content actually occupies. Yoga positions this view's box relative to the `Host`, but
// SwiftUI draws it wherever the surrounding stacks put it; without this the responder region sits
// above the content and `Pressable` cancels a press as soon as the finger moves.
private struct PublishContentOriginModifier: ViewModifier {
  let shadowNodeProxy: ExpoSwiftUI.ShadowNodeProxy
  let isEnabled: Bool

  func body(content: Content) -> some View {
    if #available(iOS 16.0, tvOS 16.0, macOS 13.0, *), isEnabled {
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
