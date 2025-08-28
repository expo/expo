// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

// MARK: - Individual ViewModifier Structs

internal struct BackgroundModifier: ViewModifier {
  let color: Color?

  func body(content: Content) -> some View {
    if let color = color {
      content.background(color)
    } else {
      content
    }
  }
}

internal struct CornerRadiusModifier: ViewModifier {
  let radius: CGFloat

  func body(content: Content) -> some View {
    content.cornerRadius(radius)
  }
}

internal struct ShadowModifier: ViewModifier {
  let color: Color
  let radius: CGFloat
  let x: CGFloat
  let y: CGFloat

  func body(content: Content) -> some View {
    content.shadow(color: color, radius: radius, x: x, y: y)
  }
}

internal struct FrameModifier: ViewModifier {
  let width: CGFloat?
  let height: CGFloat?
  let minWidth: CGFloat?
  let maxWidth: CGFloat?
  let minHeight: CGFloat?
  let maxHeight: CGFloat?
  let idealWidth: CGFloat?
  let idealHeight: CGFloat?
  let alignment: Alignment

  func body(content: Content) -> some View {
    content
      .frame(
        minWidth: minWidth,
        idealWidth: idealWidth,
        maxWidth: maxWidth,
        minHeight: minHeight,
        idealHeight: idealHeight,
        maxHeight: maxHeight,
        alignment: alignment
      )
      .frame(width: width, height: height, alignment: alignment)
  }
}

internal struct PaddingModifier: ViewModifier {
  let edgeInsets: EdgeInsets

  func body(content: Content) -> some View {
    content.padding(edgeInsets)
  }
}

internal struct OpacityModifier: ViewModifier {
  let value: Double

  func body(content: Content) -> some View {
    content.opacity(value)
  }
}

internal struct ScaleEffectModifier: ViewModifier {
  let scale: CGFloat

  func body(content: Content) -> some View {
    content.scaleEffect(scale)
  }
}

internal struct RotationEffectModifier: ViewModifier {
  let angle: Double

  func body(content: Content) -> some View {
    content.rotationEffect(.degrees(angle))
  }
}

internal struct OffsetModifier: ViewModifier {
  let x: CGFloat
  let y: CGFloat

  func body(content: Content) -> some View {
    content.offset(x: x, y: y)
  }
}

internal struct ForegroundColorModifier: ViewModifier {
  let color: Color?

  func body(content: Content) -> some View {
    if let color = color {
      content.foregroundColor(color)
    } else {
      content
    }
  }
}

internal struct ForegroundStyleModifier: ViewModifier {
  let styleType: String
  let hierarchicalStyle: String?
  let color: Color?
  let colors: [Color]?
  let startPoint: UnitPoint?
  let endPoint: UnitPoint?
  let center: UnitPoint?
  let startRadius: CGFloat?
  let endRadius: CGFloat?

  func body(content: Content) -> some View {
    switch styleType {
    case "color":
      if let color {
        content.foregroundStyle(color)
      } else {
        content
      }
    case "hierarchical":
      switch hierarchicalStyle {
      case "primary":
        content.foregroundStyle(.primary)
      case "secondary":
        content.foregroundStyle(.secondary)
      case "tertiary":
        content.foregroundStyle(.tertiary)
      case "quaternary":
        content.foregroundStyle(.quaternary)
      case "quinary":
        if #available(iOS 16.0, *) {
          content.foregroundStyle(.quinary)
        } else {
          content.foregroundStyle(.quaternary)
        }
      default:
        content.foregroundStyle(.primary)
      }
    case "linearGradient":
      if let colors, let startPoint, let endPoint {
        content.foregroundStyle(
          LinearGradient(
            colors: colors,
            startPoint: startPoint,
            endPoint: endPoint
          )
        )
      } else {
        content
      }
    case "radialGradient":
      if let colors, let center, let startRadius, let endRadius {
        content.foregroundStyle(
          RadialGradient(
            colors: colors,
            center: center,
            startRadius: startRadius,
            endRadius: endRadius
          )
        )
      } else {
        content
      }
    case "angularGradient":
      if let colors, let center {
        content.foregroundStyle(
          AngularGradient(
            colors: colors,
            center: center
          )
        )
      } else {
        content
      }
    default:
      content
    }
  }
}

internal struct TintModifier: ViewModifier {
  let color: Color?

  func body(content: Content) -> some View {
    if let color = color {
      content.tint(color)
    } else {
      content
    }
  }
}

