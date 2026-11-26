// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

// MARK: - Individual ViewModifier Structs

internal enum ListSectionSpacingType: String, Enumerable {
  case `default`
  case compact
  case custom
}

internal struct ListSectionSpacingModifier: ViewModifier, Record {
  @Field var spacing: ListSectionSpacingType = .default
  @Field var value: CGFloat = 0

  func body(content: Content) -> some View {
#if os(tvOS) || os(macOS)
    content
#else
    if #available(iOS 17.0, *) {
      switch spacing {
      case .compact:
        content.listSectionSpacing(.compact)
      case .custom:
        content.listSectionSpacing(value)
      default:
        content.listSectionSpacing(.default)
      }
    } else {
      content
    }
#endif
  }
}

internal struct CornerRadiusModifier: ViewModifier, Record {
  @Field var radius: CGFloat = 0

  func body(content: Content) -> some View {
    content.cornerRadius(radius)
  }
}

internal struct ShadowModifier: ViewModifier, Record {
  @Field var color: Color = .white
  @Field var radius: CGFloat = 0
  @Field var x: CGFloat = 0
  @Field var y: CGFloat = 0

  func body(content: Content) -> some View {
    content.shadow(color: color, radius: radius, x: x, y: y)
  }
}

internal struct FrameModifier: ViewModifier, Record {
  @Field var width: CGFloat?
  @Field var height: CGFloat?
  @Field var minWidth: CGFloat?
  @Field var maxWidth: CGFloat?
  @Field var minHeight: CGFloat?
  @Field var maxHeight: CGFloat?
  @Field var idealWidth: CGFloat?
  @Field var idealHeight: CGFloat?
  @Field var alignment: AlignmentOptions = .center

  func body(content: Content) -> some View {
    if width != nil || height != nil {
      content.frame(width: width, height: height, alignment: alignment.toAlignment())
    } else {
      content.frame(
        minWidth: minWidth,
        idealWidth: idealWidth,
        maxWidth: maxWidth,
        minHeight: minHeight,
        idealHeight: idealHeight,
        maxHeight: maxHeight,
        alignment: alignment.toAlignment()
      )
    }
  }
}

internal struct PaddingModifier: ViewModifier, Record {
  @Field var all: PaddingValue?
  @Field var horizontal: PaddingValue?
  @Field var vertical: PaddingValue?

  @Field var top: PaddingValue?
  @Field var leading: PaddingValue?
  @Field var bottom: PaddingValue?
  @Field var trailing: PaddingValue?

  /**
   The value of each edge, where a value set for a specific edge wins over the shorthands
   covering that edge. A `nil` edge was not set at all and gets no padding.
   */
  private var resolvedEdges: (top: PaddingValue?, leading: PaddingValue?, bottom: PaddingValue?, trailing: PaddingValue?) {
    (
      top: top ?? vertical ?? all,
      leading: leading ?? horizontal ?? all,
      bottom: bottom ?? vertical ?? all,
      trailing: trailing ?? horizontal ?? all
    )
  }

  /**
   The edges left to the system, which `EdgeInsets` cannot express.
   */
  private var defaultEdges: Edge.Set {
    let edges = resolvedEdges
    var result: Edge.Set = []

    if edges.top?.isDefault == true {
      result.insert(.top)
    }
    if edges.leading?.isDefault == true {
      result.insert(.leading)
    }
    if edges.bottom?.isDefault == true {
      result.insert(.bottom)
    }
    if edges.trailing?.isDefault == true {
      result.insert(.trailing)
    }
    return result
  }

  private var insets: EdgeInsets {
    let edges = resolvedEdges

    return EdgeInsets(
      top: edges.top?.length ?? 0,
      leading: edges.leading?.length ?? 0,
      bottom: edges.bottom?.length ?? 0,
      trailing: edges.trailing?.length ?? 0
    )
  }

  func body(content: Content) -> some View {
    let edges = resolvedEdges

    if edges.top == nil && edges.leading == nil && edges.bottom == nil && edges.trailing == nil {
      // Default SwiftUI padding (system spacing)
      content.padding()
    } else {
      // `EdgeInsets` can only carry lengths, so the edges left to the system are applied by a
      // second call. Padding modifiers add up and these two cover disjoint edges.
      if defaultEdges.isEmpty {
        content.padding(insets)
      } else {
        content.padding(insets).padding(defaultEdges)
      }
    }
  }
}

internal struct OpacityModifier: ViewModifier, Record {
  @Field var value: Double = 1.0

  func body(content: Content) -> some View {
    content.opacity(value)
  }
}

internal struct ScaleEffectModifier: ViewModifier, Record {
  @Field var x: CGFloat = 1.0
  @Field var y: CGFloat = 1.0

  func body(content: Content) -> some View {
    content.scaleEffect(x: x, y: y)
  }
}

internal struct RotationEffectModifier: ViewModifier, Record {
  @Field var angle: Double = 0

  func body(content: Content) -> some View {
    content.rotationEffect(.degrees(angle))
  }
}

internal struct OffsetModifier: ViewModifier, Record {
  @Field var x: CGFloat = 0
  @Field var y: CGFloat = 0

  func body(content: Content) -> some View {
    content.offset(x: x, y: y)
  }
}

internal struct ForegroundColorModifier: ViewModifier, Record {
  @Field var color: Color?

  func body(content: Content) -> some View {
    if let color = color {
      content.foregroundColor(color)
    } else {
      content
    }
  }
}

internal struct LuminanceToAlphaModifier: ViewModifier, Record {
  func body(content: Content) -> some View {
    content.luminanceToAlpha()
  }
}

internal struct BoldModifier: ViewModifier, Record {
  func body(content: Content) -> some View {
    if #available(iOS 16.0, tvOS 16.0, *) {
      content.bold()
    }
  }
}

internal struct ItalicModifier: ViewModifier, Record {
  func body(content: Content) -> some View {
    if #available(iOS 16.0, tvOS 16.0, *) {
      content.italic()
    }
  }
}

internal struct MonospacedDigitModifier: ViewModifier, Record {
  func body(content: Content) -> some View {
    content.monospacedDigit()
  }
}

internal struct TintModifier: ViewModifier, Record {
  @Field var tint: ShapeStyleValue?

  func body(content: Content) -> some View {
    if let shapeStyle = tint?.toAnyShapeStyle() {
      content.tint(shapeStyle)
    } else {
      content
    }
  }
}

internal struct HiddenModifier: ViewModifier, Record {
  @Field var hidden: Bool = true

  func body(content: Content) -> some View {
    if hidden {
      content.hidden()
    } else {
      content
    }
  }
}

internal struct LabelsHiddenModifier: ViewModifier, Record {
  func body(content: Content) -> some View {
    content.labelsHidden()
  }
}

internal struct DisabledModifier: ViewModifier, Record {
  @Field var disabled: Bool = true

  func body(content: Content) -> some View {
    content.disabled(disabled)
  }
}

internal enum RedactionReason: String, Enumerable {
  case placeholder
  case privacy
  case invalidated
}

internal struct RedactedModifier: ViewModifier, Record {
  @Field var reasons: [RedactionReason] = [.placeholder]

  func body(content: Content) -> some View {
    content.redacted(reason: resolveReasons())
  }

  private func resolveReasons() -> RedactionReasons {
    var set: RedactionReasons = []
    for reason in reasons {
      switch reason {
      case .placeholder: set.insert(.placeholder)
      case .privacy: set.insert(.privacy)
      case .invalidated:
        if #available(iOS 17.0, tvOS 17.0, macOS 14.0, *) {
          set.insert(.invalidated)
        }
      }
    }
    return set
  }
}

internal struct UnredactedModifier: ViewModifier, Record {
  func body(content: Content) -> some View {
    content.unredacted()
  }
}

