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
  @Environment(\.universalPercentageParent) private var resolvesPercentages
  let dimensions: UniversalLayoutDimensions
  let content: Content

  var body: some View {
    UniversalPercentageLayout(dimensions: dimensions, resolvesPercentages: resolvesPercentages) {
      content
    }
    .layoutValue(key: UniversalLayoutDimensionsKey.self, value: dimensions)
  }
}

private struct UniversalPercentageParentKey: EnvironmentKey {
  static let defaultValue = false
}

private struct ResolvesOwnPercentageKey: EnvironmentKey {
  static let defaultValue = false
}

extension EnvironmentValues {
  /// `Host`, universal `Row` / `Column`, and `ScrollView` set this for their children.
  /// Other views clear it.
  /// `Group` passes the parent's value through.
  var universalPercentageParent: Bool {
    get { self[UniversalPercentageParentKey.self] }
    set { self[UniversalPercentageParentKey.self] = newValue }
  }

  /// Parent opt-in captured for this view, after descendants have been cleared.
  var resolvesOwnPercentage: Bool {
    get { self[ResolvesOwnPercentageKey.self] }
    set { self[ResolvesOwnPercentageKey.self] = newValue }
  }
}

/**
 The sizing modifier sits outside this wrapper, so it still sees the parent flag.
 Descendants see the flag cleared unless this view sets it again.
 */
internal struct UniversalPercentageParentBoundary<Content: View>: View {
  @Environment(\.universalPercentageParent) private var parentOptedIn
  let content: Content

  var body: some View {
    content
      .environment(\.resolvesOwnPercentage, parentOptedIn)
      .environment(\.universalPercentageParent, false)
  }
}

@available(iOS 16.0, tvOS 16.0, macOS 13.0, *)
internal struct UniversalPercentageLayout: Layout {
  let dimensions: UniversalLayoutDimensions
  let resolvesPercentages: Bool

  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
    guard let subview = subviews.first else { return .zero }
    guard resolvesPercentages else { return subview.sizeThatFits(proposal) }
    let resolvedProposal = proposal.resolving(dimensions)
    let childSize = subview.sizeThatFits(resolvedProposal)
    return CGSize(
      width: dimensions.widthFraction != nil ? finite(resolvedProposal.width) ?? childSize.width : childSize.width,
      height: dimensions.heightFraction != nil ? finite(resolvedProposal.height) ?? childSize.height : childSize.height
    )
  }

  func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
    guard let subview = subviews.first else { return }
    let childProposal = resolvesPercentages ? ProposedViewSize(bounds.size) : proposal
    subview.place(at: bounds.origin, proposal: childProposal)
  }
}

/**
 Opt-in replacement for `HStack`.
 Universal `Row` uses it so a child percentage is a fraction of this stack.
 A child that grows on the main axis, such as `Spacer`, shares the leftover space.
 Text and other children that can shrink give up space when the ideals do not fit.
 The cross axis gets the size this stack was offered, so text can wrap.
 */
