// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

/**
 Sizes shared by a universal `width` or `height`.
 Points are density-independent pixels. Fractions are a portion of the parent, so `0.5` is `50%`.
 */
internal struct UniversalLayoutDimensions: Hashable {
  var widthPoints: CGFloat?
  var widthFraction: CGFloat?
  var heightPoints: CGFloat?
  var heightFraction: CGFloat?

  var hasFraction: Bool { widthFraction != nil || heightFraction != nil }
}

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
  if let value = value as? Double {
    return finite(CGFloat(value))
  }
  if let value = value as? Int {
    return finite(CGFloat(value))
  }
  return nil
}

/// A missing, negative, or non-finite value is nil.
private func finite(_ value: CGFloat?) -> CGFloat? {
  guard let value, value.isFinite, value >= 0 else { return nil }
  return value
}

/**
 Resolves a percentage against the proposal this view actually received.
 Fixed sizes are applied separately, as a SwiftUI `frame`.
 A view with no percentage keeps its own layout.
 */
internal struct UniversalLayoutModifier: ViewModifier, Record {
  @Field var widthPoints: CGFloat?
  @Field var widthFraction: CGFloat?
  @Field var heightPoints: CGFloat?
  @Field var heightFraction: CGFloat?

  @ViewBuilder
  func body(content: Content) -> some View {
    let dimensions = UniversalLayoutDimensions(
      widthPoints: finite(widthPoints),
      widthFraction: finite(widthFraction),
      heightPoints: finite(heightPoints),
      heightFraction: finite(heightFraction)
    )
    if dimensions.hasFraction {
      ResolvedUniversalLayout(dimensions: dimensions, content: content)
    } else {
      content
    }
  }
}

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
    // This modifier sits outside the stack, so the stack sees this proposal.
    // Offering `bounds` would turn a nil scroll axis into a percentage base.
    let childProposal = resolvesPercentages
      ? placementProposal(bounds: bounds, proposal: proposal)
      : proposal
    subview.place(at: bounds.origin, proposal: childProposal)
  }
}

/**
 Opt-in replacement for `HStack`.
 Universal `Row` uses it so a child percentage is a fraction of this stack.
 A child that grows on the main axis, such as `Spacer`, shares the leftover space.
 Text and other children that can shrink give up space when the ideals do not fit.
 A higher `layoutPriority` keeps its size first in both cases.
 The cross axis gets the size this stack was offered, so text can wrap.
 */
internal struct ParentAwareHStackLayout: Layout {
  let alignment: VerticalAlignmentOptions
  let spacing: CGFloat?
  let ownDimensions: UniversalLayoutDimensions
  // A fraction counts only after a universal parent has resolved it.
  // A child fraction adopts the parent offer only then, too.
  let resolvesOwnPercentage: Bool

  private var stack: StackConfiguration {
    StackConfiguration(
      axis: .horizontal,
      alignment: alignment.stackAlignment,
      spacing: spacing,
      ownDimensions: ownDimensions,
      resolvesOwnPercentage: resolvesOwnPercentage
    )
  }

  func makeCache(subviews: Subviews) -> StackLayoutCache {
    StackLayoutCache()
  }

  func updateCache(_ cache: inout StackLayoutCache, subviews: Subviews) {
    cache.reset()
  }

  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout StackLayoutCache) -> CGSize {
    stack.measurement(for: proposal, subviews: subviews, cache: &cache).size
  }

  func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout StackLayoutCache) {
    stack.place(in: bounds, proposal: proposal, subviews: subviews, cache: &cache)
  }
}

/**
 Opt-in replacement for `VStack`. Universal `Column` uses it. See `ParentAwareHStackLayout`.
 */
internal struct ParentAwareVStackLayout: Layout {
  let alignment: HorizontalAlignmentOptions
  let spacing: CGFloat?
  let ownDimensions: UniversalLayoutDimensions
  // A fraction counts only after a universal parent has resolved it.
  // A child fraction adopts the parent offer only then, too.
  let resolvesOwnPercentage: Bool

  private var stack: StackConfiguration {
    StackConfiguration(
      axis: .vertical,
      alignment: alignment.stackAlignment,
      spacing: spacing,
      ownDimensions: ownDimensions,
      resolvesOwnPercentage: resolvesOwnPercentage
    )
  }

  func makeCache(subviews: Subviews) -> StackLayoutCache {
    StackLayoutCache()
  }