internal struct PrivacySensitiveModifier: ViewModifier, Record {
  @Field var sensitive: Bool = true

  func body(content: Content) -> some View {
    content.privacySensitive(sensitive)
  }
}

internal struct InvalidatableContentModifier: ViewModifier, Record {
  @Field var invalidatable: Bool = true

  func body(content: Content) -> some View {
    if #available(iOS 17.0, tvOS 17.0, macOS 14.0, *) {
      content.invalidatableContent(invalidatable)
    } else {
      content
    }
  }
}

internal struct ZIndexModifier: ViewModifier, Record {
  @Field var index: Double = 0

  func body(content: Content) -> some View {
    content.zIndex(index)
  }
}

internal struct BlurModifier: ViewModifier, Record {
  @Field var radius: CGFloat = 0

  func body(content: Content) -> some View {
    content.blur(radius: radius)
  }
}

internal struct BrightnessModifier: ViewModifier, Record {
  @Field var amount: Double = 0

  func body(content: Content) -> some View {
    content.brightness(amount)
  }
}

internal struct ContrastModifier: ViewModifier, Record {
  @Field var amount: Double = 1

  func body(content: Content) -> some View {
    content.contrast(amount)
  }
}

internal struct SaturationModifier: ViewModifier, Record {
  @Field var amount: Double = 1

  func body(content: Content) -> some View {
    content.saturation(amount)
  }
}

internal struct ColorInvertModifier: ViewModifier, Record {
  @Field var inverted: Bool = true

  func body(content: Content) -> some View {
    if inverted {
      content.colorInvert()
    } else {
      content
    }
  }
}

internal struct GrayscaleModifier: ViewModifier, Record {
  @Field var amount: Double = 0

  func body(content: Content) -> some View {
    content.grayscale(amount)
  }
}

internal struct BorderModifier: ViewModifier, Record {
  // Declared as `shapeStyle` because `content` is taken by the parameter of `body(content:)`.
  @Field("content") var shapeStyle: ShapeStyleValue?
  @Field var width: CGFloat = 1.0

  func body(content: Content) -> some View {
    if let resolvedStyle = shapeStyle?.toAnyShapeStyle() {
      content.border(resolvedStyle, width: width)
    } else {
      content
    }
  }
}

internal struct ClipShapeModifier: ViewModifier, Record {
  @Field var shape: ShapeType = .rectangle
  @Field var cornerRadius: CGFloat = 8
  @Field var roundedCornerStyle: RoundedCornerStyle?
  @Field var cornerSize: CornerSize?

  @ViewBuilder
  func body(content: Content) -> some View {
    switch shape {
    case .capsule:
      content.clipShape(makeCapsule(style: roundedCornerStyle))
    case .circle:
      content.clipShape(Circle())
    case .containerRelativeShape:
      content.clipShape(ContainerRelativeShape())
    case .ellipse:
      content.clipShape(Ellipse())
    case .rectangle:
      content.clipShape(Rectangle())
    case .roundedRectangle:
      content.clipShape(makeRoundedRectangle(cornerRadius: cornerRadius, cornerSize: cornerSize, style: roundedCornerStyle))
    }
  }
}

internal struct StrokeBorderModifier: ViewModifier, Record {
  // Declared as `shapeStyle` because `content` is taken by the parameter of `body(content:)`.
  @Field("content") var shapeStyle: ShapeStyleValue?
  @Field var style: StrokeStyleConfig?
  @Field var antialiased: Bool = true
  @Field var shape: ShapeType = .rectangle
  @Field var cornerRadius: CGFloat = 8
  @Field var roundedCornerStyle: RoundedCornerStyle?
  @Field var cornerSize: CornerSize?

  func body(content: Content) -> some View {
    content.overlay(strokeBorderView())
  }

  @ViewBuilder
  private func strokeBorderView() -> some View {
    let strokeStyle = (style ?? StrokeStyleConfig()).toStrokeStyle()
    switch shape {
    case .capsule:
      applyStrokeBorder(makeCapsule(style: roundedCornerStyle), strokeStyle)
    case .circle:
      applyStrokeBorder(Circle(), strokeStyle)
    case .containerRelativeShape:
      applyStrokeBorder(ContainerRelativeShape(), strokeStyle)
    case .ellipse:
      applyStrokeBorder(Ellipse(), strokeStyle)
    case .rectangle:
      applyStrokeBorder(Rectangle(), strokeStyle)
    case .roundedRectangle:
      applyStrokeBorder(makeRoundedRectangle(cornerRadius: cornerRadius, cornerSize: cornerSize, style: roundedCornerStyle), strokeStyle)
    }
  }

  @ViewBuilder
  private func applyStrokeBorder<S: InsettableShape>(_ shape: S, _ strokeStyle: StrokeStyle) -> some View {
    if let resolvedStyle = shapeStyle?.toAnyShapeStyle() {
      shape.strokeBorder(resolvedStyle, style: strokeStyle, antialiased: antialiased)
    } else {
      shape.strokeBorder(style: strokeStyle, antialiased: antialiased)
    }
  }
}

internal struct OnTapGestureModifier: EventDispatchingViewModifier, Record {
  var eventDispatcher: EventDispatcher?

  init() {}

  func body(content: Content) -> some View {
    if #available(iOS 15.0, tvOS 16.0, *) {
      content.onTapGesture {
        eventDispatcher?(["onTapGesture": [:]])
      }
    }
  }
}

internal struct OnLongPressGestureModifier: EventDispatchingViewModifier, Record {
  @Field var minimumDuration: Double = 0.5
  var eventDispatcher: EventDispatcher?

  init() {}

  func body(content: Content) -> some View {
    content.onLongPressGesture(minimumDuration: minimumDuration) {
      eventDispatcher?(["onLongPressGesture": [:]])
    }
  }
}

internal struct OnAppearModifier: EventDispatchingViewModifier, Record {
  var eventDispatcher: EventDispatcher?

  init() {}

  func body(content: Content) -> some View {
    content.onAppear {
      eventDispatcher?(["onAppear": [:]])
    }
  }
}

internal struct OnDisappearModifier: EventDispatchingViewModifier, Record {
  var eventDispatcher: EventDispatcher?

  init() {}

  func body(content: Content) -> some View {
    content.onDisappear {
      eventDispatcher?(["onDisappear": [:]])
    }
  }
}

internal struct HueRotationModifier: ViewModifier, Record {
  @Field var angle: Double = 0

  func body(content: Content) -> some View {
    content.hueRotation(.degrees(angle))
  }
}

internal enum ScrollDismissesKeyboardMode: String, Enumerable {
  case automatic
  case never
  case interactively
  case immediately
}

internal struct ScrollDismissesKeyboardModifier: ViewModifier, Record {
  @Field var mode: ScrollDismissesKeyboardMode = .automatic

  func body(content: Content) -> some View {
    if #available(iOS 16.0, macOS 13.0, tvOS 16.0, *) {
      switch mode {
      case .interactively:
        content.scrollDismissesKeyboard(.interactively)
      case .immediately:
        content.scrollDismissesKeyboard(.immediately)
      case .never:
        content.scrollDismissesKeyboard(.never)
      case .automatic:
        content.scrollDismissesKeyboard(.automatic)
      }
    } else {
      content
    }
  }
}

internal enum MenuActionDismissBehaviorMode: String, Enumerable {
  case automatic
  case disabled
  case enabled
}

internal struct MenuActionDismissBehaviorModifier: ViewModifier, Record {
  @Field var behavior: MenuActionDismissBehaviorMode = .automatic

  func body(content: Content) -> some View {
    if #available(iOS 16.4, macOS 13.3, tvOS 17.0, *) {
      switch behavior {
      case .automatic:
        content.menuActionDismissBehavior(.automatic)
      case .disabled:
#if os(macOS)
        content.menuActionDismissBehavior(.automatic)
#else
        content.menuActionDismissBehavior(.disabled)
#endif
      case .enabled:
        content.menuActionDismissBehavior(.enabled)
      }
    } else {
      content
    }
  }
}

