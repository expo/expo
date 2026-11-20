// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

// MARK: - Individual ViewModifier Structs

internal enum ListSectionSpacingType: String, UIEnum {
  case `default`
  case compact
  case custom
}

@MainActor @AnyViewBuilder
internal func listSectionSpacingModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let spacing: ListSectionSpacingType = try p.value("spacing", .default)
  let value: CGFloat = try p.value("value", 0)
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

@MainActor @AnyViewBuilder
internal func cornerRadiusModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let radius: CGFloat = try p.value("radius", 0)
  content.cornerRadius(radius)
}

@MainActor @AnyViewBuilder
internal func shadowModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let color: Color = try p.value("color", .white)
  let radius: CGFloat = try p.value("radius", 0)
  let x: CGFloat = try p.value("x", 0)
  let y: CGFloat = try p.value("y", 0)
  content.shadow(color: color, radius: radius, x: x, y: y)
}

@MainActor @AnyViewBuilder
internal func frameModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let width: CGFloat? = try p.value("width", nil)
  let height: CGFloat? = try p.value("height", nil)
  let minWidth: CGFloat? = try p.value("minWidth", nil)
  let maxWidth: CGFloat? = try p.value("maxWidth", nil)
  let minHeight: CGFloat? = try p.value("minHeight", nil)
  let maxHeight: CGFloat? = try p.value("maxHeight", nil)
  let idealWidth: CGFloat? = try p.value("idealWidth", nil)
  let idealHeight: CGFloat? = try p.value("idealHeight", nil)
  let alignment: AlignmentOptions = try p.value("alignment", .center)
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

internal struct PaddingModifier: ViewModifier, UIRecord {
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

@MainActor @AnyViewBuilder
internal func opacityModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let value: Double = try p.value("value", 1.0)
  content.opacity(value)
}

@MainActor @AnyViewBuilder
internal func scaleEffectModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let x: CGFloat = try p.value("x", 1.0)
  let y: CGFloat = try p.value("y", 1.0)
  content.scaleEffect(x: x, y: y)
}

@MainActor @AnyViewBuilder
internal func rotationEffectModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let angle: Double = try p.value("angle", 0)
  content.rotationEffect(.degrees(angle))
}

@MainActor @AnyViewBuilder
internal func offsetModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let x: CGFloat = try p.value("x", 0)
  let y: CGFloat = try p.value("y", 0)
  content.offset(x: x, y: y)
}

internal struct ForegroundColorModifier: ViewModifier, UIRecord {
  @Field var color: Color?

  func body(content: Content) -> some View {
    if let color = color {
      content.foregroundColor(color)
    } else {
      content
    }
  }
}

@MainActor @AnyViewBuilder
internal func luminanceToAlphaModifier(_ content: StableContent, _: ModifierParams) throws -> AnyView {
  content.luminanceToAlpha()
}

@MainActor @AnyViewBuilder
internal func boldModifier(_ content: StableContent, _: ModifierParams) throws -> AnyView {
  if #available(iOS 16.0, tvOS 16.0, *) {
    content.bold()
  }
}

@MainActor @AnyViewBuilder
internal func italicModifier(_ content: StableContent, _: ModifierParams) throws -> AnyView {
  if #available(iOS 16.0, tvOS 16.0, *) {
    content.italic()
  }
}

@MainActor @AnyViewBuilder
internal func monospacedDigitModifier(_ content: StableContent, _: ModifierParams) throws -> AnyView {
  content.monospacedDigit()
}

@MainActor @AnyViewBuilder
internal func tintModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let tint: ShapeStyleValue? = try p.value("tint", nil)
  if let shapeStyle = tint?.toAnyShapeStyle() {
    content.tint(shapeStyle)
  } else {
    content
  }
}

@MainActor @AnyViewBuilder
internal func hiddenModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let hidden: Bool = try p.value("hidden", true)
  if hidden {
    content.hidden()
  } else {
    content
  }
}

@MainActor @AnyViewBuilder
internal func labelsHiddenModifier(_ content: StableContent, _: ModifierParams) throws -> AnyView {
  content.labelsHidden()
}

@MainActor @AnyViewBuilder
internal func disabledModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let disabled: Bool = try p.value("disabled", true)
  content.disabled(disabled)
}

internal enum RedactionReason: String, Enumerable {
  case placeholder
  case privacy
  case invalidated
}

internal struct RedactedModifier: ViewModifier, UIRecord {
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

@MainActor @AnyViewBuilder
internal func unredactedModifier(_ content: StableContent, _: ModifierParams) throws -> AnyView {
  content.unredacted()
}

@MainActor @AnyViewBuilder
internal func privacySensitiveModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let sensitive: Bool = try p.value("sensitive", true)
  content.privacySensitive(sensitive)
}

