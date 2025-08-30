// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

// MARK: - Individual ViewModifier Structs

internal struct BackgroundModifier: ViewModifier, Record {
  @Field var color: Color?

  func body(content: Content) -> some View {
    if let color = color {
      content.background(color)
    } else {
      content
    }
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
    if let all {
      content.padding(all)
    } else if let horizontal, let vertical {
      content.padding(EdgeInsets(top: vertical, leading: horizontal, bottom: vertical, trailing: horizontal))
    } else if let horizontal {
      content.padding(EdgeInsets(top: 0, leading: horizontal, bottom: 0, trailing: horizontal))
    } else if let vertical {
      content.padding(EdgeInsets(top: vertical, leading: 0, bottom: vertical, trailing: 0))
    } else {
      content.padding(EdgeInsets(top: top ?? 0, leading: leading ?? 0, bottom: bottom ?? 0, trailing: trailing ?? 0))
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
  @Field var scale: CGFloat = 1.0

  func body(content: Content) -> some View {
    content.scaleEffect(scale)
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
  @Field var shape: String = "rectangle"
  @Field var cornerRadius: CGFloat = 8

  @ViewBuilder
  func body(content: Content) -> some View {
    switch shape {
    case "circle":
      content.clipShape(Circle())
    case "roundedRectangle":
      content.clipShape(RoundedRectangle(cornerRadius: cornerRadius))
    default:
      content.clipShape(Rectangle())
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

internal struct HueRotationModifier: ViewModifier, Record {
  @Field var angle: Double = 0

  func body(content: Content) -> some View {
    content.hueRotation(.degrees(angle))
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
  @Field var shape: String = "rectangle"
  @Field var cornerRadius: CGFloat = 8

  @ViewBuilder
  func body(content: Content) -> some View {
    switch shape {
    case "circle":
      content.mask(Circle())
    case "roundedRectangle":
      content.mask(RoundedRectangle(cornerRadius: cornerRadius))
    default:
      content.mask(Rectangle())
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

internal struct GlassEffectOptions: Record {
  @Field var variant: String?
  @Field var interactive: Bool?
  @Field var tint: Color?
}

internal struct GlassEffectModifier: ViewModifier, Record {
  @Field var glass: GlassEffectOptions?
  @Field var shape: String = "capsule"

  @ViewBuilder
  func body(content: Content) -> some View {
    if #available(iOS 26.0, *) {
      #if compiler(>=6.2) // Xcode 26
      let interactive = glass?.interactive ?? false
      let tint = glass?.tint
      let glass = parseGlassVariant(glass?.variant ?? "regular")
      switch shape {
      case "capsule":
        content.glassEffect(glass.interactive(interactive).tint(tint), in: Capsule())
      case "circle":
        content.glassEffect(glass.interactive(interactive).tint(tint), in: Circle())
      case "ellipse":
        content.glassEffect(glass.interactive(interactive).tint(tint), in: Ellipse())
      default:
        content.glassEffect(glass.interactive(interactive).tint(tint), in: Rectangle())
      }
      #else
      content
      #endif
    } else {
      content
    }
  }

  #if compiler(>=6.2) // Xcode 26
  @available(iOS 26.0, *)
  private func parseGlassVariant(_ glassString: String) -> Glass {
    switch glassString {
    case "regular":
      return .regular
    case "clear":
      return .clear
    default:
      return .identity
    }
  }
  #endif
}

internal struct AnimationModifier: ViewModifier {
  let animationConfig: [String: Any]
  let animatedValue: AnyHashable?

  func body(content: Content) -> some View {
    let animationValue = parseAnimation(animationConfig)
    if let value = animatedValue {
      content.animation(animationValue, value: value)
    } else {
      content
    }
  }

  private func parseAnimation(_ config: [String: Any]) -> Animation {
    let type = config["type"] as? String ?? "default"

    var animation: Animation

    switch type {
    case "easeIn":
      if let duration = config["duration"] as? Double {
        animation = .easeIn(duration: duration)
      } else {
        animation = .easeIn
      }

    case "easeOut":
      if let duration = config["duration"] as? Double {
        animation = .easeOut(duration: duration)
      } else {
        animation = .easeOut
      }

    case "linear":
      if let duration = config["duration"] as? Double {
        animation = .linear(duration: duration)
      } else {
        animation = .linear
      }

    case "easeInOut":
      if let duration = config["duration"] as? Double {
        animation = .easeInOut(duration: duration)
      } else {
        animation = .easeInOut
      }

    case "spring":
      let duration = config["duration"] as? Double
      let bounce = config["bounce"] as? Double
      let response = config["response"] as? Double
      let dampingFraction = config["dampingFraction"] as? Double
      let blendDuration = config["blendDuration"] as? Double

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

    case "interpolatingSpring":
      let duration = config["duration"] as? Double
      let bounce = config["bounce"] as? Double
      let mass = config["mass"] as? Double
      let stiffness = config["stiffness"] as? Double
      let damping = config["damping"] as? Double
      let initialVelocity = config["initialVelocity"] as? Double

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

    if let delay = config["delay"] as? Double {
      animation = animation.delay(delay)
    }

    if let repeatCount = config["repeatCount"] as? Int {
      let autoreverses = config["autoreverses"] as? Bool ?? false
      animation = animation.repeatCount(repeatCount, autoreverses: autoreverses)
    }

    return animation
  }
}

// MARK: - Registry

/**
 * Registry for SwiftUI view modifiers that can be applied from React Native.
 * This system uses ViewModifier structs for better performance than AnyView wrapping.
 */
internal class ViewModifierRegistry {
  static let shared = ViewModifierRegistry()

  internal typealias ModiferFactory = ([String: Any], AppContext, EventDispatcher) throws -> any ViewModifier
  private(set) internal var modifierFactories: [String: ModiferFactory] = [:]

  private init() {
    registerBuiltInModifiers()
  }

  /**
   * Registers a new modifier with the given type name.
   * The modifier factory creates a ViewModifier from parameters.
   */
  func register(
    _ type: String,
    factory: @escaping ModiferFactory
  ) {
    modifierFactories[type] = factory
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

// MARK: - Built-in Modifier Registration

// swiftlint:disable:next no_grouping_extension
extension ViewModifierRegistry {
  private func registerBuiltInModifiers() {
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

    register("tint") { params, appContext, _ in
      return try TintModifier(from: params, appContext: appContext)
    }

    register("hidden") { params, appContext, _ in
      return try HiddenModifier(from: params, appContext: appContext)
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

    register("animation") { params, _, _ in
      let animationConfig = params["animation"] as? [String: Any] ?? ["type": "default"]
      let animatedValue = params["animatedValue"] as? AnyHashable

      return AnimationModifier(animationConfig: animationConfig, animatedValue: animatedValue)
    }
  }
}