internal struct AccessibilityLabelModifier: ViewModifier, Record {
  @Field var label: String?

  func body(content: Content) -> some View {
    if let label = label {
      content.accessibilityLabel(label)
    } else {
      content
    }
  }
}

internal struct AccessibilityHintModifier: ViewModifier, Record {
  @Field var hint: String?

  func body(content: Content) -> some View {
    if let hint = hint {
      content.accessibilityHint(hint)
    } else {
      content
    }
  }
}

internal struct AccessibilityValueModifier: ViewModifier, Record {
  @Field var value: String?

  func body(content: Content) -> some View {
    if let value = value {
      content.accessibilityValue(value)
    } else {
      content
    }
  }
}

internal struct AccessibilityInputLabelsModifier: ViewModifier, Record {
  @Field var inputLabels: [String]?

  func body(content: Content) -> some View {
    if let inputLabels = inputLabels {
      content.accessibilityInputLabels(inputLabels.map { Text($0) })
    } else {
      content
    }
  }
}

internal struct AccessibilityIdentifierModifier: ViewModifier, Record {
  @Field var identifier: String?

  func body(content: Content) -> some View {
    if let identifier = identifier {
      content.accessibilityIdentifier(identifier)
    } else {
      content
    }
  }
}

internal struct AccessibilityHiddenModifier: ViewModifier, Record {
  @Field var hidden: Bool = true

  func body(content: Content) -> some View {
    content.accessibilityHidden(hidden)
  }
}

internal enum AccessibilityChildBehaviorType: String, Enumerable {
  case ignore
  case combine
  case contain

  func toNative() -> AccessibilityChildBehavior {
    switch self {
    case .ignore:
      return .ignore
    case .combine:
      return .combine
    case .contain:
      return .contain
    }
  }
}

internal struct AccessibilityElementModifier: ViewModifier, Record {
  @Field var children: AccessibilityChildBehaviorType = .ignore

  func body(content: Content) -> some View {
    content.accessibilityElement(children: children.toNative())
  }
}

internal enum AccessibilityTraitType: String, Enumerable {
  case isButton
  case isHeader
  case isImage
  case isSelected
  case isLink
  case isModal
  case isSummaryElement
  case updatesFrequently
  case startsMediaSession
  case allowsDirectInteraction
  case causesPageTurn
  case isToggle
  case playsSound
  case isStaticText
  case isSearchField
  case isKeyboardKey
  case isTabBar

  func toNative() -> AccessibilityTraits? {
    switch self {
    case .isButton:
      return .isButton
    case .isHeader:
      return .isHeader
    case .isImage:
      return .isImage
    case .isSelected:
      return .isSelected
    case .isLink:
      return .isLink
    case .isModal:
      return .isModal
    case .isSummaryElement:
      return .isSummaryElement
    case .updatesFrequently:
      return .updatesFrequently
    case .startsMediaSession:
      return .startsMediaSession
    case .allowsDirectInteraction:
      return .allowsDirectInteraction
    case .causesPageTurn:
      return .causesPageTurn
    case .isToggle:
      if #available(iOS 17.0, tvOS 17.0, macOS 14.0, *) {
        return .isToggle
      }
      return nil
    case .playsSound:
      return .playsSound
    case .isStaticText:
      return .isStaticText
    case .isSearchField:
      return .isSearchField
    case .isKeyboardKey:
      return .isKeyboardKey
    case .isTabBar:
      if #available(iOS 17.0, tvOS 17.0, macOS 14.0, *) {
        return .isTabBar
      }
      return nil
    }
  }
}

internal func combineAccessibilityTraits(_ traits: [AccessibilityTraitType]) -> AccessibilityTraits {
  var combined: AccessibilityTraits = []
  for trait in traits {
    if let native = trait.toNative() {
      combined.formUnion(native)
    }
  }
  return combined
}

internal struct AccessibilityAddTraitsModifier: ViewModifier, Record {
  @Field var traits: [AccessibilityTraitType] = []

  func body(content: Content) -> some View {
    content.accessibilityAddTraits(combineAccessibilityTraits(traits))
  }
}

internal struct AccessibilityRemoveTraitsModifier: ViewModifier, Record {
  @Field var traits: [AccessibilityTraitType] = []

  func body(content: Content) -> some View {
    content.accessibilityRemoveTraits(combineAccessibilityTraits(traits))
  }
}

internal struct LayoutPriorityModifier: ViewModifier, Record {
  @Field var priority: Double = 0

  func body(content: Content) -> some View {
    content.layoutPriority(priority)
  }
}

internal struct AspectRatioModifier: ViewModifier, Record {
  @Field var ratio: Double?
  @Field var contentMode: String = "fit"

  func body(content: Content) -> some View {
    let mode: ContentMode = contentMode == "fill" ? .fill : .fit
    if let ratio {
      content.aspectRatio(ratio, contentMode: mode)
    } else {
      content.aspectRatio(contentMode: mode)
    }
  }
}

internal struct ClippedModifier: ViewModifier, Record {
  @Field var clipped: Bool = true

  func body(content: Content) -> some View {
    if clipped {
      content.clipped()
    } else {
      content
    }
  }
}

internal struct MaskModifier: ViewModifier, Record {
  @Field var shape: ShapeType = .rectangle
  @Field var cornerRadius: CGFloat = 8
  @Field var roundedCornerStyle: RoundedCornerStyle?
  @Field var cornerSize: CornerSize?

  @ViewBuilder
  func body(content: Content) -> some View {
    switch shape {
    case .capsule:
      content.mask(makeCapsule(style: roundedCornerStyle))
    case .circle:
      content.mask(Circle())
    case .containerRelativeShape:
      content.mask(ContainerRelativeShape())
    case .ellipse:
      content.mask(Ellipse())
    case .rectangle:
      content.mask(Rectangle())
    case .roundedRectangle:
      content.mask(makeRoundedRectangle(cornerRadius: cornerRadius, cornerSize: cornerSize, style: roundedCornerStyle))
    }
  }
}

internal struct OverlayModifier: ViewModifier, Record {
  @Field var color: Color?
  @Field var alignment: AlignmentOptions = .center
  func body(content: Content) -> some View {
    if let color = color {
      content.overlay(color, alignment: alignment.toAlignment())
    } else {
      content
    }
  }
}

internal struct BackgroundOverlayModifier: ViewModifier, Record {
  @Field var color: Color?
  @Field var alignment: AlignmentOptions = .center

  func body(content: Content) -> some View {
    if let color = color {
      content.background(color, alignment: alignment.toAlignment())
    } else {
      content
    }
  }
}

internal struct FixedSizeModifier: ViewModifier, Record {
  @Field var horizontal: Bool?
  @Field var vertical: Bool?

  func body(content: Content) -> some View {
    if let horizontal, let vertical {
      content.fixedSize(horizontal: horizontal, vertical: vertical)
    } else if let horizontal {
      content.fixedSize(horizontal: horizontal, vertical: false)
    } else if let vertical {
      content.fixedSize(horizontal: false, vertical: vertical)
    } else {
      content.fixedSize()
    }
  }
}

internal struct IgnoreSafeAreaModifier: ViewModifier, Record {
  @Field var regions: SafeAreaRegionOptions?
  @Field var edges: EdgeOptions?

  func body(content: Content) -> some View {
    if let regions, let edges {
      content.ignoresSafeArea(regions.toSafeAreaRegions(), edges: edges.toEdge())
    } else if let regions {
      content.ignoresSafeArea(regions.toSafeAreaRegions())
    } else if let edges {
      content.ignoresSafeArea(edges: edges.toEdge())
    } else {
      content.ignoresSafeArea()
    }
  }
}

