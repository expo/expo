// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class RNHostViewProps: UIBaseViewProps {
  @Field var matchContents: Bool = false
}

struct RNHostView: ExpoSwiftUI.View {
  init(props: RNHostViewProps) {
    self.props = props;
  }
  
  @ObservedObject var props: RNHostViewProps

  var body: some View {
    if props.matchContents, let childUIView = firstChildUIView {
      ChildBoundsFrame(childUIView: childUIView) {
        Children()
      }
      .onAppear { [weak childUIView] in
        guard let childUIView else { return }
        ExpoUITouchHandlerHelper.createAndAttachTouchHandler(for: childUIView)
      }
    } else {
      Children()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .modifier(RNHostSizeModifier(matchContents: false, shadowNodeProxy: props.shadowNodeProxy))
        .onAppear {
          if let view = firstChildUIView {
            ExpoUITouchHandlerHelper.createAndAttachTouchHandler(for: view)
          }
        }
    }
  }

  private var firstChildUIView: UIView? {
    (props.children?.first as? ExpoSwiftUI.UIViewHost)?.view
  }
}

// MARK: - Child bounds frame

/// Observes a child UIKit view's bounds (set by Yoga) via KVO and applies
/// them as a `.frame()` modifier. The bounds are read eagerly in `init`
/// so the frame is correct from the very first render — no `onAppear` delay.
private struct ChildBoundsFrame<Content: SwiftUI.View>: SwiftUI.View {
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

// MARK: - Size tracking

private struct RNHostSizeModifier: ViewModifier {
  let matchContents: Bool
  let shadowNodeProxy: ExpoSwiftUI.ShadowNodeProxy

  private func handleSizeChange(_ size: CGSize) {
    if !matchContents {
      shadowNodeProxy.setViewSize?(size)
    }
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