  func updateCache(_ cache: inout StackLayoutCache, subviews: Subviews) {
    cache.reset()
  }

  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout StackLayoutCache) -> CGSize {
    stack.measurement(for: proposal, subviews: subviews, cache: &cache).size
  }

  func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout StackLayoutCache) {
    stack.place(in: bounds, proposal: proposal, subviews: subviews, cache: &cache)
  }
}

/**
 Measurements by proposal.
 SwiftUI asks for several sizes and then places with one of them, so placement reuses that measurement.
 SwiftUI resets the cache when the subviews change.
 */
internal struct StackLayoutCache {
  fileprivate var measurements: [StackMeasurementKey: StackMeasurement] = [:]

  fileprivate mutating func reset() {
    measurements.removeAll(keepingCapacity: true)
  }
}

private struct StackMeasurementKey: Hashable {
  let width: CGFloat?
  let height: CGFloat?
  let spacing: CGFloat?
  let ownDimensions: UniversalLayoutDimensions
  let resolvesOwnPercentage: Bool
}

private struct StackAlignment {
  enum Fill {
    case start
    case center
    case end
  }

  /// The guide every child lines up on.
  let guide: (ViewDimensions) -> CGFloat
  /// Where the aligned children sit when the stack is larger than they are.
  let fill: Fill

  func offset(container: CGFloat, content: CGFloat) -> CGFloat {
    switch fill {
    case .start:
      return 0
    case .center:
      return (container - content) / 2
    case .end:
      return container - content
    }
  }
}

extension VerticalAlignmentOptions {
  fileprivate var stackAlignment: StackAlignment {
    let guide = toVerticalAlignment()
    let fill: StackAlignment.Fill
    switch self {
    case .top, .firstTextBaseline, .lastTextBaseline:
      fill = .start
    case .center:
      fill = .center
    case .bottom:
      fill = .end
    }
    return StackAlignment(guide: { $0[guide] }, fill: fill)
  }
}

extension HorizontalAlignmentOptions {
  fileprivate var stackAlignment: StackAlignment {
    let guide = toHorizontalAlignment()
    let fill: StackAlignment.Fill
    switch self {
    case .leading:
      fill = .start
    case .center:
      fill = .center
    case .trailing:
      fill = .end
    }
    return StackAlignment(guide: { $0[guide] }, fill: fill)
  }
}

private struct StackMeasurement {
  let size: CGSize
  let sizes: [CGSize]
  let proposals: [ProposedViewSize]
  let spacings: [CGFloat]
  /// Cross-axis offset of each child inside the aligned content.
  let crossOffsets: [CGFloat]
  let contentCross: CGFloat
}

private struct MeasuredChild {
  var size: CGSize
  var proposal: ProposedViewSize
  /// Cross-axis proposal from the first pass.
  /// The flexible pass must keep it, or a `ScrollView` in a column loses the column width.
  var crossProposal: CGFloat?
  /// Grows past its ideal size on the main axis, so it shares the leftover space.
  var flexible: Bool
  /// False for a resolved percentage or a flexible child.
  var canCompress: Bool
  var priority: Double
  var maxMain: CGFloat
}

private struct MeasuredChildren {
  var children: [MeasuredChild]
  var contentMain: CGFloat
  var definiteMain: CGFloat?
  var definiteCross: CGFloat?
}

private struct CompressionCandidate {
  let index: Int
  let idealMain: CGFloat
  let minMain: CGFloat
  let priority: Double

  var slack: CGFloat { idealMain - minMain }
}

private struct StackConfiguration {
  let axis: Axis
  let alignment: StackAlignment
  let spacing: CGFloat?
  let ownDimensions: UniversalLayoutDimensions
  let resolvesOwnPercentage: Bool

  func measurement(
    for proposal: ProposedViewSize,
    subviews: LayoutSubviews,
    cache: inout StackLayoutCache
  ) -> StackMeasurement {
    let key = StackMeasurementKey(
      width: proposal.width,
      height: proposal.height,
      spacing: spacing,
      ownDimensions: ownDimensions,
      resolvesOwnPercentage: resolvesOwnPercentage
    )
    if let cached = cache.measurements[key] {
      return cached
    }
    let measurement = measure(proposal: proposal, subviews: subviews)
    if cache.measurements.count >= 8 {
      cache.reset()
    }
    cache.measurements[key] = measurement
    return measurement
  }