/**
 * A type-erased wrapper for `ViewModifier`
 */
internal struct AnyViewModifier: ViewModifier {
  private let _body: (Content) -> AnyView

  init<T: ViewModifier>(_ modifier: T) {
    _body = { content in
      AnyView(content.modifier(modifier))
    }
  }

  func body(content: Content) -> some View {
    _body(content)
  }
}

/**
 * Prunability-stable wrapper for `AnyViewModifier`
 */
internal struct StableViewModifier: ViewModifier {
  let params: [String: Any]
  weak var appContext: AppContext?
  let dispatcher: EventDispatcher

  func body(content: Content) -> some View {
    if let type = params["$type"] as? String,
      let appContext,
      let modifier = try? ViewModifierRegistry.shared.createModifier(type, params: params, appContext: appContext, eventDispatcher: dispatcher) {
      content.modifier(AnyViewModifier(modifier))
    } else {
      content
    }
  }
}

internal struct AnimationModifier: ViewModifier, Record {
  @Field var animation: AnimationConfig
  @Field var animatedValue: Either<Double, Bool>?

  func body(content: Content) -> some View {
    let animationValue = animation.toSwiftUIAnimation()
    if let value: Bool = animatedValue?.get() {
      content.animation(animationValue, value: value)
    } else if let value: Double = animatedValue?.get() {
      content.animation(animationValue, value: value)
    } else {
      content
    }
  }
}

internal enum ScrollContentBackgroundTypes: String, Enumerable {
  case automatic
  case hidden
  case visible
}

internal struct ScrollContentBackground: ViewModifier, Record {
  @Field var visible: ScrollContentBackgroundTypes = .visible

  func body(content: Content) -> some View {
#if os(tvOS)
    content
#else
    if #available(iOS 16.0, *) {
      switch visible {
      case .visible:
        content.scrollContentBackground(.visible)
      case .hidden:
        content.scrollContentBackground(.hidden)
      case .automatic:
        content.scrollContentBackground(.automatic)
      }
    } else {
      content
    }
#endif
  }
}

internal struct ListRowBackground: ViewModifier, Record {
  @Field var color: Color?

  func body(content: Content) -> some View {
    if let color = color {
      content.listRowBackground(color)
    } else {
      content
    }
  }
}

internal enum VerticalEdgeOptions: String, Enumerable {
  case all
  case top
  case bottom

  func toVerticalEdges() -> VerticalEdge.Set {
    switch self {
    case .all:
      return .all
    case .top:
      return .top
    case .bottom:
      return .bottom
    }
  }
}

internal struct ListRowSeparator: ViewModifier, Record {
  @Field var visibility: VisibilityOptions = .automatic
  @Field var edges: VerticalEdgeOptions?

  func body(content: Content) -> some View {
#if os(tvOS)
    content
#else
    if let edges {
      content.listRowSeparator(visibility.toVisibility(), edges: edges.toVerticalEdges())
    } else {
      content.listRowSeparator(visibility.toVisibility())
    }
#endif
  }
}

internal struct ListRowSeparatorTint: ViewModifier, Record {
  @Field var color: Color?
  @Field var edges: VerticalEdgeOptions?

  func body(content: Content) -> some View {
#if os(tvOS)
    content
#else
    if let edges {
      content.listRowSeparatorTint(color, edges: edges.toVerticalEdges())
    } else {
      content.listRowSeparatorTint(color)
    }
#endif
  }
}

internal struct ListRowSpacing: ViewModifier, Record {
  @Field var spacing: Double?

  func body(content: Content) -> some View {
#if os(iOS)
    if #available(iOS 15.0, *) {
      content.listRowSpacing(spacing.map { CGFloat($0) })
    } else {
      content
    }
#else
    content
#endif
  }
}

internal enum AlignmentGuideOptions: String, Enumerable {
  case leading
  case center
  case trailing
  case listRowSeparatorLeading
  case listRowSeparatorTrailing

  var horizontalAlignment: HorizontalAlignment? {
    switch self {
    case .leading:
      return .leading
    case .center:
      return .center
    case .trailing:
      return .trailing
    case .listRowSeparatorLeading:
#if os(tvOS)
      return nil
#else
      return .listRowSeparatorLeading
#endif
    case .listRowSeparatorTrailing:
#if os(tvOS)
      return nil
#else
      return .listRowSeparatorTrailing
#endif
    }
  }
}

internal struct AlignmentGuideModifier: ViewModifier, Record {
  @Field var guide: AlignmentGuideOptions = .leading
  @Field var value: Double = 0

  func body(content: Content) -> some View {
    if let alignment = guide.horizontalAlignment {
      content.alignmentGuide(alignment) { _ in CGFloat(value) }
    } else {
      content
    }
  }
}

internal enum TextTruncationModeTypes: String, Enumerable {
  case head
  case middle
  case tail
}

internal struct TextTruncationMode: ViewModifier, Record {
  @Field var mode: TextTruncationModeTypes = .tail

  func body(content: Content) -> some View {
    switch mode {
    case .head:
      content.truncationMode(.head)
    case .middle:
      content.truncationMode(.middle)
    case .tail:
      content.truncationMode(.tail)
    }
  }
}

internal struct TextKerning: ViewModifier, Record {
  @Field var value: CGFloat = 0

  func body(content: Content) -> some View {
    if #available(iOS 16.0, macOS 13.0, tvOS 16.0, *) {
      content.kerning(value)
    } else {
      content
    }
  }
}

internal struct TextAllowsTightening: ViewModifier, Record {
  @Field var value: Bool = true

  func body(content: Content) -> some View {
    if #available(iOS 13.0, macOS 10.15, tvOS 16.0, *) {
      content.allowsTightening(value)
    } else {
      content
    }
  }
}

internal struct MinimumScaleFactorModifier: ViewModifier, Record {
  @Field var factor: CGFloat = 1.0

  func body(content: Content) -> some View {
    content.minimumScaleFactor(factor)
  }
}

internal enum TextCaseTypes: String, Enumerable {
  case lowercase
  case uppercase
}

internal struct TextCase: ViewModifier, Record {
  @Field var value: TextCaseTypes = .lowercase

  func body(content: Content) -> some View {
    switch value {
    case .lowercase:
      content.textCase(.lowercase)
    case .uppercase:
      content.textCase(.uppercase)
    }
  }
}

internal enum TextLinePattern: String, Enumerable {
  case solid
  case dash
  case dot
  case dashDot
  case dashDotDot
}

internal extension TextLinePattern {
  func toSwiftUI() -> Text.LineStyle.Pattern {
    switch self {
    case .solid: return .solid
    case .dash: return .dash
    case .dot: return .dot
    case .dashDot: return .dashDot
    case .dashDotDot: return .dashDotDot
    }
  }
}

internal struct TextUnderLine: ViewModifier, Record {
  @Field var isActive: Bool = false
  @Field var pattern: TextLinePattern = .solid
  @Field var color: Color?

  func body(content: Content) -> some View {
    if #available(iOS 16.0, macOS 13.0, tvOS 16.0, *) {
      switch pattern {
      case .solid:
        content.underline(isActive, pattern: .solid, color: color)
      case .dash:
        content.underline(isActive, pattern: .dash, color: color)
      case .dot:
        content.underline(isActive, pattern: .dot, color: color)
      case .dashDot:
        content.underline(isActive, pattern: .dashDot, color: color)
      case .dashDotDot:
        content.underline(isActive, pattern: .dashDotDot, color: color)
      }
    } else {
      content
    }
  }
}

internal struct TextStrikeThrough: ViewModifier, Record {
  @Field var isActive: Bool = false
  @Field var pattern: TextLinePattern = .solid
  @Field var color: Color?

