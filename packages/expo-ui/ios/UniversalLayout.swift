// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

/**
 Sizes shared by a universal `width` or `height`.
 Points are density-independent pixels. Fractions are a portion of the parent, so `0.5` is `50%`.
 */
internal struct UniversalLayoutDimensions: Equatable {
  var widthPoints: CGFloat?
  var widthFraction: CGFloat?
  var heightPoints: CGFloat?
  var heightFraction: CGFloat?

  var hasWidth: Bool { widthPoints != nil || widthFraction != nil }
  var hasHeight: Bool { heightPoints != nil || heightFraction != nil }
}

@available(iOS 16.0, tvOS 16.0, macOS 13.0, *)
internal struct UniversalLayoutDimensionsKey: LayoutValueKey {
  static let defaultValue = UniversalLayoutDimensions()
}

internal func universalLayoutDimensions(from modifiers: ModifierArray?) -> UniversalLayoutDimensions {
  guard let values = modifiers?.last(where: { $0["$type"] as? String == "universalLayout" }) else {
    return UniversalLayoutDimensions()
  }
  return UniversalLayoutDimensions(
    widthPoints: finiteDimension(values["widthPoints"]),
    widthFraction: finiteDimension(values["widthFraction"]),
    heightPoints: finiteDimension(values["heightPoints"]),
    heightFraction: finiteDimension(values["heightFraction"])
  )
}

private func finiteDimension(_ value: Any?) -> CGFloat? {
  let number: CGFloat?
  if let value = value as? NSNumber {
    number = CGFloat(truncating: value)
  } else if let value = value as? Double {
    number = CGFloat(value)
  } else if let value = value as? Int {
    number = CGFloat(value)
  } else {
    number = nil
  }
  guard let number, number.isFinite, number >= 0 else { return nil }
  return number
}

/**
 Resolves a percentage against the proposal this view actually received.
 Fixed sizes are applied separately, as a SwiftUI `frame`.
 */
internal struct UniversalLayoutModifier: ViewModifier, Record {
  @Field var widthPoints: CGFloat?
  @Field var widthFraction: CGFloat?
  @Field var heightPoints: CGFloat?
  @Field var heightFraction: CGFloat?

  private func validated(_ value: CGFloat?) -> CGFloat? {
    guard let value, value.isFinite, value >= 0 else { return nil }
    return value
  }

  @ViewBuilder
  func body(content: Content) -> some View {
    if #available(iOS 16.0, tvOS 16.0, macOS 13.0, *) {
      ResolvedUniversalLayout(
        dimensions: UniversalLayoutDimensions(
          widthPoints: validated(widthPoints),
          widthFraction: validated(widthFraction),
          heightPoints: validated(heightPoints),
          heightFraction: validated(heightFraction)
        ),
        content: content
      )
    } else {
      content
    }
  }
}

@available(iOS 16.0, tvOS 16.0, macOS 13.0, *)
private struct ResolvedUniversalLayout<Content: View>: View {
  let dimensions: UniversalLayoutDimensions
  let content: Content

  var body: some View {
    UniversalPercentageLayout(dimensions: dimensions) {
      content
    }
    .layoutValue(key: UniversalLayoutDimensionsKey.self, value: dimensions)
  }
}

@available(iOS 16.0, tvOS 16.0, macOS 13.0, *)
internal struct UniversalPercentageLayout: Layout {
  let dimensions: UniversalLayoutDimensions

  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
    guard let subview = subviews.first else { return .zero }
    let resolvedProposal = proposal.resolving(dimensions)
    let childSize = subview.sizeThatFits(resolvedProposal)
    return CGSize(
      width: dimensions.widthFraction != nil ? finite(resolvedProposal.width) ?? childSize.width : childSize.width,
      height: dimensions.heightFraction != nil ? finite(resolvedProposal.height) ?? childSize.height : childSize.height
    )
  }

  func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
    guard let subview = subviews.first else { return }
    subview.place(at: bounds.origin, proposal: ProposedViewSize(bounds.size))
  }
}