@MainActor @AnyViewBuilder
internal func invalidatableContentModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let invalidatable: Bool = try p.value("invalidatable", true)
  if #available(iOS 17.0, tvOS 17.0, macOS 14.0, *) {
    content.invalidatableContent(invalidatable)
  } else {
    content
  }
}

@MainActor @AnyViewBuilder
internal func zIndexModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let index: Double = try p.value("index", 0)
  content.zIndex(index)
}

@MainActor @AnyViewBuilder
internal func blurModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let radius: CGFloat = try p.value("radius", 0)
  content.blur(radius: radius)
}

@MainActor @AnyViewBuilder
internal func brightnessModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let amount: Double = try p.value("amount", 0)
  content.brightness(amount)
}

@MainActor @AnyViewBuilder
internal func contrastModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let amount: Double = try p.value("amount", 1)
  content.contrast(amount)
}

@MainActor @AnyViewBuilder
internal func saturationModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let amount: Double = try p.value("amount", 1)
  content.saturation(amount)
}

@MainActor @AnyViewBuilder
internal func colorInvertModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let inverted: Bool = try p.value("inverted", true)
  if inverted {
    content.colorInvert()
  } else {
    content
  }
}

@MainActor @AnyViewBuilder
internal func grayscaleModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let amount: Double = try p.value("amount", 0)
  content.grayscale(amount)
}

@MainActor @AnyViewBuilder
internal func borderModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  // Declared as `shapeStyle` because `content` is taken by the parameter of `body(content:)`.
  let shapeStyle: ShapeStyleValue? = try p.value("content", nil)
  let width: CGFloat = try p.value("width", 1.0)
  if let resolvedStyle = shapeStyle?.toAnyShapeStyle() {
    content.border(resolvedStyle, width: width)
  } else {
    content
  }
}

@MainActor @AnyViewBuilder
internal func clipShapeModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let shape: ShapeType = try p.value("shape", .rectangle)
  let cornerRadius: CGFloat = try p.value("cornerRadius", 8)
  let roundedCornerStyle: RoundedCornerStyle? = try p.value("roundedCornerStyle", nil)
  let cornerSize: CornerSize? = try p.value("cornerSize", nil)
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

internal struct StrokeBorderModifier: ViewModifier, UIRecord {
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

internal struct OnTapGestureModifier: ViewModifier, UIRecord {
  var eventDispatcher: EventDispatcher?

  init() {}

  init(from params: Dict, appContext: AppContext, eventDispatcher: EventDispatcher) throws {
    try self = .init(from: params, appContext: appContext)
    self.eventDispatcher = eventDispatcher
  }

  func body(content: Content) -> some View {
    if #available(iOS 15.0, tvOS 16.0, *) {
      content.onTapGesture {
        eventDispatcher?(["onTapGesture": [:]])
      }
    }
  }
}

internal struct OnLongPressGestureModifier: ViewModifier, UIRecord {
  @Field var minimumDuration: Double = 0.5
  var eventDispatcher: EventDispatcher?

  init() {}

  init(from params: Dict, appContext: AppContext, eventDispatcher: EventDispatcher) throws {
    try self = .init(from: params, appContext: appContext)
    self.eventDispatcher = eventDispatcher
  }

  func body(content: Content) -> some View {
    content.onLongPressGesture(minimumDuration: minimumDuration) {
      eventDispatcher?(["onLongPressGesture": [:]])
    }
  }
}

internal struct OnAppearModifier: ViewModifier, UIRecord {
  var eventDispatcher: EventDispatcher?

  init() {}

  init(from params: Dict, appContext: AppContext, eventDispatcher: EventDispatcher) throws {
    try self = .init(from: params, appContext: appContext)
    self.eventDispatcher = eventDispatcher
  }

  func body(content: Content) -> some View {
    content.onAppear {
      eventDispatcher?(["onAppear": [:]])
    }
  }
}

internal struct OnDisappearModifier: ViewModifier, UIRecord {
  var eventDispatcher: EventDispatcher?

  init() {}

  init(from params: Dict, appContext: AppContext, eventDispatcher: EventDispatcher) throws {
    try self = .init(from: params, appContext: appContext)
    self.eventDispatcher = eventDispatcher
  }

  func body(content: Content) -> some View {
    content.onDisappear {
      eventDispatcher?(["onDisappear": [:]])
    }
  }
}

@MainActor @AnyViewBuilder
internal func hueRotationModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let angle: Double = try p.value("angle", 0)
  content.hueRotation(.degrees(angle))
}

internal enum ScrollDismissesKeyboardMode: String, UIEnum {
  case automatic
  case never
  case interactively
  case immediately
}