internal struct HiddenModifier: ViewModifier {
  let hidden: Bool

  func body(content: Content) -> some View {
    if hidden {
      content.hidden()
    } else {
      content
    }
  }
}

internal struct ZIndexModifier: ViewModifier {
  let index: Double

  func body(content: Content) -> some View {
    content.zIndex(index)
  }
}

internal struct BlurModifier: ViewModifier {
  let radius: CGFloat

  func body(content: Content) -> some View {
    content.blur(radius: radius)
  }
}

internal struct BrightnessModifier: ViewModifier {
  let amount: Double

  func body(content: Content) -> some View {
    content.brightness(amount)
  }
}

internal struct ContrastModifier: ViewModifier {
  let amount: Double

  func body(content: Content) -> some View {
    content.contrast(amount)
  }
}

internal struct SaturationModifier: ViewModifier {
  let amount: Double

  func body(content: Content) -> some View {
    content.saturation(amount)
  }
}

internal struct ColorInvertModifier: ViewModifier {
  let inverted: Bool

  func body(content: Content) -> some View {
    if inverted {
      content.colorInvert()
    } else {
      content
    }
  }
}

internal struct GrayscaleModifier: ViewModifier {
  let amount: Double

  func body(content: Content) -> some View {
    content.grayscale(amount)
  }
}

internal struct BorderModifier: ViewModifier {
  let color: Color
  let width: CGFloat

  func body(content: Content) -> some View {
    content.border(color, width: width)
  }
}

internal struct ClipShapeModifier: ViewModifier {
  let shape: String
  let cornerRadius: CGFloat

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

internal struct OnTapGestureModifier: ViewModifier {
  let eventDispatcher: EventDispatcher

  func body(content: Content) -> some View {
    if #available(iOS 15.0, tvOS 16.0, *) {
      content.onTapGesture {
        eventDispatcher(["onTapGesture": [:]])
      }
    }
  }
}

internal struct OnLongPressGestureModifier: ViewModifier {
  let minimumDuration: Double
  let eventDispatcher: EventDispatcher

  func body(content: Content) -> some View {
    content.onLongPressGesture(minimumDuration: minimumDuration) {
      eventDispatcher(["onLongPressGesture": [:]])
    }
  }
}

internal struct HueRotationModifier: ViewModifier {
  let angle: Double

  func body(content: Content) -> some View {
    content.hueRotation(.degrees(angle))
  }
}

internal struct AccessibilityLabelModifier: ViewModifier {
  let label: String?

  func body(content: Content) -> some View {
    if let label = label {
      content.accessibilityLabel(label)
    } else {
      content
    }
  }
}

internal struct AccessibilityHintModifier: ViewModifier {
  let hint: String?

  func body(content: Content) -> some View {
    if let hint = hint {
      content.accessibilityHint(hint)
    } else {
      content
    }
  }
}

internal struct AccessibilityValueModifier: ViewModifier {
  let value: String?

  func body(content: Content) -> some View {
    if let value = value {
      content.accessibilityValue(value)
    } else {
      content
    }
  }
}

internal struct LayoutPriorityModifier: ViewModifier {
  let priority: Double

  func body(content: Content) -> some View {
    content.layoutPriority(priority)
  }
}

internal struct AspectRatioModifier: ViewModifier {
  let ratio: Double
  let contentMode: ContentMode

  func body(content: Content) -> some View {
    content.aspectRatio(ratio, contentMode: contentMode)
  }
}

internal struct ClippedModifier: ViewModifier {
  let clipped: Bool

  func body(content: Content) -> some View {
    if clipped {
      content.clipped()
    } else {
      content
    }
  }
}

internal struct MaskModifier: ViewModifier {
  let shape: String
  let cornerRadius: CGFloat

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

internal struct OverlayModifier: ViewModifier {
  let color: Color?
  let alignment: Alignment

  func body(content: Content) -> some View {
    if let color = color {
      content.overlay(color, alignment: alignment)
    } else {
      content
    }
  }
}

internal struct BackgroundOverlayModifier: ViewModifier {
  let color: Color?
  let alignment: Alignment