/**
 Opt-in replacement for `HStack`. Universal `Row` uses it so a child percentage is a fraction of this stack.
 A SwiftUI `HStack` does not. Children without a percentage keep their ideal size.
 */
@available(iOS 16.0, tvOS 16.0, macOS 13.0, *)
internal struct ParentAwareHStackLayout: Layout {
  let alignment: VerticalAlignmentOptions
  let spacing: CGFloat?
  let layoutDirection: LayoutDirection
  let ownDimensions: UniversalLayoutDimensions

  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
    measure(proposal: proposal, subviews: subviews).size
  }

  func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
    let measurement = measure(proposal: ProposedViewSize(bounds.size), subviews: subviews)
    var cursor = layoutDirection == .rightToLeft ? bounds.maxX : bounds.minX
    for index in subviews.indices {
      let size = measurement.sizes[index]
      if layoutDirection == .rightToLeft { cursor -= size.width }
      let y = bounds.minY + verticalOffset(
        for: index,
        containerHeight: bounds.height,
        measurement: measurement
      )
      subviews[index].place(at: CGPoint(x: cursor, y: y), proposal: measurement.proposals[index])
      if layoutDirection == .rightToLeft {
        cursor -= measurement.spacings[index]
      } else {
        cursor += size.width + measurement.spacings[index]
      }
    }
  }

  private func measure(proposal: ProposedViewSize, subviews: Subviews) -> StackMeasurement {
    let definiteWidth = ownDimensions.hasWidth ? finite(proposal.width) : nil
    let definiteHeight = ownDimensions.hasHeight ? finite(proposal.height) : nil
    let proposals = subviews.map {
      proposalForSubview(
        $0,
        parentWidth: definiteWidth,
        parentHeight: definiteHeight,
        unconstrainedAxis: .horizontal
      )
    }
    let viewDimensions = zip(subviews, proposals).map { $0.dimensions(in: $1) }
    let sizes = viewDimensions.map { CGSize(width: $0.width, height: $0.height) }
    let spacings = stackSpacings(subviews: subviews, axis: .horizontal, explicit: spacing)
    let contentWidth = sizes.reduce(0) { $0 + $1.width } + spacings.reduce(0, +)
    let contentHeight: CGFloat
    if alignment == .firstTextBaseline || alignment == .lastTextBaseline {
      let guide = alignment.toVerticalAlignment()
      let above = viewDimensions.map { $0[guide] }.max() ?? 0
      let below = viewDimensions.map { $0.height - $0[guide] }.max() ?? 0
      contentHeight = above + below
    } else {
      contentHeight = sizes.map(\.height).max() ?? 0
    }
    return StackMeasurement(
      size: CGSize(width: definiteWidth ?? contentWidth, height: definiteHeight ?? contentHeight),
      sizes: sizes,
      proposals: proposals,
      spacings: spacings,
      dimensions: viewDimensions
    )
  }

  private func verticalOffset(
    for index: Int,
    containerHeight: CGFloat,
    measurement: StackMeasurement
  ) -> CGFloat {
    let childHeight = measurement.sizes[index].height
    switch alignment {
    case .top:
      return 0
    case .center:
      return (containerHeight - childHeight) / 2
    case .bottom:
      return containerHeight - childHeight
    case .firstTextBaseline, .lastTextBaseline:
      let guide = alignment.toVerticalAlignment()
      let reference = measurement.dimensions.map { $0[guide] }.max() ?? 0
      return reference - measurement.dimensions[index][guide]
    }
  }
}

/**
 Opt-in replacement for `VStack`. Universal `Column` uses it. See `ParentAwareHStackLayout`.
 */