@MainActor @AnyViewBuilder
internal func scrollDismissesKeyboardModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let mode: ScrollDismissesKeyboardMode = try p.value("mode", .automatic)
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

internal enum MenuActionDismissBehaviorMode: String, UIEnum {
  case automatic
  case disabled
  case enabled
}

@MainActor @AnyViewBuilder
internal func menuActionDismissBehaviorModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let behavior: MenuActionDismissBehaviorMode = try p.value("behavior", .automatic)
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

@MainActor @AnyViewBuilder
internal func accessibilityLabelModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let label: String? = try p.value("label", nil)
  if let label = label {
    content.accessibilityLabel(label)
  } else {
    content
  }
}

@MainActor @AnyViewBuilder
internal func accessibilityHintModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let hint: String? = try p.value("hint", nil)
  if let hint = hint {
    content.accessibilityHint(hint)
  } else {
    content
  }
}

@MainActor @AnyViewBuilder
internal func accessibilityValueModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let value: String? = try p.value("value", nil)
  if let value = value {
    content.accessibilityValue(value)
  } else {
    content
  }
}

@MainActor @AnyViewBuilder
internal func accessibilityInputLabelsModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let inputLabels: [String]? = try p.value("inputLabels", nil)
  if let inputLabels = inputLabels {
    content.accessibilityInputLabels(inputLabels.map { Text($0) })
  } else {
    content
  }
}

@MainActor @AnyViewBuilder
internal func accessibilityIdentifierModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let identifier: String? = try p.value("identifier", nil)
  if let identifier = identifier {
    content.accessibilityIdentifier(identifier)
  } else {
    content
  }
}

@MainActor @AnyViewBuilder
internal func accessibilityHiddenModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let hidden: Bool = try p.value("hidden", true)
  content.accessibilityHidden(hidden)
}

internal enum AccessibilityChildBehaviorType: String, UIEnum {
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

@MainActor @AnyViewBuilder
internal func accessibilityElementModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let children: AccessibilityChildBehaviorType = try p.value("children", .ignore)
  content.accessibilityElement(children: children.toNative())
}

internal enum AccessibilityTraitType: String, UIEnum {
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

@MainActor @AnyViewBuilder
internal func accessibilityAddTraitsModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let traits: [AccessibilityTraitType] = try p.value("traits", [])
  content.accessibilityAddTraits(combineAccessibilityTraits(traits))
}

@MainActor @AnyViewBuilder
internal func accessibilityRemoveTraitsModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let traits: [AccessibilityTraitType] = try p.value("traits", [])
  content.accessibilityRemoveTraits(combineAccessibilityTraits(traits))
}

@MainActor @AnyViewBuilder
internal func layoutPriorityModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let priority: Double = try p.value("priority", 0)
  content.layoutPriority(priority)
}

@MainActor @AnyViewBuilder
internal func aspectRatioModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let ratio: Double? = try p.value("ratio", nil)
  let contentMode: String = try p.value("contentMode", "fit")
  let mode: ContentMode = contentMode == "fill" ? .fill : .fit
  if let ratio {
    content.aspectRatio(ratio, contentMode: mode)
  } else {
    content.aspectRatio(contentMode: mode)
  }
}

@MainActor @AnyViewBuilder
internal func clippedModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let clipped: Bool = try p.value("clipped", true)
  if clipped {
    content.clipped()
  } else {
    content
  }
}

@MainActor @AnyViewBuilder
internal func maskModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let shape: ShapeType = try p.value("shape", .rectangle)
  let cornerRadius: CGFloat = try p.value("cornerRadius", 8)
  let roundedCornerStyle: RoundedCornerStyle? = try p.value("roundedCornerStyle", nil)
  let cornerSize: CornerSize? = try p.value("cornerSize", nil)
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

@MainActor @AnyViewBuilder
internal func overlayModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let color: Color? = try p.value("color", nil)
  let alignment: AlignmentOptions = try p.value("alignment", .center)
  if let color = color {
    content.overlay(color, alignment: alignment.toAlignment())
  } else {
    content
  }
}

@MainActor @AnyViewBuilder
internal func backgroundOverlayModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let color: Color? = try p.value("color", nil)
  let alignment: AlignmentOptions = try p.value("alignment", .center)
  if let color = color {
    content.background(color, alignment: alignment.toAlignment())
  } else {
    content
  }
}

@MainActor @AnyViewBuilder
internal func fixedSizeModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let horizontal: Bool? = try p.value("horizontal", nil)
  let vertical: Bool? = try p.value("vertical", nil)
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

