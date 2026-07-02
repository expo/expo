// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import QuartzCore
import SwiftUI

final class LazyListProps: UIBaseViewProps {
  // Stable, unique key per item for the whole list. Used as the SwiftUI identity so inserts/deletes/
  // moves animate the correct row, and as the slot name for looking up each row's mounted content.
  @Field var itemKeys: [String] = []
  @Field var estimatedItemSize: Double = 44
  // One batched event per runloop tick at most — the realized row range plus scroll velocity —
  // instead of a dispatch per row. JS derives the mount window (with a velocity-scaled directional
  // lead) from it.
  var onVisibleRangeChange = EventDispatcher()
  var onSelectItem = EventDispatcher()
  var onDeleteItems = EventDispatcher()
}

// A list that mounts its rows on demand instead of all at once. Rows live in a native SwiftUI `List`,
// which realizes only the cells near the viewport and recycles them (so memory stays bounded). Row
// realization is tracked natively; the tracker batches the realized range and the scroll velocity
// into a single per-tick event that JS uses to mount (or unmount) row content through `slot(key)`.
struct LazyListView: ExpoSwiftUI.View {
  @ObservedObject var props: LazyListProps
  @StateObject private var tracker = VisibleRangeTracker()

  init(props: LazyListProps) {
    self.props = props
  }

  var body: some View {
    let _ = tracker.sync(itemKeys: props.itemKeys) { [weak props] payload in
      props?.onVisibleRangeChange(payload)
    }
    List {
      ForEach(props.itemKeys, id: \.self) { key in
        LazyListRow(
          content: props.children?.slot(key),
          estimatedHeight: props.estimatedItemSize,
          onRealize: { tracker.realize(key: key) },
          onDerealize: { tracker.derealize(key: key) },
          onScrollViewFound: { tracker.attach(scrollView: $0) }
        )
        .listRowInsets(EdgeInsets())
        .listRowSeparator(.hidden)
      }
      .onDelete { offsets in
        props.onDeleteItems(["indices": Array(offsets)])
      }
    }
    .listStyle(.plain)
  }
}

// Batches per-row realization changes and scroll offset changes into at most one event per
// main-runloop tick, so a fast fling costs one native→JS dispatch per frame instead of one per row.
// Velocity comes from KVO-observing the List's backing UIScrollView, so it updates even before any
// new cell realizes (the start of a fling), letting JS extend its mount window ahead of the scroll.
// Main-thread only.
private final class VisibleRangeTracker: ObservableObject {
  private var realized = Set<String>()
  private var indexByKey: [String: Int] = [:]
  private var itemKeys: [String] = []
  private var emit: (([String: Any]) -> Void)?

  private weak var scrollView: UIScrollView?
  private var offsetObservation: NSKeyValueObservation?
  private var lastOffset: CGFloat = 0
  private var lastTimestamp: CFTimeInterval = 0
  // Points per second; positive when scrolling toward the end of the list. Lightly low-passed.
  private var velocity: Double = 0
  private var stopWorkItem: DispatchWorkItem?

  private var flushScheduled = false
  private var lastSent: (first: Int, last: Int, velocity: Double)?

  func sync(itemKeys: [String], emit: @escaping ([String: Any]) -> Void) {
    self.emit = emit
    if itemKeys != self.itemKeys {
      self.itemKeys = itemKeys
      indexByKey = [:]
      for (index, key) in itemKeys.enumerated() {
        indexByKey[key] = index
      }
      scheduleFlush()
    }
  }

  func realize(key: String) {
    realized.insert(key)
    scheduleFlush()
  }

  func derealize(key: String) {
    realized.remove(key)
    scheduleFlush()
  }

  func attach(scrollView: UIScrollView?) {
    guard let scrollView, scrollView !== self.scrollView else {
      return
    }
    self.scrollView = scrollView
    lastOffset = scrollView.contentOffset.y
    lastTimestamp = CACurrentMediaTime()
    offsetObservation = scrollView.observe(\.contentOffset, options: [.new]) { [weak self] _, _ in
      self?.offsetDidChange()
    }
  }