  func place(
    in bounds: CGRect,
    proposal: ProposedViewSize,
    subviews: LayoutSubviews,
    cache: inout StackLayoutCache
  ) {
    let measurement = self.measurement(
      for: placementProposal(bounds: bounds, proposal: proposal),
      subviews: subviews,
      cache: &cache
    )
    let fill = alignment.offset(container: crossLength(bounds.size, axis: axis), content: measurement.contentCross)
    // The origin stays leading.
    // SwiftUI mirrors a custom layout in right-to-left.
    var cursor = axis == .horizontal ? bounds.minX : bounds.minY
    for index in subviews.indices {
      let cross = (axis == .horizontal ? bounds.minY : bounds.minX) + fill + measurement.crossOffsets[index]
      let origin = axis == .horizontal ? CGPoint(x: cursor, y: cross) : CGPoint(x: cross, y: cursor)
      subviews[index].place(at: origin, proposal: measurement.proposals[index])
      cursor += mainLength(measurement.sizes[index], axis: axis) + measurement.spacings[index]
    }
  }

  private func measure(proposal: ProposedViewSize, subviews: LayoutSubviews) -> StackMeasurement {
    let spacings = stackSpacings(subviews: subviews, explicit: spacing)
    let measured = measureChildren(subviews: subviews, proposal: proposal, spacings: spacings)
    // A flexible child reports its cross size for its final main size and no cross proposal.
    // So a `Spacer` does not stretch the stack, and wrapped text counts its lines.
    let dimensions = zip(subviews, measured.children).map { subview, child in
      let dimensionProposal = child.flexible
        ? proposedSize(main: mainLength(child.size, axis: axis), cross: nil, axis: axis)
        : child.proposal
      return subview.dimensions(in: dimensionProposal)
    }
    let guides = dimensions.map(alignment.guide)
    let reference = guides.max() ?? 0
    let extents = zip(dimensions, guides).map { dimension, guide in
      crossLength(CGSize(width: dimension.width, height: dimension.height), axis: axis) - guide
    }
    let contentCross = reference + (extents.max() ?? 0)
    return StackMeasurement(
      size: stackSize(
        main: measured.definiteMain ?? measured.contentMain,
        cross: measured.definiteCross ?? contentCross,
        axis: axis
      ),
      sizes: measured.children.map(\.size),
      proposals: measured.children.map(\.proposal),
      spacings: spacings,
      crossOffsets: guides.map { reference - $0 },
      contentCross: contentCross
    )
  }