@available(iOS 16.0, tvOS 16.0, macOS 13.0, *)
internal struct ParentAwareHStackLayout: Layout {
  let alignment: VerticalAlignmentOptions
  let spacing: CGFloat?
  let ownDimensions: UniversalLayoutDimensions
  // A fraction counts only after a universal parent has resolved it.
  let resolvesOwnPercentage: Bool

  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
    measure(proposal: proposal, subviews: subviews).size
  }

  func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
    let measurement = measure(proposal: ProposedViewSize(bounds.size), subviews: subviews)
    // minX stays leading.
    // SwiftUI mirrors a custom layout in right-to-left.
    var cursor = bounds.minX
    for index in subviews.indices {
      let size = measurement.sizes[index]
      let y = bounds.minY + verticalOffset(
        for: index,
        containerHeight: bounds.height,
        measurement: measurement
      )
      subviews[index].place(at: CGPoint(x: cursor, y: y), proposal: measurement.proposals[index])
      cursor += size.width + measurement.spacings[index]
    }
  }

  private func measure(proposal: ProposedViewSize, subviews: Subviews) -> StackMeasurement {
    let spacings = stackSpacings(subviews: subviews, axis: .horizontal, explicit: spacing)
    let measured = measureChildren(
      subviews: subviews,
      proposal: proposal,
      ownDimensions: ownDimensions,
      resolvesOwnPercentage: resolvesOwnPercentage,
      spacings: spacings,
      axis: .horizontal
    )
    let proposals = measured.children.map(\.proposal)
    let viewDimensions = zip(subviews, proposals).map { $0.dimensions(in: $1) }
    let contentHeight: CGFloat
    if alignment == .firstTextBaseline || alignment == .lastTextBaseline {
      let guide = alignment.toVerticalAlignment()
      let above = viewDimensions.map { $0[guide] }.max() ?? 0
      let below = viewDimensions.map { $0.height - $0[guide] }.max() ?? 0
      contentHeight = above + below
    } else {
      contentHeight = measured.contentCross
    }
    return StackMeasurement(
      size: CGSize(
        width: measured.definiteMain ?? measured.contentMain,
        height: measured.definiteCross ?? contentHeight
      ),
      sizes: measured.children.map(\.size),
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
  let ownDimensions: UniversalLayoutDimensions
  // A fraction counts only after a universal parent has resolved it.
  let resolvesOwnPercentage: Bool

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
    let spacings = stackSpacings(subviews: subviews, axis: .vertical, explicit: spacing)
    let measured = measureChildren(
      subviews: subviews,
      proposal: proposal,
      ownDimensions: ownDimensions,
      resolvesOwnPercentage: resolvesOwnPercentage,
      spacings: spacings,
      axis: .vertical
    )
    let proposals = measured.children.map(\.proposal)
    return StackMeasurement(
      size: CGSize(
        width: measured.definiteCross ?? measured.contentCross,
        height: measured.definiteMain ?? measured.contentMain
      ),
      sizes: measured.children.map(\.size),
      proposals: proposals,
      spacings: spacings,
      dimensions: zip(subviews, proposals).map { $0.dimensions(in: $1) }
    )
  }

  private func horizontalOffset(childWidth: CGFloat, containerWidth: CGFloat) -> CGFloat {
    // minX is leading.
    // SwiftUI mirrors the layout in right-to-left.
    switch alignment {
    case .center:
      return (containerWidth - childWidth) / 2
    case .leading:
      return 0
    case .trailing:
      return containerWidth - childWidth
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
private struct MeasuredChild {
  var size: CGSize
  var proposal: ProposedViewSize
  /// Cross-axis proposal from the first pass.
  /// The flexible pass must keep it, or a `ScrollView` in a column loses the column width.
  var crossProposal: CGFloat?
  /// Cross-axis size counted toward the stack.
  /// A flexible child uses its ideal cross size, so `Spacer` does not stretch the other axis.
  var crossContribution: CGFloat
  /// False for a resolved percentage or a flexible child.
  var canCompress: Bool
}

@available(iOS 16.0, tvOS 16.0, macOS 13.0, *)
private struct MeasuredChildren {
  var children: [MeasuredChild]
  var contentMain: CGFloat
  var contentCross: CGFloat
  var definiteMain: CGFloat?
  var definiteCross: CGFloat?
}

@available(iOS 16.0, tvOS 16.0, macOS 13.0, *)
private func measureChildren(
  subviews: LayoutSubviews,
  proposal: ProposedViewSize,
  ownDimensions: UniversalLayoutDimensions,
  resolvesOwnPercentage: Bool,
  spacings: [CGFloat],
  axis: Axis
) -> MeasuredChildren {
  let offeredMain = finite(axis == .horizontal ? proposal.width : proposal.height)
  let offeredCross = finite(axis == .horizontal ? proposal.height : proposal.width)
  // Points are this stack's fixed frame.
  // A fraction is too, but only after a universal parent resolves it.
  let ownMainPoints = axis == .horizontal ? ownDimensions.widthPoints : ownDimensions.heightPoints
  let ownMainFraction = axis == .horizontal ? ownDimensions.widthFraction : ownDimensions.heightFraction
  let ownCrossPoints = axis == .horizontal ? ownDimensions.heightPoints : ownDimensions.widthPoints
  let ownCrossFraction = axis == .horizontal ? ownDimensions.heightFraction : ownDimensions.widthFraction
  let definiteMain = (ownMainPoints != nil || (ownMainFraction != nil && resolvesOwnPercentage)) ? offeredMain : nil
  let definiteCross = (ownCrossPoints != nil || (ownCrossFraction != nil && resolvesOwnPercentage)) ? offeredCross : nil

  var children: [MeasuredChild] = []
  children.reserveCapacity(subviews.count)
  var flexibleIndices: [Int] = []

  for index in subviews.indices {
    let subview = subviews[index]
    let dimensions = subview[UniversalLayoutDimensionsKey.self]
    let mainFraction = axis == .horizontal ? dimensions.widthFraction : dimensions.heightFraction
    let crossFraction = axis == .horizontal ? dimensions.heightFraction : dimensions.widthFraction
    // A fraction resolves only against this stack's own size.
    // Every other child still gets the offered cross size, so text can wrap.
    let crossProposal = crossFraction != nil ? definiteCross : offeredCross

    if mainFraction != nil, let definiteMain {
      let childProposal = proposedSize(main: definiteMain, cross: crossProposal, axis: axis)
      let size = subview.sizeThatFits(childProposal)
      children.append(MeasuredChild(
        size: size,
        proposal: childProposal,
        crossProposal: crossProposal,
        crossContribution: crossLength(size, axis: axis),
        canCompress: false
      ))
      continue
    }

    let idealProposal = proposedSize(main: nil, cross: crossProposal, axis: axis)
    let ideal = subview.sizeThatFits(idealProposal)
    let maxProposal = proposedSize(main: .infinity, cross: crossProposal, axis: axis)
    let maxed = subview.sizeThatFits(maxProposal)
    let idealMain = mainLength(ideal, axis: axis)
    let maxMain = mainLength(maxed, axis: axis)
    let flexible = offeredMain != nil && (maxMain.isInfinite || maxMain > idealMain + 1)
    if flexible {
      flexibleIndices.append(index)
      let unspecified = subview.sizeThatFits(proposedSize(main: nil, cross: nil, axis: axis))
      children.append(MeasuredChild(
        size: ideal,
        proposal: idealProposal,
        crossProposal: crossProposal,
        crossContribution: crossLength(unspecified, axis: axis),
        canCompress: false
      ))
    } else {
      children.append(MeasuredChild(
        size: ideal,
        proposal: idealProposal,
        crossProposal: crossProposal,
        crossContribution: crossLength(ideal, axis: axis),
        canCompress: true
      ))
    }
  }

  let flexible = Set(flexibleIndices)
  if let offeredMain {
    compressChildren(
      &children,
      subviews: subviews,
      offeredMain: offeredMain,
      flexibleIndices: flexible,
      spacings: spacings,
      axis: axis
    )
  }
  if let offeredMain, !flexibleIndices.isEmpty {
    let fixedMain = children.enumerated().reduce(CGFloat(0)) { total, item in
      flexible.contains(item.offset) ? total : total + mainLength(item.element.size, axis: axis)
    }
    var remaining = max(0, offeredMain - fixedMain - spacings.reduce(0, +))
    for (offset, index) in flexibleIndices.enumerated() {
      let slotsLeft = flexibleIndices.count - offset
      let share = slotsLeft == 1 ? remaining : (remaining / CGFloat(slotsLeft)).rounded(.down)
      remaining -= share
      let childProposal = proposedSize(main: share, cross: children[index].crossProposal, axis: axis)
      children[index].size = subviews[index].sizeThatFits(childProposal)
      children[index].proposal = childProposal
    }
  }

  let contentMain = children.reduce(CGFloat(0)) { $0 + mainLength($1.size, axis: axis) } + spacings.reduce(0, +)
  let contentCross = children.map(\.crossContribution).max() ?? 0
  return MeasuredChildren(
    children: children,
    contentMain: contentMain,
    contentCross: contentCross,
    definiteMain: definiteMain,
    definiteCross: definiteCross
  )
}

@available(iOS 16.0, tvOS 16.0, macOS 13.0, *)
private struct CompressionCandidate {
  let index: Int
  let idealMain: CGFloat
  let slack: CGFloat
}

@available(iOS 16.0, tvOS 16.0, macOS 13.0, *)
private func compressChildren(
  _ children: inout [MeasuredChild],
  subviews: LayoutSubviews,
  offeredMain: CGFloat,
  flexibleIndices: Set<Int>,
  spacings: [CGFloat],
  axis: Axis
) {
  let fixedMain = children.enumerated().reduce(CGFloat(0)) { total, item in
    flexibleIndices.contains(item.offset) ? total : total + mainLength(item.element.size, axis: axis)
  }
  let overflow = fixedMain + spacings.reduce(0, +) - offeredMain
  guard overflow > 1 else { return }

  var candidates: [CompressionCandidate] = []
  for index in children.indices where !flexibleIndices.contains(index) && children[index].canCompress {
    let minSize = subviews[index].sizeThatFits(
      proposedSize(main: 0, cross: children[index].crossProposal, axis: axis)
    )
    let idealMain = mainLength(children[index].size, axis: axis)
    let slack = idealMain - mainLength(minSize, axis: axis)
    if slack > 1 {
      candidates.append(CompressionCandidate(index: index, idealMain: idealMain, slack: slack))
    }
  }
  guard !candidates.isEmpty else { return }

  var remainingReduction = min(overflow, candidates.reduce(CGFloat(0)) { $0 + $1.slack })
  var remainingSlack = candidates.reduce(CGFloat(0)) { $0 + $1.slack }
  for (offset, candidate) in candidates.enumerated() {
    let isLast = offset == candidates.count - 1
    let share = isLast || remainingSlack <= 0
      ? min(candidate.slack, remainingReduction)
      : min(candidate.slack, (remainingReduction * candidate.slack / remainingSlack).rounded(.down))
    remainingReduction -= share
    remainingSlack -= candidate.slack
    guard share > 0 else { continue }
    let proposal = proposedSize(
      main: candidate.idealMain - share,
      cross: children[candidate.index].crossProposal,
      axis: axis
    )
    let size = subviews[candidate.index].sizeThatFits(proposal)
    children[candidate.index].size = size
    children[candidate.index].proposal = proposal
    children[candidate.index].crossContribution = crossLength(size, axis: axis)
  }
}

@available(iOS 16.0, tvOS 16.0, macOS 13.0, *)
private func proposedSize(main: CGFloat?, cross: CGFloat?, axis: Axis) -> ProposedViewSize {
  switch axis {
  case .horizontal:
    return ProposedViewSize(width: main, height: cross)
  case .vertical:
    return ProposedViewSize(width: cross, height: main)
  }
}

@available(iOS 16.0, tvOS 16.0, macOS 13.0, *)
private func mainLength(_ size: CGSize, axis: Axis) -> CGFloat {
  axis == .horizontal ? size.width : size.height
}

@available(iOS 16.0, tvOS 16.0, macOS 13.0, *)
private func crossLength(_ size: CGSize, axis: Axis) -> CGFloat {
  axis == .horizontal ? size.height : size.width
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
