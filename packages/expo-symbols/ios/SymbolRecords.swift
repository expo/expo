import ExpoModulesCore

enum SymbolScale: String, Enumerable {
  case `default`
  case unspecified
  case small
  case medium
  case large

  func imageSymbolScale() -> UIImage.SymbolScale {
    switch self {
    case .default:
      return .default
    case .small:
      return .small
    case .medium:
      return .medium
    case .large:
      return .large
    case .unspecified:
      return .unspecified
    }
  }
}

enum SymbolWeight: String, Enumerable {
  case unspecified
  case ultraLight
  case thin
  case light
  case regular
  case medium
  case semibold
  case bold
  case heavy
  case black

  func imageSymbolWeight() -> UIImage.SymbolWeight {
    switch self {
    case .unspecified:
      return .unspecified
    case .ultraLight:
      return .ultraLight
    case .thin:
      return .thin
    case .light:
      return .light
    case .regular:
      return .regular
    case .medium:
      return .medium
    case .semibold:
      return .semibold
    case .bold:
      return .bold
    case .heavy:
      return .heavy
    case .black:
      return .black
    }
  }
}

enum SymbolContentMode: String, Enumerable {
  case scaleToFill
  case scaleAspectFit
  case scaleAspectFill
  case redraw
  case center
  case top
  case bottom
  case left
  case right
  case topLeft
  case topRight
  case bottomLeft
  case bottomRight

  func toContentMode() -> UIView.ContentMode {
    switch self {
    case .scaleToFill:
      return .scaleToFill
    case .scaleAspectFit:
      return .scaleAspectFit
    case .scaleAspectFill:
      return .scaleAspectFill
    case .redraw:
      return .redraw
    case .center:
      return .center
    case .top:
      return .top
    case .bottom:
      return .bottom
    case .left:
      return .left
    case .right:
      return .right
    case .topLeft:
      return .topLeft
    case .topRight:
      return .topRight
    case .bottomLeft:
      return .bottomLeft
    case .bottomRight:
      return .bottomRight
    }
  }
}

enum SymbolType: String, Enumerable {
  case monochrome
  case hierarchical
  case palette
  case multicolor
}

enum AnimationDirection: String, Enumerable {
  case up
  case down
}

enum AnimationType: String, Enumerable {
  case bounce
  case pulse
  case scale
}

internal struct AnimationSpec: Record {
  @Field var effect: AnimationEffect?
  @Field var repeating: Bool?
  @Field var repeatCount: Int?
  @Field var speed: Double?
  @Field var variableAnimationSpec: VariableColorSpec?
}

internal struct AnimationEffect: Record {
  @Field var type: AnimationType = .bounce
  @Field var wholeSymbol: Bool?
  @Field var direction: AnimationDirection?

  @available(iOS 17.0, *)
  func toEffect() -> EffectAdding {
    switch type {
    case .bounce:
      return BounceEffect(wholeSymbol: wholeSymbol, direction: direction)
    case .pulse:
      return PulseEffect(wholeSymbol: wholeSymbol)
    case .scale:
      return ScaleEffect(wholeSymbol: wholeSymbol, direction: direction)
    }
  }
}

internal struct VariableColorSpec: Record {
  @Field var reversing: Bool?
  @Field var nonReversing: Bool?
  @Field var cumulative: Bool?
  @Field var iterative: Bool?
  @Field var hideInactiveLayers: Bool?
  @Field var dimInactiveLayers: Bool?

  @available(iOS 17.0, *)
  func toVariableEffect() -> VariableColorSymbolEffect {
    var effect: VariableColorSymbolEffect = .variableColor

    if cumulative != nil {
      effect = effect.cumulative
    }

    if iterative != nil {
      effect = effect.iterative
    }

    if hideInactiveLayers != nil {
      effect = effect.hideInactiveLayers
    }

    if dimInactiveLayers != nil {
      effect = effect.dimInactiveLayers
    }

    if reversing != nil {
      effect = effect.reversing
    }

    if nonReversing != nil {
      effect = effect.nonReversing
    }

    return effect
  }
}