  func body(content: Content) -> some View {
    if #available(iOS 16.0, macOS 13.0, tvOS 16.0, *) {
      switch pattern {
      case .solid:
        content.strikethrough(isActive, pattern: .solid, color: color)
      case .dash:
        content.strikethrough(isActive, pattern: .dash, color: color)
      case .dot:
        content.strikethrough(isActive, pattern: .dot, color: color)
      case .dashDot:
        content.strikethrough(isActive, pattern: .dashDot, color: color)
      case .dashDotDot:
        content.strikethrough(isActive, pattern: .dashDotDot, color: color)
      }
    } else {
      content
    }
  }
}

internal enum TextAligment: String, Enumerable {
  case center
  case leading
  case trailing
}

internal struct MultilineTextAlignment: ViewModifier, Record {
  @Field var alignment: TextAligment = .leading

  func body(content: Content) -> some View {
    switch alignment {
    case .center:
      content.multilineTextAlignment(.center)
    case .leading:
      content.multilineTextAlignment(.leading)
    case .trailing:
      content.multilineTextAlignment(.trailing)
    }
  }
}

internal struct TextSelection: ViewModifier, Record {
  @Field var value: Bool = true

  func body(content: Content) -> some View {
#if os(tvOS)
    content
#else
    switch value {
    case true:
      content.textSelection(.enabled)
    case false:
      content.textSelection(.disabled)
    }
#endif
  }
}

internal struct LineSpacing: ViewModifier, Record {
  @Field var value: CGFloat?

  func body(content: Content) -> some View {
    if let value {
      content.lineSpacing(value)
    } else {
      content
    }
  }
}

internal struct LineHeight: ViewModifier, Record {
  @Field var value: CGFloat?

  func body(content: Content) -> some View {
    if let value {
      if #available(iOS 26.0, macOS 26.0, tvOS 26.0, *) {
        content.lineHeight(.exact(points: value))
      } else {
        content
      }
    } else {
      content
    }
  }
}

internal enum Prominence: String, Enumerable {
  case standard
  case increased
}

internal struct HeaderProminence: ViewModifier, Record {
  @Field var prominence: Prominence?

  func body(content: Content) -> some View {
    if let prominence = prominence {
      switch prominence {
      case .standard:
        content.headerProminence(.standard)
      case .increased:
        content.headerProminence(.increased)
      }
    } else {
      content
    }
  }
}

internal struct ListRowInsets: ViewModifier, Record {
  @Field var top: CGFloat?
  @Field var leading: CGFloat?
  @Field var bottom: CGFloat?
  @Field var trailing: CGFloat?

  func body(content: Content) -> some View {
    if top == nil && leading == nil && bottom == nil && trailing == nil {
      content
    } else {
      content.listRowInsets(.init(
        top: top ?? 0,
        leading: leading ?? 0,
        bottom: bottom ?? 0,
        trailing: trailing ?? 0
      ))
    }
  }
}

internal enum BadgeProminenceType: String, Enumerable {
  case standard
  case increased
  case decreased
}

internal struct BadgeProminence: ViewModifier, Record {
  @Field var badgeType: BadgeProminenceType = .standard

  func body(content: Content) -> some View {
#if os(tvOS)
    content
#else
    if #available(iOS 17.0, macOS 14.0, *) {
      switch badgeType {
      case .standard:
        content.badgeProminence(.standard)
      case .increased:
        content.badgeProminence(.increased)
      case .decreased:
        content.badgeProminence(.decreased)
      }
    } else {
      content
    }
#endif
  }
}

internal struct Badge: ViewModifier, Record {
  @Field var value: String?

  func body(content: Content) -> some View {
#if os(tvOS)
    content
#else
    if let value {
      content.badge(value)
    } else {
      content
    }
#endif
  }
}

internal struct ListSectionMargins: ViewModifier, Record {
  @Field var length: CGFloat?
  @Field var edges: EdgeOptions?

  func body(content: Content) -> some View {
#if compiler(>=6.2) && !os(tvOS) && !os(macOS) // Xcode 26
    if #available(iOS 26.0, *) {
      if let edges {
        content.listSectionMargins(edges.toEdge(), length ?? 0)
      } else {
        content
      }
    } else {
      content
    }
#else
    content
#endif
  }
}

internal struct GridCellUnsizedAxes: ViewModifier, Record {
  @Field var axes: AxisOptions?

  func body(content: Content) -> some View {
    if #available(iOS 16.0, macOS 13.0, tvOS 16.0, *) {
      if let axes {
        content.gridCellUnsizedAxes(axes.toAxis())
      } else {
        content
      }
    } else {
      content
    }
  }
}

internal struct GridCellColumns: ViewModifier, Record {
  @Field var count: Int?

  func body(content: Content) -> some View {
    if #available(iOS 16.0, macOS 13.0, tvOS 16.0, *) {
      if let count {
        content.gridCellColumns(count)
      } else {
        content
      }
    } else {
      content
    }
  }
}

internal enum GridColumnAlignmentType: String, Enumerable {
  case leading
  case center
  case trailing

  var alignment: HorizontalAlignment {
    switch self {
    case .center: return .center
    case .leading: return .leading
    case .trailing: return .trailing
    }
  }
}

internal struct GridColumnAlignment: ViewModifier, Record {
  @Field var alignment: GridColumnAlignmentType?

  func body(content: Content) -> some View {
    if #available(iOS 16.0, macOS 13.0, tvOS 16.0, *) {
      if let alignment {
        content.gridColumnAlignment(alignment.alignment)
      } else {
        content
      }
    } else {
      content
    }
  }
}

internal enum UnitPointOptions: String, Enumerable {
  case zero
  case topLeading
  case top
  case topTrailing
  case leading
  case center
  case trailing
  case bottomLeading
  case bottom
  case bottomTrailing

  var toUnitPoint: UnitPoint {
    switch self {
    case .zero: return .zero
    case .topLeading: return .topLeading
    case .top: return .top
    case .topTrailing: return .topTrailing
    case .leading: return .leading
    case .center: return .center
    case .trailing: return .trailing
    case .bottomLeading: return .bottomLeading
    case .bottom: return .bottom
    case .bottomTrailing: return .bottomTrailing
    }
  }
}

internal struct GridCellAnchor: ViewModifier, Record {
  @Field var points: UnitPoint?
  @Field var type: String?
  @Field var anchor: UnitPointOptions?

  func body(content: Content) -> some View {
    if #available(iOS 16.0, macOS 13.0, tvOS 16.0, *) {
      if let points {
        content.gridCellAnchor(points)
      } else if type == "preset", let anchor {
        content.gridCellAnchor(anchor.toUnitPoint)
      } else {
        content
      }
    } else {
      content
    }
  }
}

// MARK: - Registry

/**
 * A modifier that sends events to JavaScript, for example `onTapGesture`.
 * The registry sets `eventDispatcher` to the dispatcher of the view when it creates the modifier.
 */
public protocol EventDispatchingViewModifier: ViewModifier {
  var eventDispatcher: EventDispatcher? { get set }
}

/**
 * Registry for SwiftUI view modifiers that can be applied from React Native.
 * This system uses ViewModifier structs for better performance than AnyView wrapping.
 */
public class ViewModifierRegistry {
  static let shared = ViewModifierRegistry()

  public typealias ModifierFactory = ([String: Any], AppContext, EventDispatcher) throws -> any ViewModifier

  internal enum Registration {
    case type(() -> any (ViewModifier & Record).Type)
    case eventDispatchingType(() -> any (EventDispatchingViewModifier & Record).Type)
    case factory(ModifierFactory)
  }
  private(set) internal var registrations: [String: Registration] = [:]

  public static var widgetKit: WidgetKitModifiers?

  private init() {
    registrations = Dictionary(uniqueKeysWithValues: builtInModifiers())
  }