  private func measureChildren(
    subviews: LayoutSubviews,
    proposal: ProposedViewSize,
    spacings: [CGFloat]
  ) -> MeasuredChildren {
    let offeredMain = finite(axis == .horizontal ? proposal.width : proposal.height)
    let offeredCross = finite(axis == .horizontal ? proposal.height : proposal.width)
    let ownMainPoints = axis == .horizontal ? ownDimensions.widthPoints : ownDimensions.heightPoints
    let ownMainFraction = axis == .horizontal ? ownDimensions.widthFraction : ownDimensions.heightFraction
    let ownCrossPoints = axis == .horizontal ? ownDimensions.heightPoints : ownDimensions.widthPoints
    let ownCrossFraction = axis == .horizontal ? ownDimensions.heightFraction : ownDimensions.widthFraction
    var childHasMainFraction = false
    var childHasCrossFraction = false
    for subview in subviews {
      let dimensions = subview[UniversalLayoutDimensionsKey.self]
      let mainFraction = axis == .horizontal ? dimensions.widthFraction : dimensions.heightFraction
      let crossFraction = axis == .horizontal ? dimensions.heightFraction : dimensions.widthFraction
      childHasMainFraction = childHasMainFraction || mainFraction != nil
      childHasCrossFraction = childHasCrossFraction || crossFraction != nil
    }
    let ownsMain = ownMainPoints != nil || (ownMainFraction != nil && resolvesOwnPercentage)
    let ownsCross = ownCrossPoints != nil || (ownCrossFraction != nil && resolvesOwnPercentage)
    var definiteMain = ownsMain ? offeredMain : nil
    var definiteCross = ownsCross ? offeredCross : nil
    // A child fraction adopts a positive offer from a universal parent, and the stack returns that size.
    // A zero proposal is the minimum-size probe, so it still shrink-wraps.
    // Otherwise the next pass would resolve the fraction against the smaller result.
    // Another parent, such as a scroll view with no height, offers its content size, which is not a base.
    if definiteMain == nil, resolvesOwnPercentage, childHasMainFraction, let offeredMain, offeredMain > 0 {
      definiteMain = offeredMain
    }
    if definiteCross == nil, resolvesOwnPercentage, childHasCrossFraction, let offeredCross, offeredCross > 0 {
      definiteCross = offeredCross
    }

    var children: [MeasuredChild] = []
    children.reserveCapacity(subviews.count)

    for subview in subviews {
      let dimensions = subview[UniversalLayoutDimensionsKey.self]
      let mainFraction = axis == .horizontal ? dimensions.widthFraction : dimensions.heightFraction
      let crossFraction = axis == .horizontal ? dimensions.heightFraction : dimensions.widthFraction
      // A fraction uses the size chosen above.
      // Every other child still gets the offered cross size, so text can wrap.
      let crossProposal = crossFraction != nil ? definiteCross : offeredCross

      if mainFraction != nil, let definiteMain {
        let childProposal = proposedSize(main: definiteMain, cross: crossProposal, axis: axis)
        let size = subview.sizeThatFits(childProposal)
        children.append(MeasuredChild(
          size: size,
          proposal: childProposal,
          crossProposal: crossProposal,
          flexible: false,
          canCompress: false,
          priority: subview.priority,
          maxMain: mainLength(size, axis: axis)
        ))
        continue
      }

      let idealProposal = proposedSize(main: nil, cross: crossProposal, axis: axis)
      let ideal = subview.sizeThatFits(idealProposal)
      let maxed = subview.sizeThatFits(proposedSize(main: .infinity, cross: crossProposal, axis: axis))
      let idealMain = mainLength(ideal, axis: axis)
      let maxMain = mainLength(maxed, axis: axis)
      let flexible = offeredMain != nil && (maxMain.isInfinite || maxMain > idealMain + 1)
      children.append(MeasuredChild(
        size: ideal,
        proposal: idealProposal,
        crossProposal: crossProposal,
        flexible: flexible,
        canCompress: !flexible,
        priority: subview.priority,
        maxMain: maxMain
      ))
    }

    if let offeredMain {
      compressChildren(&children, subviews: subviews, offeredMain: offeredMain, spacings: spacings)
      growChildren(&children, subviews: subviews, offeredMain: offeredMain, spacings: spacings)
    }

    let contentMain = children.reduce(CGFloat(0)) { $0 + mainLength($1.size, axis: axis) } + spacings.reduce(0, +)
    return MeasuredChildren(
      children: children,
      contentMain: contentMain,
      definiteMain: definiteMain,
      definiteCross: definiteCross
    )
  }

  private func compressChildren(
    _ children: inout [MeasuredChild],
    subviews: LayoutSubviews,
    offeredMain: CGFloat,
    spacings: [CGFloat]
  ) {
    let fixedMain = children.reduce(CGFloat(0)) { total, child in
      child.flexible ? total : total + mainLength(child.size, axis: axis)
    }
    let overflow = fixedMain + spacings.reduce(0, +) - offeredMain
    guard overflow > 1 else { return }

    var candidates: [CompressionCandidate] = []
    for index in children.indices where children[index].canCompress {
      let minSize = subviews[index].sizeThatFits(
        proposedSize(main: 0, cross: children[index].crossProposal, axis: axis)
      )
      let candidate = CompressionCandidate(
        index: index,
        idealMain: mainLength(children[index].size, axis: axis),
        minMain: mainLength(minSize, axis: axis),
        priority: children[index].priority
      )
      if candidate.slack > 1 {
        candidates.append(candidate)
      }
    }
    guard !candidates.isEmpty else { return }

    // A higher priority keeps its ideal size while the lower ones can still reach their minimum.
    // Among equals, smallest slack first, so a short label keeps its width when that fits an equal share.
    // The long text then takes what remains.
    candidates.sort { lhs, rhs in
      if lhs.priority != rhs.priority { return lhs.priority > rhs.priority }
      if lhs.slack != rhs.slack { return lhs.slack < rhs.slack }
      return lhs.index < rhs.index
    }
    let candidateIndices = Set(candidates.map(\.index))
    let reserved = children.enumerated().reduce(CGFloat(0)) { total, item in
      if item.element.flexible || candidateIndices.contains(item.offset) {
        return total
      }
      return total + mainLength(item.element.size, axis: axis)
    }
    var available = max(0, offeredMain - spacings.reduce(0, +) - reserved)
    for (position, candidate) in candidates.enumerated() {
      let rest = candidates[(position + 1)...]
      let peers = rest.prefix { $0.priority == candidate.priority }.count + 1
      let lowerMinimum = rest.dropFirst(peers - 1).reduce(CGFloat(0)) { $0 + $1.minMain }
      let share = min(candidate.idealMain, max(0, available - lowerMinimum) / CGFloat(peers))
      let proposal = proposedSize(
        main: share,
        cross: children[candidate.index].crossProposal,
        axis: axis
      )
      let size = subviews[candidate.index].sizeThatFits(proposal)
      children[candidate.index].size = size
      children[candidate.index].proposal = proposal
      available = max(0, available - mainLength(size, axis: axis))
    }
  }

