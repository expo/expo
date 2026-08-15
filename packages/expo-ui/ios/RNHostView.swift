// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class RNHostViewProps: ExpoSwiftUI.ViewProps {
  @Field var matchContents: Bool = false
}

struct RNHostView: ExpoSwiftUI.View {

  @ObservedObject var props: RNHostViewProps
  // Owns the RCTSurfaceTouchHandler we attach to the hosted RN view so it is detached again when
  // this host disappears.
  @StateObject private var touchHandler = RNHostTouchHandler()

  var body: some View {
    if props.matchContents, let childUIView = firstChildUIView {
      ApplySizeFromYogaNode(childUIView: childUIView) {
        Children()
      }
      .onAppear {
        touchHandler.attach(to: childUIView)
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
          if let view = firstChildUIView {
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