  func body(content: Content) -> some View {
    if let color = color {
      content.background(color, alignment: alignment)
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

internal struct GlassEffectModifier: ViewModifier {
  let glassVariant: String
  let interactive: Bool
  let tint: Color?
  let shape: String

  @ViewBuilder
  func body(content: Content) -> some View {
    if #available(iOS 26.0, *) {
      #if compiler(>=6.2) // Xcode 26
      let glass = parseGlassVariant(glassVariant)
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

  internal typealias ModiferFactory = ([String: Any], EventDispatcher) -> any ViewModifier
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
  func applyModifier(_ type: String, to view: AnyView, globalEventDispatcher: EventDispatcher, params: [String: Any]) -> AnyView {
    guard let viewModifier = modifierFactories[type]?(params, globalEventDispatcher) else {
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
    register("background") { params, _ in
      let color = (params["color"] as? String).map { Color(hex: $0) }
      return BackgroundModifier(color: color)
    }

    register("cornerRadius") { params, _ in
      let radius = params["radius"] as? Double ?? 0
      return CornerRadiusModifier(radius: CGFloat(radius))
    }

    register("shadow") { params, _ in
      let radius = params["radius"] as? Double ?? 0
      let x = params["x"] as? Double ?? 0
      let y = params["y"] as? Double ?? 0
      let colorString = params["color"] as? String ?? "#000000"
      let color = Color(hex: colorString)

      return ShadowModifier(
        color: color,
        radius: CGFloat(radius),
        x: CGFloat(x),
        y: CGFloat(y)
      )
    }

    register("frame") { params, _ in
      let width = (params["width"] as? Double).map { CGFloat($0) }
      let height = (params["height"] as? Double).map { CGFloat($0) }
      let minWidth = (params["minWidth"] as? Double).map { CGFloat($0) }
      let maxWidth = (params["maxWidth"] as? Double).map { CGFloat($0) }
      let minHeight = (params["minHeight"] as? Double).map { CGFloat($0) }
      let maxHeight = (params["maxHeight"] as? Double).map { CGFloat($0) }
      let idealWidth = (params["idealWidth"] as? Double).map { CGFloat($0) }
      let idealHeight = (params["idealHeight"] as? Double).map { CGFloat($0) }
      let alignmentString = params["alignment"] as? String ?? "center"
      let alignment = parseAlignment(alignmentString)

      return FrameModifier(
        width: width,
        height: height,
        minWidth: minWidth,
        maxWidth: maxWidth,
        minHeight: minHeight,
        maxHeight: maxHeight,
        idealWidth: idealWidth,
        idealHeight: idealHeight,
        alignment: alignment
      )
    }

    register("padding") { params, _ in
      var edgeInsets = EdgeInsets()

      if let all = params["all"] as? Double {
        edgeInsets = EdgeInsets(top: CGFloat(all), leading: CGFloat(all), bottom: CGFloat(all), trailing: CGFloat(all))
      } else if let horizontal = params["horizontal"] as? Double, let vertical = params["vertical"] as? Double {
        edgeInsets = EdgeInsets(top: CGFloat(vertical), leading: CGFloat(horizontal), bottom: CGFloat(vertical), trailing: CGFloat(horizontal))
      } else if let horizontal = params["horizontal"] as? Double {
        edgeInsets = EdgeInsets(top: 0, leading: CGFloat(horizontal), bottom: 0, trailing: CGFloat(horizontal))
      } else if let vertical = params["vertical"] as? Double {
        edgeInsets = EdgeInsets(top: CGFloat(vertical), leading: 0, bottom: CGFloat(vertical), trailing: 0)
      } else {
        edgeInsets = EdgeInsets(
          top: CGFloat(params["top"] as? Double ?? 0),
          leading: CGFloat(params["leading"] as? Double ?? 0),
          bottom: CGFloat(params["bottom"] as? Double ?? 0),
          trailing: CGFloat(params["trailing"] as? Double ?? 0)
        )
      }

      return PaddingModifier(edgeInsets: edgeInsets)
    }

    register("opacity") { params, _ in
      let value = params["value"] as? Double ?? 1.0
      return OpacityModifier(value: value)
    }

    register("scaleEffect") { params, _ in
      let scale = params["scale"] as? Double ?? 1.0
      return ScaleEffectModifier(scale: CGFloat(scale))
    }

    register("rotationEffect") { params, _ in
      let angle = params["angle"] as? Double ?? 0.0
      return RotationEffectModifier(angle: angle)
    }

    register("offset") { params, _ in
      let x = params["x"] as? Double ?? 0
      let y = params["y"] as? Double ?? 0
      return OffsetModifier(x: CGFloat(x), y: CGFloat(y))
    }

    register("foregroundColor") { params, _ in
      let color = (params["color"] as? String).map { Color(hex: $0) }
      return ForegroundColorModifier(color: color)
    }

    register("foregroundStyle") { params, _ in
      let styleType = params["styleType"] as? String ?? "color"
      return self.makeForegroundStyleModifier(styleType: styleType, params: params)
    }

    register("tint") { params, _ in
      let color = (params["color"] as? String).map { Color(hex: $0) }
      return TintModifier(color: color)
    }

    register("hidden") { params, _ in
      let hidden = params["hidden"] as? Bool ?? true
      return HiddenModifier(hidden: hidden)
    }

    register("zIndex") { params, _ in
      let index = params["index"] as? Double ?? 0
      return ZIndexModifier(index: index)
    }

    register("blur") { params, _ in
      let radius = params["radius"] as? Double ?? 0
      return BlurModifier(radius: CGFloat(radius))
    }

    register("brightness") { params, _ in
      let amount = params["amount"] as? Double ?? 0
      return BrightnessModifier(amount: amount)
    }

    register("contrast") { params, _ in
      let amount = params["amount"] as? Double ?? 1
      return ContrastModifier(amount: amount)
    }

    register("saturation") { params, _ in
      let amount = params["amount"] as? Double ?? 1
      return SaturationModifier(amount: amount)
    }

    register("colorInvert") { params, _ in
      let inverted = params["inverted"] as? Bool ?? true
      return ColorInvertModifier(inverted: inverted)
    }

    register("grayscale") { params, _ in
      let amount = params["amount"] as? Double ?? 0
      return GrayscaleModifier(amount: amount)
    }

    register("border") { params, _ in
      let colorString = params["color"] as? String ?? "#000000"
      let width = params["width"] as? Double ?? 1.0
      let color = Color(hex: colorString)

      return BorderModifier(color: color, width: CGFloat(width))
    }

    register("clipShape") { params, _ in
      let shape = params["shape"] as? String ?? "rectangle"
      let cornerRadius = params["cornerRadius"] as? Double ?? 8

      return ClipShapeModifier(shape: shape, cornerRadius: CGFloat(cornerRadius))
    }

    register("onTapGesture") { _, eventDispatcher in
      return OnTapGestureModifier(eventDispatcher: eventDispatcher)
    }

    register("onLongPressGesture") { params, eventDispatcher in
      let minimumDuration = params["minimumDuration"] as? Double ?? 0.5
      return OnLongPressGestureModifier(minimumDuration: minimumDuration, eventDispatcher: eventDispatcher)
    }

    register("hueRotation") { params, _ in
      let angle = params["angle"] as? Double ?? 0
      return HueRotationModifier(angle: angle)
    }

    register("accessibilityLabel") { params, _ in
      let label = params["label"] as? String
      return AccessibilityLabelModifier(label: label)
    }

    register("accessibilityHint") { params, _ in
      let hint = params["hint"] as? String
      return AccessibilityHintModifier(hint: hint)
    }

    register("accessibilityValue") { params, _ in
      let value = params["value"] as? String
      return AccessibilityValueModifier(value: value)
    }

    register("layoutPriority") { params, _ in
      let priority = params["priority"] as? Double ?? 0
      return LayoutPriorityModifier(priority: priority)
    }

    register("aspectRatio") { params, _ in
      let ratio = params["ratio"] as? Double ?? 1.0
      let contentMode = params["contentMode"] as? String ?? "fit"
      let mode: ContentMode = contentMode == "fill" ? .fill : .fit
      return AspectRatioModifier(ratio: ratio, contentMode: mode)
    }

    register("clipped") { params, _ in
      let clipped = params["clipped"] as? Bool ?? true
      return ClippedModifier(clipped: clipped)
    }

    register("mask") { params, _ in
      let shape = params["shape"] as? String ?? "rectangle"
      let cornerRadius = params["cornerRadius"] as? Double ?? 8
      return MaskModifier(shape: shape, cornerRadius: CGFloat(cornerRadius))
    }

    register("overlay") { params, _ in
      let color = (params["color"] as? String).map { Color(hex: $0) }
      let alignmentString = params["alignment"] as? String ?? "center"
      let alignment = parseAlignment(alignmentString)
      return OverlayModifier(color: color, alignment: alignment)
    }

    register("backgroundOverlay") { params, _ in
      let color = (params["color"] as? String).map { Color(hex: $0) }
      let alignmentString = params["alignment"] as? String ?? "center"
      let alignment = parseAlignment(alignmentString)
      return BackgroundOverlayModifier(color: color, alignment: alignment)
    }

    register("glassEffect") { params, _ in
      let glassDict = params["glass"] as? [String: Any]
      let glassVariant = glassDict?["variant"] as? String ?? "regular"
      let interactive = glassDict?["interactive"] as? Bool ?? false
      let tintColor = (glassDict?["tint"] as? String).map { Color(hex: $0) }
      let shape = params["shape"] as? String ?? "capsule"

      return GlassEffectModifier(
        glassVariant: glassVariant,
        interactive: interactive,
        tint: tintColor,
        shape: shape
      )
    }

    register("animation") { params, _ in
      let animationConfig = params["animation"] as? [String: Any] ?? ["type": "default"]
      let animatedValue = params["animatedValue"] as? AnyHashable

      return AnimationModifier(animationConfig: animationConfig, animatedValue: animatedValue)
    }
  }

  // MARK: - ForegroundStyle Helpers

  private func makeForegroundStyleModifier(
    styleType: String,
    params: [String: Any]
  ) -> ForegroundStyleModifier {
    var hierarchicalStyle: String?
    var color: Color?
    var colors: [Color]?
    var startPoint: UnitPoint?
    var endPoint: UnitPoint?
    var center: UnitPoint?
    var startRadius: CGFloat?
    var endRadius: CGFloat?

    switch styleType {
    case "color":
      color = (params["color"] as? String).map { Color(hex: $0) }

    case "hierarchical":
      hierarchicalStyle = params["style"] as? String ?? "primary"

    case "linearGradient":
      (colors, startPoint, endPoint) = parseLinearGradient(params)

    case "radialGradient":
      (colors, center, startRadius, endRadius) = parseRadialGradient(params)

    case "angularGradient":
      (colors, center) = parseAngularGradient(params)

    default:
      color = (params["color"] as? String).map { Color(hex: $0) }
    }

    return ForegroundStyleModifier(
      styleType: styleType,
      hierarchicalStyle: hierarchicalStyle,
      color: color,
      colors: colors,
      startPoint: startPoint,
      endPoint: endPoint,
      center: center,
      startRadius: startRadius,
      endRadius: endRadius
    )
  }

  private func parseLinearGradient(
    _ params: [String: Any]
  ) -> ([Color]?, UnitPoint?, UnitPoint?) {
    let colors = (params["colors"] as? [String])?.map { Color(hex: $0) }
    let start = parseUnitPoint(params["startPoint"] as? [String: Any])
    let end = parseUnitPoint(params["endPoint"] as? [String: Any])
    return (colors, start, end)
  }

  private func parseRadialGradient(
    _ params: [String: Any]
  ) -> ([Color]?, UnitPoint?, CGFloat?, CGFloat?) {
    let colors = (params["colors"] as? [String])?.map { Color(hex: $0) }
    let center = parseUnitPoint(params["center"] as? [String: Any])
    let startRadius = (params["startRadius"] as? Double).map { CGFloat($0) }
    let endRadius = (params["endRadius"] as? Double).map { CGFloat($0) }
    return (colors, center, startRadius, endRadius)
  }

  private func parseAngularGradient(
    _ params: [String: Any]
  ) -> ([Color]?, UnitPoint?) {
    let colors = (params["colors"] as? [String])?.map { Color(hex: $0) }
    let center = parseUnitPoint(params["center"] as? [String: Any])
    return (colors, center)
  }

  private func parseUnitPoint(_ pointDict: [String: Any]?) -> UnitPoint? {
    guard let pointDict = pointDict,
      let x = pointDict["x"] as? Double,
      let y = pointDict["y"] as? Double else {
      return nil
    }
    return UnitPoint(x: CGFloat(x), y: CGFloat(y))
  }
}

// MARK: - Utility Functions

private func parseAlignment(_ alignmentString: String) -> Alignment {
  switch alignmentString {
  case "leading":
    return .leading
  case "trailing":
    return .trailing
  case "top":
    return .top
  case "bottom":
    return .bottom
  case "topLeading":
    return .topLeading
  case "topTrailing":
    return .topTrailing
  case "bottomLeading":
    return .bottomLeading
  case "bottomTrailing":
    return .bottomTrailing
  default:
    return .center
  }
}

// MARK: - Color Extension

internal extension Color {
  init(hex: String) {
    // Use ExpoModulesCore's Color conversion system for all color formats
    do {
      self = try Color.convert(from: hex)
    } catch {
      // Fallback to clear color if conversion fails
      self = .clear
    }
  }
}