@MainActor @AnyViewBuilder
internal func ignoreSafeAreaModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let regions: SafeAreaRegionOptions? = try p.value("regions", nil)
  let edges: EdgeOptions? = try p.value("edges", nil)
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
    // A registered factory owns this name.
    // If it throws, leave the view unchanged instead of applying the inline built-in.
    if let type = params["$type"] as? String,
      let appContext,
      let factory = ViewModifierRegistry.shared.modifierFactories[type] {
      if let modifier = try? factory(params, appContext, dispatcher) {
        content.modifier(AnyViewModifier(modifier))
      } else {
        content
      }
    } else if let type = params["$type"] as? String,
      let appContext,
      let body = ViewModifierRegistry.shared.inlineModifiers[type],
      let view = try? body(content, ModifierParams(raw: params, appContext: appContext)) {
      view
    } else {
      content
    }
  }
}

internal struct AnimationModifier: ViewModifier, UIRecord {
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

internal struct ScrollContentBackground: ViewModifier, UIRecord {
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

internal struct ListRowBackground: ViewModifier, UIRecord {
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

internal struct ListRowSeparator: ViewModifier, UIRecord {
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

internal struct ListRowSeparatorTint: ViewModifier, UIRecord {
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

internal struct ListRowSpacing: ViewModifier, UIRecord {
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

internal enum AlignmentGuideOptions: String, UIEnum {
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

@MainActor @AnyViewBuilder
internal func alignmentGuideModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let guide: AlignmentGuideOptions = try p.value("guide", .leading)
  let value: Double = try p.value("value", 0)
  if let alignment = guide.horizontalAlignment {
    content.alignmentGuide(alignment) { _ in CGFloat(value) }
  } else {
    content
  }
}

internal enum TextTruncationModeTypes: String, UIEnum {
  case head
  case middle
  case tail
}

@MainActor @AnyViewBuilder
internal func textTruncationMode(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let mode: TextTruncationModeTypes = try p.value("mode", .tail)
  switch mode {
  case .head:
    content.truncationMode(.head)
  case .middle:
    content.truncationMode(.middle)
  case .tail:
    content.truncationMode(.tail)
  }
}

@MainActor @AnyViewBuilder
internal func textKerning(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let value: CGFloat = try p.value("value", 0)
  if #available(iOS 16.0, macOS 13.0, tvOS 16.0, *) {
    content.kerning(value)
  } else {
    content
  }
}

@MainActor @AnyViewBuilder
internal func textAllowsTightening(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let value: Bool = try p.value("value", true)
  if #available(iOS 13.0, macOS 10.15, tvOS 16.0, *) {
    content.allowsTightening(value)
  } else {
    content
  }
}

@MainActor @AnyViewBuilder
internal func minimumScaleFactorModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let factor: CGFloat = try p.value("factor", 1.0)
  content.minimumScaleFactor(factor)
}

internal enum TextCaseTypes: String, Enumerable {
  case lowercase
  case uppercase
}

internal struct TextCase: ViewModifier, UIRecord {
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

internal struct TextUnderLine: ViewModifier, UIRecord {
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

internal struct TextStrikeThrough: ViewModifier, UIRecord {
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

internal struct MultilineTextAlignment: ViewModifier, UIRecord {
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

internal struct TextSelection: ViewModifier, UIRecord {
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

internal struct LineSpacing: ViewModifier, UIRecord {
  @Field var value: CGFloat?

  func body(content: Content) -> some View {
    if let value {
      content.lineSpacing(value)
    } else {
      content
    }
  }
}

internal struct LineHeight: ViewModifier, UIRecord {
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

internal struct HeaderProminence: ViewModifier, UIRecord {
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

internal struct ListRowInsets: ViewModifier, UIRecord {
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

internal struct BadgeProminence: ViewModifier, UIRecord {
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

internal struct Badge: ViewModifier, UIRecord {
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

internal struct ListSectionMargins: ViewModifier, UIRecord {
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

internal struct GridCellUnsizedAxes: ViewModifier, UIRecord {
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

internal struct GridCellColumns: ViewModifier, UIRecord {
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

internal struct GridColumnAlignment: ViewModifier, UIRecord {
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

internal struct GridCellAnchor: ViewModifier, UIRecord {
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
 * Registry for SwiftUI view modifiers that can be applied from React Native.
 * This system uses ViewModifier structs for better performance than AnyView wrapping.
 */
public class ViewModifierRegistry {
  static let shared = ViewModifierRegistry()

  public typealias ModifierFactory = ([String: Any], AppContext, EventDispatcher) throws -> any ViewModifier
  private(set) internal var modifierFactories: [String: ModifierFactory] = [:]
  private(set) internal var inlineModifiers: [String: InlineModifier] = [:]