  /// Flexible children share the space left by the others.
  /// A higher priority goes first.
  /// Among equals, the least flexible goes first, so a capped child leaves the rest to a `Spacer`.
  private func growChildren(
    _ children: inout [MeasuredChild],
    subviews: LayoutSubviews,
    offeredMain: CGFloat,
    spacings: [CGFloat]
  ) {
    let order = children.indices.filter { children[$0].flexible }.sorted { lhs, rhs in
      if children[lhs].priority != children[rhs].priority { return children[lhs].priority > children[rhs].priority }
      if children[lhs].maxMain != children[rhs].maxMain { return children[lhs].maxMain < children[rhs].maxMain }
      return lhs < rhs
    }
    guard !order.isEmpty else { return }

    let fixedMain = children.reduce(CGFloat(0)) { total, child in
      child.flexible ? total : total + mainLength(child.size, axis: axis)
    }
    var remaining = max(0, offeredMain - fixedMain - spacings.reduce(0, +))
    for (position, index) in order.enumerated() {
      let peers = order[(position + 1)...].prefix { children[$0].priority == children[index].priority }.count + 1
      let share = peers == 1 ? remaining : (remaining / CGFloat(peers)).rounded(.down)
      let proposal = proposedSize(main: share, cross: children[index].crossProposal, axis: axis)
      let size = subviews[index].sizeThatFits(proposal)
      children[index].size = size
      children[index].proposal = proposal
      // A child that takes less than its share leaves the rest to the next one.
      remaining = max(0, remaining - mainLength(size, axis: axis))
    }
  }
}

private func proposedSize(main: CGFloat?, cross: CGFloat?, axis: Axis) -> ProposedViewSize {
  switch axis {
  case .horizontal:
    return ProposedViewSize(width: main, height: cross)
  case .vertical:
    return ProposedViewSize(width: cross, height: main)
  }
}

private func stackSize(main: CGFloat, cross: CGFloat, axis: Axis) -> CGSize {
  switch axis {
  case .horizontal:
    return CGSize(width: main, height: cross)
  case .vertical:
    return CGSize(width: cross, height: main)
  }
}

private func mainLength(_ size: CGSize, axis: Axis) -> CGFloat {
  axis == .horizontal ? size.width : size.height
}

private func crossLength(_ size: CGSize, axis: Axis) -> CGFloat {
  axis == .horizontal ? size.height : size.width
}

/// Unset spacing is 0, as on Android and web.
/// The system distance sits on top of child percentages and pushes them past the stack.
/// An explicit spacing is kept.
private func stackSpacings(subviews: LayoutSubviews, explicit: CGFloat?) -> [CGFloat] {
  let gap = explicit ?? 0
  return subviews.indices.map { index in
    guard index < subviews.count - 1 else { return 0 }
    return gap
  }
}

private extension ProposedViewSize {
  func resolving(_ dimensions: UniversalLayoutDimensions) -> ProposedViewSize {
    ProposedViewSize(
      width: resolvedAxis(dimensions.widthFraction, proposal: width),
      height: resolvedAxis(dimensions.heightFraction, proposal: height)
    )
  }
}

/// An axis with no fraction keeps the proposal, including infinity.
/// A fraction of a non-finite proposal is nil, not infinity.
/// A larger fraction is clamped to the proposal, so 150% stays inside the parent.
private func resolvedAxis(_ fraction: CGFloat?, proposal: CGFloat?) -> CGFloat? {
  guard let fraction else {
    return proposal
  }
  guard let base = finite(proposal) else {
    return nil
  }
  return min(base * fraction, base)
}

/// Bounds replace an axis the parent already made finite.
/// An unspecified or infinite axis stays as proposed, so a content size is not a percentage base.
private func placementProposal(bounds: CGRect, proposal: ProposedViewSize) -> ProposedViewSize {
  ProposedViewSize(
    width: finite(proposal.width) != nil ? bounds.width : proposal.width,
    height: finite(proposal.height) != nil ? bounds.height : proposal.height
  )
}
