// Copyright 2026-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

/// Bridges JS imperative writes to the `.scrollPosition(id:)` binding and
/// surfaces SwiftUI's writeback when the leading id changes.
final class ScrollPositionStore: ObservableObject {
  @Published var scrolledID: String?

  init(initialID: String? = nil) {
    self.scrolledID = initialID
  }
}

public final class ScrollViewComponentProps: UIBaseViewProps {
  @Field var axes: AxisOptions = .vertical
  @Field var showsIndicators: Bool = true
  /// Initial scroll target id. Read once at first construction; later
  /// changes are ignored. iOS 17+ — backed by SwiftUI's `.scrollPosition(id:)`.
  @Field var initialScrollId: String?
  @Field var onScrollGeometryChangeSync: WorkletCallback?
  var onScrollPhaseChange = EventDispatcher()
  var onScrollGeometryChange = EventDispatcher()
  var onScrolledIDChange = EventDispatcher()
  /// Lazy so `initialScrollId` is captured at first access (after
  /// expo-modules has populated `@Field`s) — avoids mutating an `@Published`
  /// from inside the SwiftUI view's render pass.
  lazy var positionStore: ScrollPositionStore = ScrollPositionStore(initialID: initialScrollId)
}

public struct ScrollViewComponent: ExpoSwiftUI.View {
  @ObservedObject public var props: ScrollViewComponentProps
  @ObservedObject private var positionStore: ScrollPositionStore

  public init(props: ScrollViewComponentProps) {
    self.props = props
    self.positionStore = props.positionStore
  }

  /// Requires iOS 17+ — depends on SwiftUI's `.scrollPosition(id:)` modifier.
  public func scrollToId(id: String, animated: Bool) {
    let store = props.positionStore
    DispatchQueue.main.async {
      if animated {
        withAnimation {
          store.scrolledID = id
        }
      } else {
        store.scrolledID = id
      }
    }
  }

  public var body: some View {
    Group {
      if #available(iOS 18.0, tvOS 18.0, *) {
        modernScrollView
      } else if #available(iOS 17.0, tvOS 17.0, *) {
        midScrollView
      } else {
        legacyScrollView
      }
    }
  }

  /// iOS < 17: no `.scrollPosition` or scroll-target callbacks. The view
  /// still renders, but `initialScrollId` and `scrollToId` are no-ops.
  private var legacyScrollView: some View {
    ScrollView(props.axes.toAxis(), showsIndicators: props.showsIndicators) {
      Children()
    }
  }

  @available(iOS 17.0, tvOS 17.0, *)
  private var midScrollView: some View {
    ScrollView(props.axes.toAxis(), showsIndicators: props.showsIndicators) {
      Children()
    }
    .scrollPosition(id: $positionStore.scrolledID)
    // Fires for both directions (imperative writes and SwiftUI's writeback
    // on swipe-settle).
    .onChange(of: positionStore.scrolledID) { _, newID in
      props.onScrolledIDChange(["id": newID as Any])
    }
  }

  @available(iOS 18.0, tvOS 18.0, *)
  private var modernScrollView: some View {
    ScrollView(props.axes.toAxis(), showsIndicators: props.showsIndicators) {
      Children()
    }
    .scrollPosition(id: $positionStore.scrolledID)
    .onChange(of: positionStore.scrolledID) { _, newID in
      props.onScrolledIDChange(["id": newID as Any])
    }
    .onScrollPhaseChange { _, newPhase, context in
      // Geometry is bundled into the phase event so consumers can read
      // scroll state at phase boundaries without subscribing to per-frame
      // onScrollGeometryChange.
      let g = context.geometry
      props.onScrollPhaseChange([
        "phase": Self.phaseString(newPhase),
        "geometry": [
          "contentOffsetX": g.contentOffset.x,
          "contentOffsetY": g.contentOffset.y,
          "containerWidth": g.containerSize.width,
          "containerHeight": g.containerSize.height,
          "contentWidth": g.contentSize.width,
          "contentHeight": g.contentSize.height
        ] as [String: Any]
      ])
    }
    .onScrollGeometryChange(for: ScrollGeometryPayload.self) { geometry in
      ScrollGeometryPayload(
        contentOffsetX: geometry.contentOffset.x,
        contentOffsetY: geometry.contentOffset.y,
        containerWidth: geometry.containerSize.width,
        containerHeight: geometry.containerSize.height,
        contentWidth: geometry.contentSize.width,
        contentHeight: geometry.contentSize.height
      )
    } action: { _, payload in
      let geometry: [String: Any] = [
        "contentOffsetX": payload.contentOffsetX,
        "contentOffsetY": payload.contentOffsetY,
        "containerWidth": payload.containerWidth,
        "containerHeight": payload.containerHeight,
        "contentWidth": payload.contentWidth,
        "contentHeight": payload.contentHeight
      ]
      // Mutually exclusive: the JS wrapper only wires one path at a time.
      // Skipping the regular dispatcher when a worklet is attached avoids
      // the per-frame dictionary allocation + async JS-thread event dispatch.
      if let sync = props.onScrollGeometryChangeSync {
        sync.invoke(arguments: [geometry])
      } else {
        props.onScrollGeometryChange(geometry)
      }
    }
  }

  @available(iOS 18.0, tvOS 18.0, *)
  private static func phaseString(_ phase: ScrollPhase) -> String {
    switch phase {
    case .idle: return "idle"
    case .tracking: return "tracking"
    case .interacting: return "interacting"
    case .animating: return "animating"
    case .decelerating: return "decelerating"
    @unknown default: return "idle"
    }
  }
}

// Equatable transform of `ScrollGeometry` so `.onScrollGeometryChange` only
// fires when an observed dimension actually changes.
private struct ScrollGeometryPayload: Equatable {
  let contentOffsetX: CGFloat
  let contentOffsetY: CGFloat
  let containerWidth: CGFloat
  let containerHeight: CGFloat
  let contentWidth: CGFloat
  let contentHeight: CGFloat
}