  /**
   * Public API to register a custom modifier with the given type name.
   * The registry creates the modifier from the params of `createModifier` in JavaScript, which set its `@Field` properties.
   *
   * - Important: Call this in `OnCreate` of your module definition to ensure modifiers
   *   are registered before any views are rendered.
   */
  public static func register<Modifier: ViewModifier & Record>(_ type: String, _ modifierType: Modifier.Type) {
    shared.register(type, modifierType)
  }

  /**
   * Public API to register a custom modifier that sends events, with the given type name.
   * The modifier also gets the event dispatcher of the view.
   *
   * - Important: Call this in `OnCreate` of your module definition to ensure modifiers
   *   are registered before any views are rendered.
   * - Note: Swift selects this overload only when the static type of the modifier conforms to
   *   `EventDispatchingViewModifier`. A call from generic code that requires only `ViewModifier & Record`
   *   registers a modifier that gets no event dispatcher.
   */
  public static func register<Modifier: EventDispatchingViewModifier & Record>(_ type: String, _ modifierType: Modifier.Type) {
    shared.register(type, modifierType)
  }

  /**
   * Public API to register a custom modifier with the given type name and a factory that creates it.
   *
   * - Important: Call this in `OnCreate` of your module definition to ensure modifiers
   *   are registered before any views are rendered.
   */
  @available(*, deprecated, message: "Use register(_:_:) with the type of the modifier instead.")
  public static func register(
    _ type: String,
    factory: @escaping ModifierFactory
  ) {
    shared.register(type, .factory(factory))
  }

  /**
   * Public API to unregister a custom modifier by type name.
   *
   * - Important: Call this in `OnDestroy` of your module definition for proper cleanup.
   */
  public static func unregister(_ type: String) {
    shared.unregister(type)
  }

  /**
   * Registers a new modifier type with the given type name.
   */
  internal func register(_ type: String, _ modifierType: @autoclosure @escaping () -> any (ViewModifier & Record).Type) {
    register(type, .type(modifierType))
  }

  /**
   * Registers a new modifier type that sends events with the given type name.
   */
  internal func register(_ type: String, _ modifierType: @autoclosure @escaping () -> any (EventDispatchingViewModifier & Record).Type) {
    register(type, .eventDispatchingType(modifierType))
  }

  private func register(_ type: String, _ registration: Registration) {
    if registrations.updateValue(registration, forKey: type) != nil {
      log.warn("ViewModifierRegistry: Overwriting existing modifier '\(type)'. This may cause unexpected behavior.")
    }
  }

  /**
   * Unregisters a modifier by type name.
   */
  internal func unregister(_ type: String) {
    registrations.removeValue(forKey: type)
  }

  /**
   * Creates the modifier registered with the given type name from its params.
   * Returns nil if the modifier type is not registered.
   */
  internal func createModifier(
    _ type: String,
    params: [String: Any],
    appContext: AppContext,
    eventDispatcher: EventDispatcher
  ) throws -> (any ViewModifier)? {
    switch registrations[type] {
    case .type(let modifierType):
      return try modifierType().from(dictionary: params, appContext: appContext)
    case .eventDispatchingType(let modifierType):
      var modifier = try modifierType().from(dictionary: params, appContext: appContext)
      modifier.eventDispatcher = eventDispatcher
      return modifier
    case .factory(let factory):
      return try factory(params, appContext, eventDispatcher)
    case nil:
      return nil
    }
  }

  /**
   * Applies a modifier to an AnyView by type name and parameters.
   * Returns the original view if the modifier type is not found.
   * This method handles the type erasure properly for extensibility.
   */
  func applyModifier(
    _ type: String,
    to view: AnyView,
    appContext: AppContext,
    globalEventDispatcher: EventDispatcher,
    params: [String: Any]
  ) -> AnyView {
    guard registrations[type] != nil else {
      return view
    }
    return AnyView(view.modifier(StableViewModifier(
      params: params,
      appContext: appContext,
      dispatcher: globalEventDispatcher
    )))
  }

  /**
   * Applies Text returning modifiers. Useful for Text concatenation in TextView.
   */
  func applyTextModifier(
    _ type: String,
    to text: Text,
    appContext: AppContext,
    params: [String: Any]
  ) -> Text {
    switch type {
    case "bold":
      return text.bold()
    case "italic":
      return text.italic()
    case "monospacedDigit":
      return text.monospacedDigit()
    case "font":
      guard let modifier = try? FontModifier(from: params, appContext: appContext) else { return text }
      return text.font(modifier.resolveFont())
    case "foregroundColor":
      guard let modifier = try? ForegroundColorModifier(from: params, appContext: appContext),
            let color = modifier.color else { return text }
      return text.foregroundColor(color)
    case "foregroundStyle":
      guard let modifier = try? ForegroundStyleModifier(from: params, appContext: appContext) else { return text }
      if #available(iOS 17.0, tvOS 17.0, *) {
        return applyForegroundStyle(modifier, to: text)
      } else if modifier.style?.type == .color, let color = modifier.style?.color {
        return text.foregroundColor(color)
      }
      return text
    case "underline":
      guard let modifier = try? TextUnderLine(from: params, appContext: appContext) else { return text }
      return text.underline(modifier.isActive, pattern: modifier.pattern.toSwiftUI(), color: modifier.color)
    case "strikethrough":
      guard let modifier = try? TextStrikeThrough(from: params, appContext: appContext) else { return text }
      return text.strikethrough(modifier.isActive, pattern: modifier.pattern.toSwiftUI(), color: modifier.color)
    default:
      #if DEBUG
      return Text(" ['\(type)' not supported for nested Text]").foregroundColor(.red)
      #else
      return text
      #endif
    }
  }

  /**
   * Applies Image returning modifiers.
   */
  func applyImageModifier(
    _ type: String,
    to image: Image,
    appContext: AppContext,
    params: [String: Any]
  ) -> Image {
    switch type {
    case "resizable":
      guard let modifier = try? ResizableModifier(from: params, appContext: appContext)
      else { return image.resizable() }
      return image.resizable(capInsets: EdgeInsets(top: modifier.top, leading: modifier.leading, bottom: modifier.bottom, trailing: modifier.trailing), resizingMode: modifier.resizingMode.toResizingMode)
    case "renderingMode":
      let modifier = try? RenderingModeModifier(from: params, appContext: appContext)
      return image.renderingMode(modifier?.mode?.toTemplateRenderingMode)
    default:
      #if DEBUG
      return image
      #else
      return image
      #endif
    }
  }

  /**
   * Checks if a modifier type is registered.
   */
  func hasModifier(_ type: String) -> Bool {
    return registrations[type] != nil
  }

  /**
   * Returns all registered modifier types.
   */
  func registeredTypes() -> [String] {
    return Array(registrations.keys)
  }
}

internal enum MatchedGeometryPropertiesOptions: String, Enumerable {
  case frame
  case position
  case size

  var toMatchedGeometryProperties: MatchedGeometryProperties {
    switch self {
    case .frame: return .frame
    case .position: return .position
    case .size: return .size
    }
  }
}

internal struct MatchedGeometryEffectModifier: ViewModifier, Record {
  @Field var id: String?
  @Field var namespaceId: String?
  @Field var properties: MatchedGeometryPropertiesOptions = .frame
  @Field var anchor: UnitPointOptions = .center
  @Field var isSource: Bool = true

  func body(content: Content) -> some View {
    if let namespaceId, let namespace = NamespaceRegistry.shared.namespace(forKey: namespaceId) {
      content.matchedGeometryEffect(
        id: id,
        in: namespace,
        properties: properties.toMatchedGeometryProperties,
        anchor: anchor.toUnitPoint,
        isSource: isSource
      )
    } else {
      content
    }
  }
}

internal struct GeometryGroupModifier: ViewModifier, Record {
  func body(content: Content) -> some View {
    if #available(iOS 17.0, tvOS 17.0, macOS 14.0, *) {
      content.geometryGroup()
    } else {
      content
    }
  }
}