@available(iOS 16.0, tvOS 16.0, macOS 13.0, *)
internal struct ParentAwareVStackLayout: Layout {
  let alignment: HorizontalAlignmentOptions
  let spacing: CGFloat?
  let layoutDirection: LayoutDirection
  let ownDimensions: UniversalLayoutDimensions

  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
    measure(proposal: proposal, subviews: subviews).size
  }

  func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
    let measurement = measure(proposal: ProposedViewSize(bounds.size), subviews: subviews)
    var cursor = bounds.minY
    for index in subviews.indices {
      let size = measurement.sizes[index]
      let x = bounds.minX + horizontalOffset(childWidth: size.width, containerWidth: bounds.width)
      subviews[index].place(at: CGPoint(x: x, y: cursor), proposal: measurement.proposals[index])
      cursor += size.height + measurement.spacings[index]
    }
  }

  private func measure(proposal: ProposedViewSize, subviews: Subviews) -> StackMeasurement {
    let definiteWidth = ownDimensions.hasWidth ? finite(proposal.width) : nil
    let definiteHeight = ownDimensions.hasHeight ? finite(proposal.height) : nil
    let proposals = subviews.map {
      proposalForSubview(
        $0,
        parentWidth: definiteWidth,
        parentHeight: definiteHeight,
        unconstrainedAxis: .vertical
      )
    }
    let viewDimensions = zip(subviews, proposals).map { $0.dimensions(in: $1) }
    let sizes = viewDimensions.map { CGSize(width: $0.width, height: $0.height) }
    let spacings = stackSpacings(subviews: subviews, axis: .vertical, explicit: spacing)
    let contentWidth = sizes.map(\.width).max() ?? 0
    let contentHeight = sizes.reduce(0) { $0 + $1.height } + spacings.reduce(0, +)
    return StackMeasurement(
      size: CGSize(width: definiteWidth ?? contentWidth, height: definiteHeight ?? contentHeight),
      sizes: sizes,
      proposals: proposals,
      spacings: spacings,
      dimensions: viewDimensions
    )
  }

  private func horizontalOffset(childWidth: CGFloat, containerWidth: CGFloat) -> CGFloat {
    switch alignment {
    case .center:
      return (containerWidth - childWidth) / 2
    case .leading:
      return layoutDirection == .rightToLeft ? containerWidth - childWidth : 0
    case .trailing:
      return layoutDirection == .rightToLeft ? 0 : containerWidth - childWidth
    }
  }
}

@available(iOS 16.0, tvOS 16.0, macOS 13.0, *)
private struct StackMeasurement {
  let size: CGSize
  let sizes: [CGSize]
  let proposals: [ProposedViewSize]
  let spacings: [CGFloat]
  let dimensions: [ViewDimensions]
}

@available(iOS 16.0, tvOS 16.0, macOS 13.0, *)
private func proposalForSubview(
  _ subview: LayoutSubview,
  parentWidth: CGFloat?,
  parentHeight: CGFloat?,
  unconstrainedAxis: Axis
) -> ProposedViewSize {
  let dimensions = subview[UniversalLayoutDimensionsKey.self]
  let width = dimensions.widthFraction != nil ? parentWidth : nil
  let height = dimensions.heightFraction != nil ? parentHeight : nil
  return ProposedViewSize(
    width: unconstrainedAxis == .horizontal && dimensions.widthFraction == nil ? nil : width,
    height: unconstrainedAxis == .vertical && dimensions.heightFraction == nil ? nil : height
  )
}

@available(iOS 16.0, tvOS 16.0, macOS 13.0, *)
private func stackSpacings(subviews: LayoutSubviews, axis: Axis, explicit: CGFloat?) -> [CGFloat] {
  subviews.indices.map { index in
    guard index < subviews.count - 1 else { return 0 }
    return explicit ?? subviews[index].spacing.distance(to: subviews[index + 1].spacing, along: axis)
  }
}

@available(iOS 16.0, tvOS 16.0, macOS 13.0, *)
private extension ProposedViewSize {
  func resolving(_ dimensions: UniversalLayoutDimensions) -> ProposedViewSize {
    ProposedViewSize(
      width: dimensions.widthFraction.flatMap { fraction in finite(width).map { $0 * fraction } } ?? finite(width),
      height: dimensions.heightFraction.flatMap { fraction in finite(height).map { $0 * fraction } } ?? finite(height)
    )
  }
}

private func finite(_ value: CGFloat?) -> CGFloat? {
  guard let value, value.isFinite, value >= 0 else { return nil }
  return value
}