  public static var widgetKit: WidgetKitModifiers?

  private init() {
    registerBuiltInModifiers()
  }

  /**
   * Public API to register a custom modifier with the given type name.
   *
   * - Important: Call this in `OnCreate` of your module definition to ensure modifiers
   *   are registered before any views are rendered.
   */
  public static func register(
    _ type: String,
    factory: @escaping ModifierFactory
  ) {
    shared.register(type, factory: factory)
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
   * Registers a new modifier with the given type name.
   * The modifier factory creates a ViewModifier from parameters.
   */
  internal func register(
    _ type: String,
    factory: @escaping ModifierFactory
  ) {
    if modifierFactories[type] != nil || inlineModifiers[type] != nil {
      log.warn("ViewModifierRegistry: Overwriting existing modifier '\(type)'. This may cause unexpected behavior.")
    }
    modifierFactories[type] = factory
  }

  /**
   * Registers a built-in modifier written as an `@AnyViewBuilder` function. The function reads its
   * fields from `ModifierParams` and returns the modified content.
   */
  internal func registerModifierInline(_ type: String, _ body: @escaping InlineModifier) {
    inlineModifiers[type] = body
  }

  /**
   * Unregisters a modifier by type name.
   */
  internal func unregister(_ type: String) {
    modifierFactories.removeValue(forKey: type)
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
    guard modifierFactories[type] != nil || inlineModifiers[type] != nil else {
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
    return modifierFactories[type] != nil || inlineModifiers[type] != nil
  }

  /**
   * Returns all registered modifier types.
   */
  func registeredTypes() -> [String] {
    return Array(Set(modifierFactories.keys).union(inlineModifiers.keys))
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

internal struct MatchedGeometryEffectModifier: ViewModifier, UIRecord {
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

@MainActor @AnyViewBuilder
internal func geometryGroupModifier(_ content: StableContent, _: ModifierParams) throws -> AnyView {
  if #available(iOS 17.0, tvOS 17.0, macOS 14.0, *) {
    content.geometryGroup()
  } else {
    content
  }
}

internal enum ButtonStyle: String, UIEnum {
  case automatic
  case bordered
  case borderedProminent
  case borderless
  case glass
  case glassProminent
  case plain
}

@MainActor @AnyViewBuilder
internal func buttonStyleModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let style: ButtonStyle = try p.value("style", .automatic)
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

internal enum TextFieldStyle: String, UIEnum {
  case automatic
  case plain
  case roundedBorder
}

@MainActor @AnyViewBuilder
internal func textFieldStyleModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let style: TextFieldStyle = try p.value("style", .automatic)
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

@MainActor @AnyViewBuilder
internal func navigationTitleModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let title: String? = try p.value("title", nil)
  if let title {
    content.navigationTitle(title)
  } else {
    content
  }
}

internal enum NavigationBarTitleDisplayMode: String, UIEnum {
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

@MainActor @AnyViewBuilder
internal func navigationBarTitleDisplayModeModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let displayMode: NavigationBarTitleDisplayMode = try p.value("displayMode", .automatic)
#if os(iOS)
  content.navigationBarTitleDisplayMode(displayMode.value)
#else
  content
#endif
}

internal enum ToolbarTitleDisplayModeType: String, UIEnum {
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

@MainActor @AnyViewBuilder
internal func toolbarTitleDisplayModeModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let mode: ToolbarTitleDisplayModeType = try p.value("mode", .automatic)
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

// MARK: - Built-in Modifier Registration

// swiftlint:disable:next no_grouping_extension
extension ViewModifierRegistry {
  private func registerBuiltInModifiers() {
    registerModifierInline("listSectionSpacing", listSectionSpacingModifier)

    registerModifierInline("background", backgroundModifier)

    registerModifierInline("cornerRadius", cornerRadiusModifier)

    registerModifierInline("shadow", shadowModifier)

    registerModifierInline("frame", frameModifier)

    registerModifierInline("universalLayout", universalLayoutModifier)

    register("padding") { params, appContext, _ in
      return try PaddingModifier(from: params, appContext: appContext)
    }

    registerModifierInline("opacity", opacityModifier)

    registerModifierInline("scaleEffect", scaleEffectModifier)

    registerModifierInline("rotationEffect", rotationEffectModifier)

    registerModifierInline("rotation3DEffect", rotation3DEffectModifier)

    registerModifierInline("offset", offsetModifier)

    register("foregroundColor") { params, appContext, _ in
      return try ForegroundColorModifier(from: params, appContext: appContext)
    }

    register("foregroundStyle") { params, appContext, _ in
      return try ForegroundStyleModifier(from: params, appContext: appContext)
    }

    registerModifierInline("luminanceToAlpha", luminanceToAlphaModifier)

    registerModifierInline("bold", boldModifier)

    registerModifierInline("italic", italicModifier)

    registerModifierInline("monospacedDigit", monospacedDigitModifier)

    registerModifierInline("tint", tintModifier)

    registerModifierInline("selectedSegmentTintColor", selectedSegmentTintColorModifier)

    registerModifierInline("hidden", hiddenModifier)

    registerModifierInline("labelsHidden", labelsHiddenModifier)

    registerModifierInline("disabled", disabledModifier)

    register("redacted") { params, appContext, _ in
      return try RedactedModifier(from: params, appContext: appContext)
    }

    registerModifierInline("unredacted", unredactedModifier)

    registerModifierInline("privacySensitive", privacySensitiveModifier)

    registerModifierInline("invalidatableContent", invalidatableContentModifier)

    registerModifierInline("zIndex", zIndexModifier)

    registerModifierInline("blur", blurModifier)

    registerModifierInline("brightness", brightnessModifier)

    registerModifierInline("contrast", contrastModifier)

    registerModifierInline("saturation", saturationModifier)

    registerModifierInline("colorInvert", colorInvertModifier)

    registerModifierInline("grayscale", grayscaleModifier)

    registerModifierInline("border", borderModifier)
    register("strokeBorder") { params, appContext, _ in
      return try StrokeBorderModifier(from: params, appContext: appContext)
    }

    registerModifierInline("clipShape", clipShapeModifier)

    register("onTapGesture") { params, appContext, eventDispatcher in
      return try OnTapGestureModifier(from: params, appContext: appContext, eventDispatcher: eventDispatcher)
    }

    register("onLongPressGesture") { params, appContext, eventDispatcher in
      return try OnLongPressGestureModifier(from: params, appContext: appContext, eventDispatcher: eventDispatcher)
    }

    register("onAppear") { params, appContext, eventDispatcher in
      return try OnAppearModifier(from: params, appContext: appContext, eventDispatcher: eventDispatcher)
    }

    register("onDisappear") { params, appContext, eventDispatcher in
      return try OnDisappearModifier(from: params, appContext: appContext, eventDispatcher: eventDispatcher)
    }

    register("onGeometryChange") { params, appContext, eventDispatcher in
      return try OnGeometryChangeModifier(from: params, appContext: appContext, eventDispatcher: eventDispatcher)
    }

    register("refreshable") { params, appContext, eventDispatcher in
      return try RefreshableModifier(from: params, appContext: appContext, eventDispatcher: eventDispatcher)
    }

    registerModifierInline("hueRotation", hueRotationModifier)

    registerModifierInline("navigationTitle", navigationTitleModifier)

    registerModifierInline("navigationBarTitleDisplayMode", navigationBarTitleDisplayModeModifier)

    registerModifierInline("toolbarTitleDisplayMode", toolbarTitleDisplayModeModifier)

    registerModifierInline("navigationSplitViewStyle", navigationSplitViewStyleModifier)

    registerModifierInline("navigationSplitViewColumnWidth", navigationSplitViewColumnWidthModifier)

    registerModifierInline("arrangementViewStyle", arrangementViewStyleModifier)

    registerModifierInline("splitArrangementLayoutRatio", splitArrangementLayoutRatioModifier)

    registerModifierInline("splitArrangementLayoutSize", splitArrangementLayoutSizeModifier)

    registerModifierInline("splitArrangementFixedLayoutSize", splitArrangementFixedLayoutSizeModifier)

    registerModifierInline("overlayArrangementEdge", overlayArrangementEdgeModifier)

    registerModifierInline("accessibilityLabel", accessibilityLabelModifier)

    registerModifierInline("accessibilityHint", accessibilityHintModifier)

    registerModifierInline("accessibilityValue", accessibilityValueModifier)

    registerModifierInline("accessibilityInputLabels", accessibilityInputLabelsModifier)

    registerModifierInline("accessibilityIdentifier", accessibilityIdentifierModifier)

    registerModifierInline("accessibilityHidden", accessibilityHiddenModifier)

    registerModifierInline("accessibilityElement", accessibilityElementModifier)

    registerModifierInline("accessibilityAddTraits", accessibilityAddTraitsModifier)

    registerModifierInline("accessibilityRemoveTraits", accessibilityRemoveTraitsModifier)

    registerModifierInline("layoutPriority", layoutPriorityModifier)

    registerModifierInline("aspectRatio", aspectRatioModifier)

    registerModifierInline("clipped", clippedModifier)

    registerModifierInline("mask", maskModifier)

    registerModifierInline("overlay", overlayModifier)

    registerModifierInline("backgroundOverlay", backgroundOverlayModifier)

    register("glassEffect") { params, appContext, _ in
      return try GlassEffectModifier(from: params, appContext: appContext)
    }

    register("animation") { params, appContext, _ in
      return try AnimationModifier.init(from: params, appContext: appContext)
    }

    register("glassEffectId") { params, appContext, _ in
      return try GlassEffectIdModifier.init(from: params, appContext: appContext)
    }

    register("matchedGeometryEffect") { params, appContext, _ in
      return try MatchedGeometryEffectModifier.init(from: params, appContext: appContext)
    }

    registerModifierInline("geometryGroup", geometryGroupModifier)

    registerModifierInline("fixedSize", fixedSizeModifier)

    registerModifierInline("ignoreSafeArea", ignoreSafeAreaModifier)

    registerModifierInline("containerShape", containerShapeModifier)

    register("contentShape") { params, appContext, _ in
      return try ContentShapeModifier(from: params, appContext: appContext)
    }

    registerModifierInline("containerRelativeFrame", containerRelativeFrameModifier)

    registerModifierInline("buttonStyle", buttonStyleModifier)

    registerModifierInline("buttonBorderShape", buttonBorderShapeModifier)

    registerModifierInline("toggleStyle", toggleStyleModifier)

    registerModifierInline("controlSize", controlSizeModifier)

    registerModifierInline("labelStyle", labelStyleModifier)

    registerModifierInline("textFieldStyle", textFieldStyleModifier)

    register("scrollContentBackground") { params, appContext, _ in
      return try ScrollContentBackground(from: params, appContext: appContext)
    }

    register("listRowBackground") { params, appContext, _ in
      return try ListRowBackground(from: params, appContext: appContext)
    }

    register("listRowSeparator") { params, appContext, _ in
      return try ListRowSeparator(from: params, appContext: appContext)
    }

    register("listRowSeparatorTint") { params, appContext, _ in
      return try ListRowSeparatorTint(from: params, appContext: appContext)
    }

    register("listRowSpacing") { params, appContext, _ in
      return try ListRowSpacing(from: params, appContext: appContext)
    }

    registerModifierInline("alignmentGuide", alignmentGuideModifier)

    registerModifierInline("truncationMode", textTruncationMode)

    registerModifierInline("kerning", textKerning)

    registerModifierInline("allowsTightening", textAllowsTightening)

    registerModifierInline("minimumScaleFactor", minimumScaleFactorModifier)

    register("textCase") { params, appContext, _ in
      return try TextCase(from: params, appContext: appContext)
    }

    register("underline") { params, appContext, _ in
      return try TextUnderLine(from: params, appContext: appContext)
    }

    register("strikethrough") { params, appContext, _ in
      return try TextStrikeThrough(from: params, appContext: appContext)
    }

    register("multilineTextAlignment") { params, appContext, _ in
      return try MultilineTextAlignment(from: params, appContext: appContext)
    }

    register("textSelection") { params, appContext, _ in
      return try TextSelection(from: params, appContext: appContext)
    }

    register("lineSpacing") { params, appContext, _ in
      return try LineSpacing(from: params, appContext: appContext)
    }

    register("lineHeight") { params, appContext, _ in
      return try LineHeight(from: params, appContext: appContext)
    }

    registerModifierInline("lineLimit", lineLimitModifier)

    register("listRowInsets") { params, appContext, _ in
      return try ListRowInsets(from: params, appContext: appContext)
    }

    register("badgeProminence") { params, appContext, _ in
      return try BadgeProminence(from: params, appContext: appContext)
    }

    register("badge") { params, appContext, _ in
      return try Badge(from: params, appContext: appContext)
    }

    register("listSectionMargins") { params, appContext, _ in
      return try ListSectionMargins(from: params, appContext: appContext)
    }

    registerModifierInline("scrollDismissesKeyboard", scrollDismissesKeyboardModifier)

    registerModifierInline("menuActionDismissBehavior", menuActionDismissBehaviorModifier)

    register("headerProminence") { params, appContext, _ in
      return try HeaderProminence(from: params, appContext: appContext)
    }

    register("font") { params, appContext, _ in
      return try FontModifier(from: params, appContext: appContext)
    }

    registerModifierInline("dynamicTypeSize", dynamicTypeSizeModifier)

    registerModifierInline("imageScale", imageScaleModifier)

    register("gridCellUnsizedAxes") { params, appContext, _ in
      return try GridCellUnsizedAxes(from: params, appContext: appContext)
    }

    register("gridCellColumns") { params, appContext, _ in
      return try GridCellColumns(from: params, appContext: appContext)
    }

    register("gridColumnAlignment") { params, appContext, _ in
      return try GridColumnAlignment(from: params, appContext: appContext)
    }

    register("gridCellAnchor") { params, appContext, _ in
      return try GridCellAnchor(from: params, appContext: appContext)
    }

    registerModifierInline("tag", tagModifier)

    registerModifierInline("scrollTargetBehavior", scrollTargetBehaviorModifier)

    registerModifierInline("scrollTargetLayout", scrollTargetLayoutModifier)

    registerModifierInline("id", iDModifier)

    register("scrollPosition") { params, appContext, eventDispatcher in
      return try ScrollPositionModifier(from: params, appContext: appContext, eventDispatcher: eventDispatcher)
    }

    register("searchable") { params, appContext, eventDispatcher in
      return try SearchableModifier(from: params, appContext: appContext, eventDispatcher: eventDispatcher)
    }

    registerModifierInline("searchToolbarBehavior", searchToolbarBehaviorModifier)

    registerModifierInline("pickerStyle", pickerStyleModifier)

    registerModifierInline("menuOrder", menuOrderModifier)

    registerModifierInline("menuStyle", menuStyleModifier)

    registerModifierInline("menuIndicator", menuIndicatorModifier)

    registerModifierInline("submitLabel", submitLabelModifier)

    registerModifierInline("textInputAutocapitalization", textInputAutocapitalizationModifier)

    registerModifierInline("textContentType", textContentTypeModifier)

    registerModifierInline("datePickerStyle", datePickerStyleModifier)

    registerModifierInline("scrollDisabled", scrollDisabledModifier)

    registerModifierInline("preferredColorScheme", preferredColorSchemeModifier)

    registerModifierInline("scrollClipDisabled", scrollClipDisabledModifier)

    registerModifierInline("scrollIndicators", scrollIndicatorsModifier)

    registerModifierInline("scrollEdgeEffectStyle", scrollEdgeEffectStyleModifier)

    registerModifierInline("tabViewStyle", tabViewStyleModifier)

    registerModifierInline("indexViewStyle", indexViewStyleModifier)

    registerModifierInline("defaultScrollAnchor", defaultScrollAnchorModifier)

    registerModifierInline("defaultScrollAnchorForRole", defaultScrollAnchorForRoleModifier)

    registerModifierInline("progressViewStyle", progressViewStyleModifier)

    registerModifierInline("gaugeStyle", gaugeStyleModifier)

    register("presentationDetents") { params, appContext, eventDispatcher in
      return try PresentationDetentsModifier(from: params, appContext: appContext, eventDispatcher: eventDispatcher)
    }

    registerModifierInline("presentationDragIndicator", presentationDragIndicatorModifier)

    registerModifierInline("presentationCornerRadius", presentationCornerRadiusModifier)

    registerModifierInline("presentationBackgroundInteraction", presentationBackgroundInteractionModifier)

    registerModifierInline("interactiveDismissDisabled", interactiveDismissDisabledModifier)

    registerModifierInline("presentationBackground", presentationBackgroundModifier)

    register("presentationSizing") { params, appContext, _ in
      return try PresentationSizingModifier(from: params, appContext: appContext)
    }

    registerModifierInline("listStyle", listStyleModifier)

    registerModifierInline("sectionIndexLabel", sectionIndexLabelModifier)

    registerModifierInline("moveDisabled", moveDisabledModifier)

    registerModifierInline("deleteDisabled", deleteDisabledModifier)

    registerModifierInline("environment", environmentModifier)

    registerModifierInline("contentTransition", contentTransitionModifier)

    registerModifierInline("keyboardType", keyboardTypeModifier)

    registerModifierInline("autocorrectionDisabled", autocorrectionDisabledModifier)

    register("onSubmit") { params, appContext, eventDispatcher in
      return try OnSubmitModifier(from: params, appContext: appContext, eventDispatcher: eventDispatcher)
    }

    register("containerBackground") { params, appContext, _ in
      let modifier = try ContainerBackgroundModifier(from: params, appContext: appContext)
      #if DEBUG
      modifier.warnIfWidgetPlacementIsUnavailable()
      #endif
      return modifier
    }

    register("symbolEffect") { params, appContext, _ in
      return try SymbolEffectModifier(from: params, appContext: appContext)
    }

    register("onScrollPhaseChange") { params, appContext, eventDispatcher in
      return try OnScrollPhaseChangeModifier(from: params, appContext: appContext, eventDispatcher: eventDispatcher)
    }

    register("onScrollGeometryChange") { params, appContext, eventDispatcher in
      return try OnScrollGeometryChangeModifier(from: params, appContext: appContext, eventDispatcher: eventDispatcher)
    }

    register("onHingeChange") { params, appContext, eventDispatcher in
      return try OnHingeChangeModifier(from: params, appContext: appContext, eventDispatcher: eventDispatcher)
    }
  }
}
