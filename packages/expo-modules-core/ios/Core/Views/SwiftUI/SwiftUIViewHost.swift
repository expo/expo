// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI

extension ExpoSwiftUI {
  /**
   SwiftUI view that embeds a UIKit-based view.
   */
  struct UIViewHost: SwiftUI.View, AnyChild {
    let view: UIView
    // Fabric can mount a recycled view again; a new identity per mount gives it a new container.
    private let mountToken = MountToken()

    var body: some SwiftUI.View {
      #if os(macOS)
      HostedViewRepresentable(view: view)
      #else
      HostedView(view: view, mountToken: mountToken)
      #endif
    }

    /**
     Call when Fabric unmounts the view. Fabric can recycle it, so containers of this mount must not take it back.
     */
    func didUnmount() {
      mountToken.isMounted = false
    }

    // MARK: - AnyChild implementations

    var childView: some SwiftUI.View {
      self
    }

    var id: ObjectIdentifier {
      ObjectIdentifier(view)
    }

    var uiView: UIView? {
      view
    }

    var childIdentity: ExpoSwiftUI.ChildIdentity {
      .object(ObjectIdentifier(mountToken))
    }
  }

  private final class MountToken {
    var isMounted = true
  }

  #if os(macOS)
  private struct HostedViewRepresentable: NSViewRepresentable {
    let view: NSView

    func makeNSView(context: Context) -> NSView {
      return view
    }

    func updateNSView(_ nsView: NSView, context: Context) {
      // Nothing to do here
    }
  }
  #else
  // SwiftUI can show one child in more than one place, such as a `List` cell it only measures.
  // The view can be in only one container, so the instance that appears in a window takes it.
  private struct HostedView: SwiftUI.View {
    let view: UIView
    let mountToken: MountToken
    @State private var appearance = Appearance()

    var body: some SwiftUI.View {
      HostedViewRepresentable(view: view, mountToken: mountToken, appearance: appearance)
        .onAppear { appearance.isAppeared = true }
        .onDisappear { appearance.isAppeared = false }
    }
  }

  @MainActor
  private final class Appearance {
    weak var container: ReactViewIsolationContainer?
    var isAppeared = false {
      didSet { container?.takeViewIfShown() }
    }
  }

  private struct HostedViewRepresentable: UIViewRepresentable {
    let view: UIView
    let mountToken: MountToken
    let appearance: Appearance

    func makeUIView(context: Context) -> ReactViewIsolationContainer {
      // SwiftUI mutates the view it hosts (autoresizingMask, frame, visibility), sometimes
      // asynchronously after teardown, corrupting unmounted or recycled React views.
      // Hand it a disposable container instead. Fixes expo/expo#47706; supersedes the #40604 mitigation.
      let container = ReactViewIsolationContainer(hostedView: view, mountToken: mountToken, appearance: appearance)
      appearance.container = container
      if view.superview == nil {
        container.addSubview(view)
      }
      return container
    }

    func updateUIView(_ container: ReactViewIsolationContainer, context: Context) {
      // Nothing to do here
    }
  }

  /**
   Disposable UIView handed to SwiftUI in place of the React-managed view —
   see `HostedViewRepresentable.makeUIView`.
   */
  private final class ReactViewIsolationContainer: UIView {
    weak var hostedView: UIView?
    let mountToken: MountToken
    let appearance: Appearance

    init(hostedView: UIView, mountToken: MountToken, appearance: Appearance) {
      self.hostedView = hostedView
      self.mountToken = mountToken
      self.appearance = appearance
      super.init(frame: .zero)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
      fatalError("init(coder:) has not been implemented")
    }

    override func didMoveToWindow() {
      super.didMoveToWindow()
      takeViewIfShown()
    }

    func takeViewIfShown() {
      guard mountToken.isMounted, let hostedView, window != nil, hostedView.superview !== self,
        appearance.isAppeared || hostedView.superview == nil else {
        return
      }
      addSubview(hostedView)
      if !bounds.isEmpty {
        hostedView.frame = bounds
      }
    }

    override func layoutSubviews() {
      super.layoutSubviews()
      // Ignore transient zero bounds (initial layout, teardown) — never propagate them.
      guard let hostedView, hostedView.superview === self, !bounds.isEmpty else {
        return
      }
      if hostedView.frame != bounds {
        hostedView.frame = bounds
      }
    }
  }
  #endif
}
