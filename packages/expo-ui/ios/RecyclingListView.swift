// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

/// A data-driven list that lets React recycle its row views.
///
/// `LazyVStackView` is lazy on SwiftUI's side only: it defers evaluating the
/// bodies of children React has already built, so every row still becomes a
/// native view before SwiftUI sees it. Windowing that from JS helps, but it
/// cannot recycle — inside a stack the child order has to match the visual
/// order, so advancing the window by one row reassigns every slot to a
/// different item and all of them push new props.
///
/// This view breaks that coupling. Each child is placed by the data index it
/// carries (`slotIndices`) rather than by its position among its siblings, so
/// JS is free to use `slot = index % windowSize`. Advancing the window by one
/// row then changes exactly one slot, and re-renders exactly one row.
public final class RecyclingListViewProps: UIBaseViewProps {
  /// Total number of items, including those React has not rendered.
  @Field var itemCount: Int = 0
  /// Fixed row height, in points.
  @Field var itemSize: Double = 0
  /// The data index each child currently represents, in child order.
  @Field var slotIndices: [Int] = []
  /// Index to scroll to. Resolved to an offset natively, so the target row does
  /// not have to be mounted — which in a recycling list it usually is not.
  @Field var scrollToIndex: Int?
  /// Seconds. Zero scrolls immediately.
  @Field var scrollAnimationDuration: Double = 0
  /// Timing curve for programmatic scrolling.
  @Field var scrollAnimationCurve: String = "linear"

  var onFirstVisibleIndexChange = EventDispatcher()
}

public struct RecyclingListView: ExpoSwiftUI.View {
  @ObservedObject public var props: RecyclingListViewProps

  public init(props: RecyclingListViewProps) {
    self.props = props
  }

  private var contentHeight: CGFloat {
    CGFloat(props.itemCount) * CGFloat(props.itemSize)
  }

  /// Placement is by data index, not by sibling position. This is the whole
  /// point of the view: it is what lets the child order differ from the visual
  /// order, and therefore what lets JS recycle.
  private func offset(forChildAt index: Int) -> CGFloat {
    guard index < props.slotIndices.count else { return 0 }
    return CGFloat(props.slotIndices[index]) * CGFloat(props.itemSize)
  }

  @ViewBuilder
  private func content(width: CGFloat) -> some View {
    ScrollView {
      ZStack(alignment: .topLeading) {
        // Establishes the scrollable extent for the whole data set, not just
        // the rows that happen to be mounted.
        Color.clear.frame(height: contentHeight)

        ForEach(Array((props.children ?? []).enumerated()), id: \.element.id) { index, child in
          let view: any View = child.childView
          AnyView(view)
            // Top-aligned: `itemSize` is the row pitch, which may exceed the
            // row's own height when the caller wants a gap. Centring the child
            // in the pitch would offset every row by half the difference.
            .frame(width: width, height: CGFloat(props.itemSize), alignment: .top)
            .offset(y: offset(forChildAt: index))
        }
      }
    }
  }

  public var body: some View {
    GeometryReader { geometry in
      if #available(iOS 18.0, tvOS 18.0, *), props.itemSize.isFinite, props.itemSize > 0, props.itemCount >= 0,
        contentHeight.isFinite
      {
        ScrollDriver(
          itemCount: props.itemCount,
          itemSize: CGFloat(props.itemSize),
          targetIndex: props.scrollToIndex,
          duration: props.scrollAnimationDuration,
          curve: props.scrollAnimationCurve,
          onFirstVisibleIndexChange: { props.onFirstVisibleIndexChange(["index": $0]) }
        ) {
          content(width: geometry.size.width)
        }
      } else {
        EmptyView()
      }
    }
  }
}

/// Owns the scroll position and reports the first visible row.
///
/// Resolving `scrollToIndex` to an offset rather than using `scrollTo(id:)` is
/// deliberate: an id-based scroll needs the target row to be mounted, and here
/// it usually is not. The first visible index is reported only when it changes,
/// so JS hears from this once per row rather than once per frame.
@available(iOS 18.0, tvOS 18.0, *)
private struct ScrollDriver<C: View>: View {
  let itemCount: Int
  let itemSize: CGFloat
  let targetIndex: Int?
  let duration: Double
  let curve: String
  let onFirstVisibleIndexChange: (Int) -> Void
  @ViewBuilder let content: () -> C

  @State private var position = ScrollPosition()
  @State private var reportedIndex: Int = -1

  private struct Request: Equatable {
    let index: Int?
    let pitch: CGFloat
  }

  var body: some View {
    content()
      .scrollPosition($position)
      .onChange(
        of: Request(
          index: targetIndex.flatMap { itemCount > 0 ? min(max(0, $0), itemCount - 1) : nil },
          pitch: itemSize
        ),
        initial: true
      ) { _, request in
        guard let index = request.index, itemCount > 0, itemSize.isFinite, itemSize > 0 else { return }
        let y = CGFloat(min(max(0, index), itemCount - 1)) * itemSize
        guard y.isFinite else { return }
        if duration.isFinite && duration > 0 {
          let animation: Animation =
            curve == "easeOut"
            ? .easeOut(duration: duration)
            : .linear(duration: duration)
          withAnimation(animation) { position.scrollTo(y: y) }
        } else {
          position.scrollTo(y: y)
        }
      }
      .onScrollGeometryChange(for: Int.self) { geometry in
        let offset = geometry.contentOffset.y + geometry.contentInsets.top
        guard itemCount > 0, offset.isFinite, itemSize.isFinite, itemSize > 0 else { return 0 }
        let index = min(CGFloat(itemCount - 1), max(0, (offset / itemSize).rounded(.down)))
        return Int(index)
      } action: { _, newValue in
        guard newValue != reportedIndex else { return }
        reportedIndex = newValue
        onFirstVisibleIndexChange(newValue)
      }
  }
}
