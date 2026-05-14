// Copyright 2026-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

/// Holds the SwiftUI `ScrollViewProxy` captured inside `ScrollViewReader`
/// so the imperative `scrollToId` AsyncFunction can call `proxy.scrollTo(...)`
/// from outside the view body.
final class ScrollProxyHolder {
  var proxy: ScrollViewProxy?
}

public final class ScrollViewComponentProps: UIBaseViewProps {
  @Field var axes: AxisOptions = .vertical
  @Field var showsIndicators: Bool = true
  @Field var onScrollGeometryChangeSync: WorkletCallback?
  var onScrollPhaseChange = EventDispatcher()
  var onScrollGeometryChange = EventDispatcher()
  let proxyHolder = ScrollProxyHolder()
}

public struct ScrollViewComponent: ExpoSwiftUI.View {
  @ObservedObject public var props: ScrollViewComponentProps

  public init(props: ScrollViewComponentProps) {
    self.props = props
  }

  /// Imperatively scroll so the child with `id(targetId)` aligns with the
  /// leading edge. Mirrors SwiftUI's `ScrollViewProxy.scrollTo(_:anchor:)`,
  /// wrapped in `withAnimation` when `animated` is true.
  public func scrollToId(id: String, animated: Bool) {
    let holder = props.proxyHolder
    DispatchQueue.main.async {
      guard let proxy = holder.proxy else { return }
      if animated {
        withAnimation {
          proxy.scrollTo(id, anchor: .leading)
        }
      } else {
        proxy.scrollTo(id, anchor: .leading)
      }
    }
  }

  public var body: some View {
    ScrollViewReader { proxy in
      Group {
        if #available(iOS 18.0, tvOS 18.0, *) {
          modernScrollView
        } else {
          legacyScrollView
        }
      }
      .onAppear {
        props.proxyHolder.proxy = proxy
      }
    }
  }

  /// iOS < 18: no scroll-phase / scroll-geometry callbacks. Imperative
  /// `scrollToId` still works via `ScrollViewProxy` (iOS 14+).
  private var legacyScrollView: some View {
    ScrollView(props.axes.toAxis(), showsIndicators: props.showsIndicators) {
      Children()
    }
  }

  @available(iOS 18.0, tvOS 18.0, *)
  private var modernScrollView: some View {
    ScrollView(props.axes.toAxis(), showsIndicators: props.showsIndicators) {
      Children()
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