  private func offsetDidChange() {
    guard let scrollView else {
      return
    }
    let now = CACurrentMediaTime()
    let offset = scrollView.contentOffset.y
    let dt = now - lastTimestamp
    guard dt > 0.001 else {
      return
    }
    let instantaneous = Double(offset - lastOffset) / dt
    // Low-pass just enough to keep the JS-side lead from twitching on noisy per-frame deltas.
    velocity = abs(velocity) < 1 ? instantaneous : instantaneous * 0.6 + velocity * 0.4
    lastOffset = offset
    lastTimestamp = now

    // Zero the velocity shortly after offset changes stop, so the JS window converges back to the
    // symmetric overscan instead of keeping a stale directional lead.
    stopWorkItem?.cancel()
    let workItem = DispatchWorkItem { [weak self] in
      self?.velocity = 0
      self?.scheduleFlush()
    }
    stopWorkItem = workItem
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.15, execute: workItem)

    scheduleFlush()
  }

  private func scheduleFlush() {
    guard !flushScheduled else {
      return
    }
    flushScheduled = true
    DispatchQueue.main.async { [weak self] in
      guard let self else {
        return
      }
      self.flushScheduled = false
      self.flush()
    }
  }

  private func flush() {
    var first = Int.max
    var last = Int.min
    for key in realized {
      if let index = indexByKey[key] {
        first = min(first, index)
        last = max(last, index)
      }
    }
    guard first <= last, let emit else {
      return
    }
    let rangeChanged = lastSent?.first != first || lastSent?.last != last
    let velocityChanged = abs(velocity - (lastSent?.velocity ?? 0)) > 100
    guard rangeChanged || velocityChanged else {
      return
    }
    lastSent = (first, last, velocity)
    emit(["first": first, "last": last, "velocity": velocity])
  }
}

// The row triggers realize/derealize from a RealizeProbe (a UIViewRepresentable) rather than
// `.onAppear`/`.onDisappear`: its `makeUIView` fires when SwiftUI materializes the cell, which List
// does a margin ahead of display — an earlier signal than `.onAppear`.
private struct LazyListRow: View {
  let content: SlotView?
  let estimatedHeight: Double
  let onRealize: () -> Void
  let onDerealize: () -> Void
  let onScrollViewFound: (UIScrollView?) -> Void

  var body: some View {
    ZStack(alignment: .top) {
      if let content {
        content
      } else {
        // Skeleton placeholder: an unmounted row reads as loading content instead of a blank gap.
        RoundedRectangle(cornerRadius: 14, style: .continuous)
          .fill(Color(UIColor.systemGray5))
          .frame(height: max(estimatedHeight - 8, 12))
          .padding(.horizontal, 12)
          .padding(.vertical, 4)
      }
    }
    .background(
      RealizeProbe(onRealize: onRealize, onDerealize: onDerealize, onScrollViewFound: onScrollViewFound)
        .frame(width: 0, height: 0)
    )
  }
}

// A zero-size hosted view whose lifecycle brackets the cell's: `makeUIView` fires when SwiftUI
// materializes the cell (ahead of display when List prefetches), `dismantleUIView` when it's torn
// down. Once in the hierarchy it also reports the List's backing UIScrollView for velocity tracking.
private struct RealizeProbe: UIViewRepresentable {
  let onRealize: () -> Void
  let onDerealize: () -> Void
  let onScrollViewFound: (UIScrollView?) -> Void

  func makeUIView(context: Context) -> ProbeView {
    onRealize()
    let view = ProbeView()
    view.onScrollViewFound = onScrollViewFound
    return view
  }

  func updateUIView(_ uiView: ProbeView, context: Context) {}

  static func dismantleUIView(_ uiView: ProbeView, coordinator: Coordinator) {
    coordinator.onDerealize()
  }

  func makeCoordinator() -> Coordinator {
    Coordinator(onDerealize: onDerealize)
  }

  final class Coordinator {
    let onDerealize: () -> Void
    init(onDerealize: @escaping () -> Void) {
      self.onDerealize = onDerealize
    }
  }

  final class ProbeView: UIView {
    var onScrollViewFound: ((UIScrollView?) -> Void)?

    override func didMoveToWindow() {
      super.didMoveToWindow()
      guard window != nil else {
        return
      }
      var view: UIView? = superview
      while view != nil, !(view is UIScrollView) {
        view = view?.superview
      }
      if let scrollView = view as? UIScrollView {
        onScrollViewFound?(scrollView)
      }
    }
  }
}