internal enum ButtonStyle: String, Enumerable {
  case automatic
  case bordered
  case borderedProminent
  case borderless
  case glass
  case glassProminent
  case plain
}

internal struct ButtonStyleModifier: ViewModifier, Record {
  @Field var style: ButtonStyle = .automatic

  func body(content: Content) -> some View {
    switch style {
    case .bordered:
      content.buttonStyle(.bordered)
    case .borderedProminent:
      content.buttonStyle(.borderedProminent)
    case .borderless:
      if #available(iOS 13.0, macOS 10.15, tvOS 17.0, *) {
        content.buttonStyle(.borderless)
      } else {
        content.buttonStyle(.automatic)
      }
    case .glass:
      if #available(iOS 26.0, macOS 26.0, tvOS 26.0, *) {
#if compiler(>=6.2) // Xcode 26
        content.buttonStyle(.glass)
#else
        content.buttonStyle(.automatic)
#endif
      } else {
        content.buttonStyle(.automatic)
      }
    case .glassProminent:
      if #available(iOS 26.0, macOS 26.0, tvOS 26.0, *) {
#if compiler(>=6.2) // Xcode 26
        content.buttonStyle(.glassProminent)
#else
        content.buttonStyle(.automatic)
#endif
      } else {
        content.buttonStyle(.automatic)
      }
    case .plain:
      content.buttonStyle(.plain)
    default:
      content.buttonStyle(.automatic)
    }
  }
}

internal enum TextFieldStyle: String, Enumerable {
  case automatic
  case plain
  case roundedBorder
}

internal struct TextFieldStyleModifier: ViewModifier, Record {
  @Field var style: TextFieldStyle = .automatic

  func body(content: Content) -> some View {
    switch style {
    case .plain:
      content.textFieldStyle(.plain)
    case .roundedBorder:
#if os(iOS)
      content.textFieldStyle(.roundedBorder)
#else
      content.textFieldStyle(.automatic)
#endif
    default:
      content.textFieldStyle(.automatic)
    }
  }
}

internal struct NavigationTitleModifier: ViewModifier, Record {
  @Field var title: String?

  @ViewBuilder
  func body(content: Content) -> some View {
    if let title {
      content.navigationTitle(title)
    } else {
      content
    }
  }
}

internal enum NavigationBarTitleDisplayMode: String, Enumerable {
  case automatic
  case inline
  case large

#if os(iOS)
  var value: NavigationBarItem.TitleDisplayMode {
    switch self {
    case .automatic:
      return .automatic
    case .inline:
      return .inline
    case .large:
      return .large
    }
  }
#endif
}

internal struct NavigationBarTitleDisplayModeModifier: ViewModifier, Record {
  @Field var displayMode: NavigationBarTitleDisplayMode = .automatic

  func body(content: Content) -> some View {
#if os(iOS)
    content.navigationBarTitleDisplayMode(displayMode.value)
#else
    content
#endif
  }
}

internal enum ToolbarTitleDisplayModeType: String, Enumerable {
  case automatic
  case inline
  case inlineLarge
  case large

  @available(iOS 17.0, tvOS 17.0, macOS 14.0, *)
  var value: SwiftUI.ToolbarTitleDisplayMode? {
    switch self {
    case .automatic:
      return .automatic
    case .inline:
      return .inline
    case .inlineLarge:
#if os(tvOS)
      return nil
#else
      return .inlineLarge
#endif
    case .large:
#if os(iOS)
      return .large
#else
      return nil
#endif
    }
  }
}

internal struct ToolbarTitleDisplayModeModifier: ViewModifier, Record {
  @Field var mode: ToolbarTitleDisplayModeType = .automatic

  @ViewBuilder
  func body(content: Content) -> some View {
    if #available(iOS 17.0, tvOS 17.0, macOS 14.0, *) {
      if let value = mode.value {
        content.toolbarTitleDisplayMode(value)
      } else {
        content
      }
    } else {
      content
    }
  }
}

// MARK: - Built-in Modifier Registration

