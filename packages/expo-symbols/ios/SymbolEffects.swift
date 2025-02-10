@available(iOS 17.0, tvOS 17.0, *)
internal protocol EffectAdding {
  func add(to view: UIImageView, with options: SymbolEffectOptions)
}

@available(iOS 17.0, tvOS 17.0, *)
internal struct BounceEffect: EffectAdding {
  private let effect: BounceSymbolEffect = .bounce
  let wholeSymbol: Bool?
  let direction: AnimationDirection?

  func add(to view: UIImageView, with options: SymbolEffectOptions) {
    var finalEffect = effect
    if wholeSymbol ?? false {
      finalEffect = finalEffect.wholeSymbol
    }

    if let direction {
      finalEffect = direction == .up ? finalEffect.up : finalEffect.down
    }

    view.addSymbolEffect(finalEffect, options: options, animated: true)
  }
}

@available(iOS 17.0, tvOS 17.0, *)
internal struct PulseEffect: EffectAdding {
  private let effect: PulseSymbolEffect = .pulse
  let wholeSymbol: Bool?

  func add(to view: UIImageView, with options: SymbolEffectOptions) {
    var finalEffect = effect
    if wholeSymbol ?? false {
      finalEffect = finalEffect.wholeSymbol
    }
    view.addSymbolEffect(finalEffect, options: options, animated: true)
  }
}

@available(iOS 17.0, tvOS 17.0, *)
internal struct ScaleEffect: EffectAdding {
  private let effect: ScaleSymbolEffect = .scale
  let wholeSymbol: Bool?
  let direction: AnimationDirection?

  func add(to view: UIImageView, with options: SymbolEffectOptions) {
    var finalEffect = effect
    if wholeSymbol ?? false {
      finalEffect = finalEffect.wholeSymbol
    }

    if let direction {
      finalEffect = direction == .up ? finalEffect.up : finalEffect.down
    }

    view.addSymbolEffect(finalEffect, options: options, animated: true)
  }
}
