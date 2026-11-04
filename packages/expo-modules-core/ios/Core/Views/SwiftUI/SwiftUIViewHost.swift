// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI

extension ExpoSwiftUI {
  /**
   SwiftUI view that embeds a UIKit-based view.
   */
  struct UIViewHost: SwiftUI.View, AnyChild {
    let view: UIView
    // Fabric can mount a recycled view again; a new lease per mount gives it new containers.
    private let lease: HostedViewLease

    init(view: UIView) {
      self.view = view
      self.lease = HostedViewLease(view: view)
    }

    var body: some SwiftUI.View {
      #if os(macOS)
      HostedViewRepresentable(view: view)
      #else
      HostedViewInstance(lease: lease)
      #endif
    }

    /**
     Call when Fabric unmounts the view. Fabric can recycle it, so containers of this mount must not take it back.
     */
    func didUnmount() {
      lease.isMounted = false
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
      .object(ObjectIdentifier(lease))
    }
  }

  /**
   SwiftUI can build more than one instance of a child, such as a `List` cell it only measures. Each instance
   has its own container, but the view can be in only one. The lease gives it to the displayed instance.
   */
  private final class HostedViewLease {
    weak var view: UIView?
    var isMounted = true

    init(view: UIView) {
      self.view = view
    }

    #if !os(macOS)
    private var containers: [WeakContainer] = []
    private var displayCount = 0

    @MainActor
    func add(_ container: ReactViewIsolationContainer, isDisplayed: Bool) {
      containers.append(WeakContainer(value: container))
      setDisplayed(container, isDisplayed)
    }

    @MainActor
    func remove(_ container: ReactViewIsolationContainer) {
      containers.removeAll { $0.value == nil || $0.value === container }
      reconcile()
    }

    @MainActor
    func setDisplayed(_ container: ReactViewIsolationContainer, _ isDisplayed: Bool) {
      if isDisplayed {
        displayCount += 1
        container.displayOrder = displayCount
      } else {
        container.displayOrder = nil
      }
      reconcile()
    }

    @MainActor
    func reconcile() {
      guard isMounted, let view else {
        return
      }
      containers.removeAll { $0.value == nil }
      let live = containers.compactMap(\.value)
      let displayed = live.filter { $0.displayOrder != nil }.sorted { ($0.displayOrder ?? 0) < ($1.displayOrder ?? 0) }
      // SwiftUI calls `onAppear` for an instance outside a window too, such as one it only measures.
      let shown = displayed.last { $0.window != nil }
      // Moving the view resigns its first responder and cancels its touches, so keep it until a container is shown.
      let current = live.first { view.superview === $0 }
      let owner = shown ?? current ?? displayed.last ?? live.last
      owner?.adopt(view)
    }
    #endif
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
  private struct HostedViewInstance: SwiftUI.View {
    let lease: HostedViewLease
    // Here, not in `UIViewHost`: SwiftUI shows one `UIViewHost` in many places. `@StateObject` slows the first layout.
    @State private var state = HostedViewInstanceState()

    var body: some SwiftUI.View {
      HostedViewRepresentable(lease: lease, state: state)
        .onAppear {
          state.isDisplayed = true
          if let container = state.container {
            lease.setDisplayed(container, true)
          }
        }
        .onDisappear {
          state.isDisplayed = false
          if let container = state.container {
            lease.setDisplayed(container, false)
          }
        }
    }
  }

  private final class HostedViewInstanceState {
    weak var container: ReactViewIsolationContainer?
    var isDisplayed = false
  }

  private struct HostedViewRepresentable: UIViewRepresentable {
    let lease: HostedViewLease
    let state: HostedViewInstanceState

    func makeUIView(context: Context) -> ReactViewIsolationContainer {
      // SwiftUI mutates the view it hosts (autoresizingMask, frame, visibility), sometimes
      // asynchronously after teardown, corrupting unmounted or recycled React views.
      // Hand it a disposable container instead. Fixes expo/expo#47706; supersedes the #40604 mitigation.
      let container = ReactViewIsolationContainer(lease: lease)
      state.container = container
      lease.add(container, isDisplayed: state.isDisplayed)
      return container
    }

    func updateUIView(_ container: ReactViewIsolationContainer, context: Context) {
      // Nothing to do here
    }

    static func dismantleUIView(_ container: ReactViewIsolationContainer, coordinator: ()) {
      container.lease.remove(container)
    }
  }

  private struct WeakContainer {
    weak var value: ReactViewIsolationContainer?
  }

  /**
   Disposable UIView handed to SwiftUI in place of the React-managed view —
   see `HostedViewRepresentable.makeUIView`.
   */
  private final class ReactViewIsolationContainer: UIView {
    let lease: HostedViewLease
    var displayOrder: Int?

    init(lease: HostedViewLease) {
      self.lease = lease
      super.init(frame: .zero)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
      fatalError("init(coder:) has not been implemented")
    }

    override func didMoveToWindow() {
      super.didMoveToWindow()
      lease.reconcile()
    }

    func adopt(_ view: UIView) {
      guard view.superview !== self else {
        return
      }
      addSubview(view)
      if !bounds.isEmpty {
        view.frame = bounds
      }
    }

    override func layoutSubviews() {
      super.layoutSubviews()
      // Ignore transient zero bounds (initial layout, teardown) — never propagate them.
      guard let hostedView = lease.view, hostedView.superview === self, !bounds.isEmpty else {
        return
      }
      if hostedView.frame != bounds {
        hostedView.frame = bounds
      }
    }
  }
  #endif
}