// swiftlint:disable:next no_grouping_extension
extension ViewModifierRegistry {
  private func builtInModifiers() -> [(String, Registration)] {
    return [
      entry("listSectionSpacing", ListSectionSpacingModifier.self),

      entry("background", BackgroundModifier.self),

      entry("cornerRadius", CornerRadiusModifier.self),

      entry("shadow", ShadowModifier.self),

      entry("frame", FrameModifier.self),

      entry("universalLayout", UniversalLayoutModifier.self),

      entry("padding", PaddingModifier.self),

      entry("opacity", OpacityModifier.self),

      entry("scaleEffect", ScaleEffectModifier.self),

      entry("rotationEffect", RotationEffectModifier.self),

      entry("rotation3DEffect", Rotation3DEffectModifier.self),

      entry("offset", OffsetModifier.self),

      entry("foregroundColor", ForegroundColorModifier.self),

      entry("foregroundStyle", ForegroundStyleModifier.self),

      entry("luminanceToAlpha", LuminanceToAlphaModifier.self),

      entry("bold", BoldModifier.self),

      entry("italic", ItalicModifier.self),

      entry("monospacedDigit", MonospacedDigitModifier.self),

      entry("tint", TintModifier.self),

      entry("selectedSegmentTintColor", SelectedSegmentTintColorModifier.self),

      entry("hidden", HiddenModifier.self),

      entry("labelsHidden", LabelsHiddenModifier.self),

      entry("disabled", DisabledModifier.self),

      entry("redacted", RedactedModifier.self),

      entry("unredacted", UnredactedModifier.self),

      entry("privacySensitive", PrivacySensitiveModifier.self),

      entry("invalidatableContent", InvalidatableContentModifier.self),

      entry("zIndex", ZIndexModifier.self),

      entry("blur", BlurModifier.self),

      entry("brightness", BrightnessModifier.self),

      entry("contrast", ContrastModifier.self),

      entry("saturation", SaturationModifier.self),

      entry("colorInvert", ColorInvertModifier.self),

      entry("grayscale", GrayscaleModifier.self),

      entry("border", BorderModifier.self),
      entry("strokeBorder", StrokeBorderModifier.self),

      entry("clipShape", ClipShapeModifier.self),

      entry("onTapGesture", OnTapGestureModifier.self),

      entry("onLongPressGesture", OnLongPressGestureModifier.self),

      entry("onAppear", OnAppearModifier.self),

      entry("onDisappear", OnDisappearModifier.self),

      entry("onGeometryChange", OnGeometryChangeModifier.self),

      entry("refreshable", RefreshableModifier.self),

      entry("hueRotation", HueRotationModifier.self),

      entry("navigationTitle", NavigationTitleModifier.self),

      entry("navigationBarTitleDisplayMode", NavigationBarTitleDisplayModeModifier.self),

      entry("toolbarTitleDisplayMode", ToolbarTitleDisplayModeModifier.self),

      entry("navigationSplitViewStyle", NavigationSplitViewStyleModifier.self),

      entry("navigationSplitViewColumnWidth", NavigationSplitViewColumnWidthModifier.self),

      entry("arrangementViewStyle", ArrangementViewStyleModifier.self),

      entry("splitArrangementLayoutRatio", SplitArrangementLayoutRatioModifier.self),

      entry("splitArrangementLayoutSize", SplitArrangementLayoutSizeModifier.self),

      entry("splitArrangementFixedLayoutSize", SplitArrangementFixedLayoutSizeModifier.self),

      entry("overlayArrangementEdge", OverlayArrangementEdgeModifier.self),

      entry("accessibilityLabel", AccessibilityLabelModifier.self),

      entry("accessibilityHint", AccessibilityHintModifier.self),

      entry("accessibilityValue", AccessibilityValueModifier.self),

      entry("accessibilityInputLabels", AccessibilityInputLabelsModifier.self),

      entry("accessibilityIdentifier", AccessibilityIdentifierModifier.self),

      entry("accessibilityHidden", AccessibilityHiddenModifier.self),

      entry("accessibilityElement", AccessibilityElementModifier.self),

      entry("accessibilityAddTraits", AccessibilityAddTraitsModifier.self),

      entry("accessibilityRemoveTraits", AccessibilityRemoveTraitsModifier.self),

      entry("layoutPriority", LayoutPriorityModifier.self),

      entry("aspectRatio", AspectRatioModifier.self),

      entry("clipped", ClippedModifier.self),

      entry("mask", MaskModifier.self),

      entry("overlay", OverlayModifier.self),

      entry("backgroundOverlay", BackgroundOverlayModifier.self),

      entry("glassEffect", GlassEffectModifier.self),

      entry("animation", AnimationModifier.self),

      entry("glassEffectId", GlassEffectIdModifier.self),

      entry("matchedGeometryEffect", MatchedGeometryEffectModifier.self),

      entry("geometryGroup", GeometryGroupModifier.self),

      entry("fixedSize", FixedSizeModifier.self),

      entry("ignoreSafeArea", IgnoreSafeAreaModifier.self),

      entry("containerShape", ContainerShapeModifier.self),

      entry("contentShape", ContentShapeModifier.self),

      entry("containerRelativeFrame", ContainerRelativeFrameModifier.self),

      entry("buttonStyle", ButtonStyleModifier.self),

      entry("buttonBorderShape", ButtonBorderShapeModifier.self),

      entry("toggleStyle", ToggleStyleModifier.self),

      entry("controlSize", ControlSizeModifier.self),

      entry("labelStyle", LabelStyleModifier.self),

      entry("textFieldStyle", TextFieldStyleModifier.self),

      entry("scrollContentBackground", ScrollContentBackground.self),

      entry("listRowBackground", ListRowBackground.self),

      entry("listRowSeparator", ListRowSeparator.self),

      entry("listRowSeparatorTint", ListRowSeparatorTint.self),

      entry("listRowSpacing", ListRowSpacing.self),

      entry("alignmentGuide", AlignmentGuideModifier.self),

      entry("truncationMode", TextTruncationMode.self),

      entry("kerning", TextKerning.self),

      entry("allowsTightening", TextAllowsTightening.self),

      entry("minimumScaleFactor", MinimumScaleFactorModifier.self),

      entry("textCase", TextCase.self),

      entry("underline", TextUnderLine.self),

      entry("strikethrough", TextStrikeThrough.self),

      entry("multilineTextAlignment", MultilineTextAlignment.self),

      entry("textSelection", TextSelection.self),

      entry("lineSpacing", LineSpacing.self),

      entry("lineHeight", LineHeight.self),

      entry("lineLimit", LineLimitModifier.self),

      entry("listRowInsets", ListRowInsets.self),

      entry("badgeProminence", BadgeProminence.self),

      entry("badge", Badge.self),

      entry("listSectionMargins", ListSectionMargins.self),

      entry("scrollDismissesKeyboard", ScrollDismissesKeyboardModifier.self),

      entry("menuActionDismissBehavior", MenuActionDismissBehaviorModifier.self),

      entry("headerProminence", HeaderProminence.self),

      entry("font", FontModifier.self),

      entry("dynamicTypeSize", DynamicTypeSizeModifier.self),

      entry("imageScale", ImageScaleModifier.self),

      entry("gridCellUnsizedAxes", GridCellUnsizedAxes.self),

      entry("gridCellColumns", GridCellColumns.self),

      entry("gridColumnAlignment", GridColumnAlignment.self),

      entry("gridCellAnchor", GridCellAnchor.self),

      entry("tag", TagModifier.self),

      entry("scrollTargetBehavior", ScrollTargetBehaviorModifier.self),

      entry("scrollTargetLayout", ScrollTargetLayoutModifier.self),

      entry("id", IDModifier.self),

      entry("scrollPosition", ScrollPositionModifier.self),

      entry("searchable", SearchableModifier.self),

      entry("searchToolbarBehavior", SearchToolbarBehaviorModifier.self),

      entry("pickerStyle", PickerStyleModifier.self),

      entry("menuOrder", MenuOrderModifier.self),

      entry("menuStyle", MenuStyleModifier.self),

      entry("menuIndicator", MenuIndicatorModifier.self),

      entry("submitLabel", SubmitLabelModifier.self),

      entry("textInputAutocapitalization", TextInputAutocapitalizationModifier.self),

      entry("textContentType", TextContentTypeModifier.self),

      entry("datePickerStyle", DatePickerStyleModifier.self),

      entry("scrollDisabled", ScrollDisabledModifier.self),

      entry("preferredColorScheme", PreferredColorSchemeModifier.self),

      entry("scrollClipDisabled", ScrollClipDisabledModifier.self),

      entry("scrollIndicators", ScrollIndicatorsModifier.self),

      entry("scrollEdgeEffectStyle", ScrollEdgeEffectStyleModifier.self),

      entry("tabViewStyle", TabViewStyleModifier.self),

      entry("indexViewStyle", IndexViewStyleModifier.self),

      entry("defaultScrollAnchor", DefaultScrollAnchorModifier.self),

      entry("defaultScrollAnchorForRole", DefaultScrollAnchorForRoleModifier.self),

      entry("progressViewStyle", ProgressViewStyleModifier.self),

      entry("gaugeStyle", GaugeStyleModifier.self),

      entry("presentationDetents", PresentationDetentsModifier.self),

      entry("presentationDragIndicator", PresentationDragIndicatorModifier.self),

      entry("presentationCornerRadius", PresentationCornerRadiusModifier.self),

      entry("presentationBackgroundInteraction", PresentationBackgroundInteractionModifier.self),

      entry("interactiveDismissDisabled", InteractiveDismissDisabledModifier.self),

      entry("presentationBackground", PresentationBackgroundModifier.self),

      entry("presentationSizing", PresentationSizingModifier.self),

      entry("listStyle", ListStyleModifier.self),

      entry("sectionIndexLabel", SectionIndexLabelModifier.self),

      entry("moveDisabled", MoveDisabledModifier.self),

      entry("deleteDisabled", DeleteDisabledModifier.self),

      entry("environment", EnvironmentModifier.self),

      entry("contentTransition", ContentTransitionModifier.self),

      entry("keyboardType", KeyboardTypeModifier.self),

      entry("autocorrectionDisabled", AutocorrectionDisabledModifier.self),

      entry("onSubmit", OnSubmitModifier.self),

      entry("containerBackground", ContainerBackgroundModifier.self),

      entry("symbolEffect", SymbolEffectModifier.self),

      entry("onScrollPhaseChange", OnScrollPhaseChangeModifier.self),

      entry("onScrollGeometryChange", OnScrollGeometryChangeModifier.self),

      entry("onHingeChange", OnHingeChangeModifier.self)
    ]
  }

  /**
   * Creates the registration of a built-in modifier type.
   * The type is an autoclosure, so the Swift runtime creates the witness tables of the modifier type when
   * a view first uses it, not for all built-in modifiers when the registry starts. Keep this overload non-generic:
   * a generic function gets the witness tables from its caller, so the caller creates them for all built-in modifiers.
   */
  private func entry(_ type: String, _ modifierType: @autoclosure @escaping () -> any (ViewModifier & Record).Type) -> (String, Registration) {
    return (type, .type(modifierType))
  }

  /**
   * Creates the registration of a built-in modifier type that sends events.
   * The type is an autoclosure for the same reason as in the overload above.
   */
  private func entry(_ type: String, _ modifierType: @autoclosure @escaping () -> any (EventDispatchingViewModifier & Record).Type) -> (String, Registration) {
    return (type, .eventDispatchingType(modifierType))
  }
}
