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
#if os(tvOS)
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
  @Field var all: CGFloat?
  @Field var horizontal: CGFloat?
  @Field var vertical: CGFloat?

  @Field var top: CGFloat?
  @Field var leading: CGFloat?
  @Field var bottom: CGFloat?
  @Field var trailing: CGFloat?

  func body(content: Content) -> some View {
    let hasCustomPadding = [
      all, horizontal, vertical, top, leading, bottom, trailing
    ].contains { $0 != nil }

    if !hasCustomPadding {
      // Default SwiftUI padding (system spacing)
      content.padding()
    } else {
      let insets = EdgeInsets(
        top: top ?? vertical ?? all ?? 0,
        leading: leading ?? horizontal ?? all ?? 0,
        bottom: bottom ?? vertical ?? all ?? 0,
        trailing: trailing ?? horizontal ?? all ?? 0
      )
      content.padding(insets)
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

internal struct TintModifier: ViewModifier, Record {
  @Field var color: Color?

  func body(content: Content) -> some View {
    if let color = color {
      content.tint(color)
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
  @Field var color: Color = .white
  @Field var width: CGFloat = 1.0

  func body(content: Content) -> some View {
    content.border(color, width: width)
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
    case .ellipse:
      content.clipShape(Ellipse())
    case .rectangle:
      content.clipShape(Rectangle())
    case .roundedRectangle:
      content.clipShape(makeRoundedRectangle(cornerRadius: cornerRadius, cornerSize: cornerSize, style: roundedCornerStyle))
    }
  }
}

internal struct OnTapGestureModifier: ViewModifier, Record {
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

internal struct OnLongPressGestureModifier: ViewModifier, Record {
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

internal struct OnAppearModifier: ViewModifier, Record {
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

internal struct OnDisappearModifier: ViewModifier, Record {
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
        content.menuActionDismissBehavior(.disabled)
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

internal struct LayoutPriorityModifier: ViewModifier, Record {
  @Field var priority: Double = 0

  func body(content: Content) -> some View {
    content.layoutPriority(priority)
  }
}

internal struct AspectRatioModifier: ViewModifier, Record {
  @Field var ratio: Double = 1.0
  @Field var contentMode: String = "fit"

  func body(content: Content) -> some View {
    content.aspectRatio(ratio, contentMode: contentMode == "fill" ? .fill : .fit)
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

internal enum AnimationType: String, Enumerable {
  case easeInOut
  case easeIn
  case easeOut
  case linear
  case spring
  case interpolatingSpring
  case `default`
}

internal struct AnimationConfig: Record {
  @Field var type: AnimationType = .default
  @Field var duration: Double?
  @Field var response: Double?
  @Field var dampingFraction: Double?
  @Field var blendDuration: Double?
  @Field var bounce: Double?
  @Field var mass: Double?
  @Field var stiffness: Double?
  @Field var damping: Double?
  @Field var initialVelocity: Double?
  @Field var delay: Double?
  @Field var repeatCount: Int?
  @Field var autoreverses: Bool?
}

internal struct AnimationModifier: ViewModifier, Record {
  @Field var animation: AnimationConfig
  @Field var animatedValue: Either<Double, Bool>?

  func body(content: Content) -> some View {
    let animationValue = parseAnimation(animation)
    if let value: Bool = animatedValue?.get() {
      content.animation(animationValue, value: value)
    } else if let value: Double = animatedValue?.get() {
      content.animation(animationValue, value: value)
    } else {
      content
    }
  }

  private func parseAnimation(_ config: AnimationConfig) -> Animation {
    let type = config.type

    var animation: Animation

    switch type {
    case .easeIn:
      if let duration = config.duration {
        animation = .easeIn(duration: duration)
      } else {
        animation = .easeIn
      }

    case .easeOut:
      if let duration = config.duration {
        animation = .easeOut(duration: duration)
      } else {
        animation = .easeOut
      }

    case .linear:
      if let duration = config.duration {
        animation = .linear(duration: duration)
      } else {
        animation = .linear
      }

    case .easeInOut:
      if let duration = config.duration {
        animation = .easeInOut(duration: duration)
      } else {
        animation = .easeInOut
      }

    case .spring:
      let duration = config.duration
      let bounce = config.bounce
      let response = config.response
      let dampingFraction = config.dampingFraction
      let blendDuration = config.blendDuration

      if response != nil || dampingFraction != nil {
        // default values are 0.5, 0.825, 0.0
        animation = .spring(response: response ?? 0.5, dampingFraction: dampingFraction ?? 0.825, blendDuration: blendDuration ?? 0.0)
      } else if duration != nil || bounce != nil {
        // default values are 0.5, 0.0, 0.0
        animation = .spring(duration: duration ?? 0.5, bounce: bounce ?? 0.0, blendDuration: blendDuration ?? 0.0)
      } else if let blendDuration = blendDuration {
        animation = .spring(blendDuration: blendDuration)
      } else {
        animation = .spring
      }

    case .interpolatingSpring:
      let duration = config.duration
      let bounce = config.bounce
      let mass = config.mass
      let stiffness = config.stiffness
      let damping = config.stiffness
      let initialVelocity = config.initialVelocity

      if duration != nil || bounce != nil {
        animation = .interpolatingSpring(duration: duration ?? 0.5, bounce: bounce ?? 0.0, initialVelocity: initialVelocity ?? 0.0)
      } else if let stiffness = stiffness, let damping = damping {
        animation = .interpolatingSpring(mass: mass ?? 1.0, stiffness: stiffness, damping: damping, initialVelocity: initialVelocity ?? 0.0)
      } else {
        animation = .interpolatingSpring
      }

    default:
      animation = .default
    }

    if let delay = config.delay {
      animation = animation.delay(delay)
    }

    if let repeatCount = config.repeatCount {
      let autoreverses = config.autoreverses ?? false
      animation = animation.repeatCount(repeatCount, autoreverses: autoreverses)
    }

    return animation
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

internal enum ListRowSeparatorVisibility: String, Enumerable {
  case automatic
  case visible
  case hidden

  func toVisibility() -> Visibility {
    switch self {
    case .visible:
      return .visible
    case .hidden:
      return .hidden
    default:
      return .automatic
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
  @Field var visibility: ListRowSeparatorVisibility = .automatic
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

internal struct LineLimitModifier: ViewModifier, Record {
  @Field var limit: Int?

  func body(content: Content) -> some View {
    content.lineLimit(limit)
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
  @Field var top: CGFloat = 0
  @Field var leading: CGFloat = 0
  @Field var bottom: CGFloat = 0
  @Field var trailing: CGFloat = 0

  func body(content: Content) -> some View {
    if top != 0 || leading != 0 || bottom != 0 || trailing != 0 {
      content.listRowInsets(.init(
        top: top,
        leading: leading,
        bottom: bottom,
        trailing: trailing
      ))
    } else {
      content
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
#if compiler(>=6.2) && !os(tvOS) // Xcode 26
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

internal enum AxisOptions: String, Enumerable {
  case horizontal
  case vertical
  case both
  
  func toAxis() -> Axis.Set {
    switch self {
    case .vertical:
      return .vertical
    case .horizontal:
      return .horizontal
    case .both:
      return [.vertical, .horizontal]
    }
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
 * Registry for SwiftUI view modifiers that can be applied from React Native.
 * This system uses ViewModifier structs for better performance than AnyView wrapping.
 */
public class ViewModifierRegistry {
  static let shared = ViewModifierRegistry()

  public typealias ModifierFactory = ([String: Any], AppContext, EventDispatcher) throws -> any ViewModifier
  private(set) internal var modifierFactories: [String: ModifierFactory] = [:]

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
    if modifierFactories[type] != nil {
      log.warn("ViewModifierRegistry: Overwriting existing modifier '\(type)'. This may cause unexpected behavior.")
    }
    modifierFactories[type] = factory
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
    guard let viewModifier = try? modifierFactories[type]?(params, appContext, globalEventDispatcher) else {
      return view
    }
    return AnyView(view.modifier(AnyViewModifier(viewModifier)))
  }

  /**
    * Applies `Text returning modifiers. Useful for Text concatenation in TextView.
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
    case "font":
      guard let modifier = try? FontModifier(from: params, appContext: appContext) else { return text }
      if let family = modifier.family {
        return text.font(Font.custom(family, size: modifier.size ?? 17))
      }
      return text.font(.system(
        size: modifier.size ?? 17,
        weight: modifier.weight?.toSwiftUI() ?? .regular,
        design: modifier.design?.toSwiftUI() ?? .default
      ))
    case "foregroundColor":
      guard let modifier = try? ForegroundColorModifier(from: params, appContext: appContext),
            let color = modifier.color else { return text }
      return text.foregroundColor(color)
    case "foregroundStyle":
      guard let modifier = try? ForegroundStyleModifier(from: params, appContext: appContext) else { return text }
      if #available(iOS 17.0, tvOS 17.0, *) {
        return applyForegroundStyle(modifier, to: text)
      } else if modifier.styleType == .color, let color = modifier.color {
          return text.foregroundColor(color)
      } 
      return text
    default:
      #if DEBUG
      return Text(" ['\(type)' not supported for nested Text]").foregroundColor(.red)
      #else
      return text
      #endif
    }
  }

  /**
   * Checks if a modifier type is registered.
   */
  func hasModifier(_ type: String) -> Bool {
    return modifierFactories[type] != nil
  }

  /**
   * Returns all registered modifier types.
   */
  func registeredTypes() -> [String] {
    return Array(modifierFactories.keys)
  }
}

internal struct MatchedGeometryEffectModifier: ViewModifier, Record {
  @Field var id: String?
  @Field var namespaceId: String?

  func body(content: Content) -> some View {
    if let namespaceId, let namespace = NamespaceRegistry.shared.namespace(forKey: namespaceId) {
      content.matchedGeometryEffect(id: id, in: namespace)
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

// MARK: - Built-in Modifier Registration

// swiftlint:disable:next no_grouping_extension
extension ViewModifierRegistry {
  private func registerBuiltInModifiers() {
    register("listSectionSpacing") { params, appContext, _ in
      return try ListSectionSpacingModifier(from: params, appContext: appContext)
    }

    register("background") { params, appContext, _ in
      return try BackgroundModifier(from: params, appContext: appContext)
    }

    register("cornerRadius") { params, appContext, _ in
      return try CornerRadiusModifier(from: params, appContext: appContext)
    }

    register("shadow") { params, appContext, _ in
      return try ShadowModifier(from: params, appContext: appContext)
    }

    register("frame") { params, appContext, _ in
      return try FrameModifier(from: params, appContext: appContext)
    }

    register("padding") { params, appContext, _ in
      return try PaddingModifier(from: params, appContext: appContext)
    }

    register("opacity") { params, appContext, _ in
      return try OpacityModifier(from: params, appContext: appContext)
    }

    register("scaleEffect") { params, appContext, _ in
      return try ScaleEffectModifier(from: params, appContext: appContext)
    }

    register("rotationEffect") { params, appContext, _ in
      return try RotationEffectModifier(from: params, appContext: appContext)
    }

    register("offset") { params, appContext, _ in
      return try OffsetModifier(from: params, appContext: appContext)
    }

    register("foregroundColor") { params, appContext, _ in
      return try ForegroundColorModifier(from: params, appContext: appContext)
    }

    register("foregroundStyle") { params, appContext, _ in
      return try ForegroundStyleModifier(from: params, appContext: appContext)
    }

    register("bold") { params, appContext, _ in
      return try BoldModifier(from: params, appContext: appContext)
    }

    register("italic") { params, appContext, _ in
      return try ItalicModifier(from: params, appContext: appContext)
    }

    register("tint") { params, appContext, _ in
      return try TintModifier(from: params, appContext: appContext)
    }

    register("hidden") { params, appContext, _ in
      return try HiddenModifier(from: params, appContext: appContext)
    }

    register("labelsHidden") { params, appContext, _ in
      return try LabelsHiddenModifier(from: params, appContext: appContext)
    }

    register("disabled") { params, appContext, _ in
      return try DisabledModifier(from: params, appContext: appContext)
    }

    register("zIndex") { params, appContext, _ in
      return try ZIndexModifier(from: params, appContext: appContext)
    }

    register("blur") { params, appContext, _ in
      return try BlurModifier(from: params, appContext: appContext)
    }

    register("brightness") { params, appContext, _ in
      return try BrightnessModifier(from: params, appContext: appContext)
    }

    register("contrast") { params, appContext, _ in
      return try ContrastModifier(from: params, appContext: appContext)
    }

    register("saturation") { params, appContext, _ in
      return try SaturationModifier(from: params, appContext: appContext)
    }

    register("colorInvert") { params, appContext, _ in
      return try ColorInvertModifier(from: params, appContext: appContext)
    }

    register("grayscale") { params, appContext, _ in
      return try GrayscaleModifier(from: params, appContext: appContext)
    }

    register("border") { params, appContext, _ in
      return try BorderModifier(from: params, appContext: appContext)
    }

    register("clipShape") { params, appContext, _ in
      return try ClipShapeModifier(from: params, appContext: appContext)
    }

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

    register("refreshable") { params, appContext, eventDispatcher in
      return try RefreshableModifier(from: params, appContext: appContext, eventDispatcher: eventDispatcher)
    }

    register("hueRotation") { params, appContext, _ in
      return try HueRotationModifier(from: params, appContext: appContext)
    }

    register("accessibilityLabel") { params, appContext, _ in
      return try AccessibilityLabelModifier(from: params, appContext: appContext)
    }

    register("accessibilityHint") { params, appContext, _ in
      return try AccessibilityHintModifier(from: params, appContext: appContext)
    }

    register("accessibilityValue") { params, appContext, _ in
      return try AccessibilityValueModifier(from: params, appContext: appContext)
    }

    register("layoutPriority") { params, appContext, _ in
      return try LayoutPriorityModifier(from: params, appContext: appContext)
    }

    register("aspectRatio") { params, appContext, _ in
      return try AspectRatioModifier(from: params, appContext: appContext)
    }

    register("clipped") { params, appContext, _ in
      return try ClippedModifier(from: params, appContext: appContext)
    }

    register("mask") { params, appContext, _ in
      return try MaskModifier(from: params, appContext: appContext)
    }

    register("overlay") { params, appContext, _ in
      return try OverlayModifier(from: params, appContext: appContext)
    }

    register("backgroundOverlay") { params, appContext, _ in
      return try BackgroundOverlayModifier(from: params, appContext: appContext)
    }

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

    register("fixedSize") { params, appContext, _ in
      return try FixedSizeModifier(from: params, appContext: appContext)
    }

    register("ignoreSafeArea") { params, appContext, _ in
      return try IgnoreSafeAreaModifier(from: params, appContext: appContext)
    }

    register("containerShape") { params, appContext, _ in
      return try ContainerShapeModifier(from: params, appContext: appContext)
    }

    register("contentShape") { params, appContext, _ in
      return try ContentShapeModifier(from: params, appContext: appContext)
    }

    register("containerRelativeFrame") { params, appContext, _ in
      return try ContainerRelativeFrameModifier(from: params, appContext: appContext)
    }

    register("buttonStyle") { params, appContext, _ in
      return try ButtonStyleModifier(from: params, appContext: appContext)
    }

    register("toggleStyle") { params, appContext, _ in
      return try ToggleStyleModifier(from: params, appContext: appContext)
    }

    register("controlSize") { params, appContext, _ in
      return try ControlSizeModifier(from: params, appContext: appContext)
    }

    register("labelStyle") { params, appContext, _ in
      return try LabelStyleModifier(from: params, appContext: appContext)
    }

    register("textFieldStyle") { params, appContext, _ in
      return try TextFieldStyleModifier(from: params, appContext: appContext)
    }

    register("scrollContentBackground") { params, appContext, _ in
      return try ScrollContentBackground(from: params, appContext: appContext)
    }

    register("listRowBackground") { params, appContext, _ in
      return try ListRowBackground(from: params, appContext: appContext)
    }

    register("listRowSeparator") { params, appContext, _ in
      return try ListRowSeparator(from: params, appContext: appContext)
    }

    register("truncationMode") { params, appContext, _ in
      return try TextTruncationMode(from: params, appContext: appContext)
    }

    register("kerning") { params, appContext, _ in
      return try TextKerning(from: params, appContext: appContext)
    }

    register("allowsTightening") { params, appContext, _ in
      return try TextAllowsTightening(from: params, appContext: appContext)
    }

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

    register("lineLimit") { params, appContext, _ in
      return try LineLimitModifier(from: params, appContext: appContext)
    }

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

    register("scrollDismissesKeyboard") { params, appContext, _ in
      return try ScrollDismissesKeyboardModifier(from: params, appContext: appContext)
    }

    register("menuActionDismissBehavior") { params, appContext, _ in
      return try MenuActionDismissBehaviorModifier(from: params, appContext: appContext)
    }

    register("headerProminence") { params, appContext, _ in
      return try HeaderProminence(from: params, appContext: appContext)
    }

    register("font") { params, appContext, _ in
      return try FontModifier(from: params, appContext: appContext)
    }

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

    register("tag") { params, appContext, _ in
      return try TagModifier(from: params, appContext: appContext)
    }

    register("pickerStyle") { params, appContext, _ in
      return try PickerStyleModifier(from: params, appContext: appContext)
    }

    register("submitLabel") { params, appContext, _ in
      return try SubmitLabelModifier(from: params, appContext: appContext)
    }

    register("datePickerStyle") { params, appContext, _ in
      return try DatePickerStyleModifier(from: params, appContext: appContext)
    }

    register("scrollDisabled") { params, appContext, _ in
      return try ScrollDisabledModifier(from: params, appContext: appContext)
    }

    register("progressViewStyle") { params, appContext, _ in
      return try ProgressViewStyleModifier(from: params, appContext: appContext)
    }

    register("gaugeStyle") { params, appContext, _ in
      return try GaugeStyleModifier(from: params, appContext: appContext)
    }

    register("presentationDetents") { params, appContext, eventDispatcher in
      return try PresentationDetentsModifier(from: params, appContext: appContext, eventDispatcher: eventDispatcher)
    }

    register("presentationDragIndicator") { params, appContext, _ in
      return try PresentationDragIndicatorModifier(from: params, appContext: appContext)
    }

    register("presentationBackgroundInteraction") { params, appContext, _ in
      return try PresentationBackgroundInteractionModifier(from: params, appContext: appContext)
    }

    register("interactiveDismissDisabled") { params, appContext, _ in
      return try InteractiveDismissDisabledModifier(from: params, appContext: appContext)
    }

    register("listStyle") { params, appContext, _ in
      return try ListStyleModifier(from: params, appContext: appContext)
    }

    register("moveDisabled") { params, appContext, _ in
      return try MoveDisabledModifier(from: params, appContext: appContext)
    }

    register("deleteDisabled") { params, appContext, _ in
      return try DeleteDisabledModifier(from: params, appContext: appContext)
    }

    register("environment") { params, appContext, _ in
      return try EnvironmentModifier(from: params, appContext: appContext)
    }

    register("contentTransition") { params, appContext, _ in
      return try ContentTransitionModifier(from: params, appContext: appContext)
    }
  }
}
