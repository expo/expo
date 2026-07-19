import ExpoModulesCore

class SymbolView: ExpoView {
  let imageView = UIImageView()

  // MARK: Defaults
#if os(macOS)
  static let defaultScale: UIImage.SymbolScale = .medium
  static let defaultContentMode: NSImageScaling = .scaleProportionallyUpOrDown
#else
  static let defaultScale: UIImage.SymbolScale = .unspecified
  static let defaultContentMode: UIView.ContentMode = .scaleAspectFit
#endif

  // MARK: Properties
  var name: String = ""
#if os(macOS)
  var weight: NSFont.Weight = .regular
  var scale: UIImage.SymbolScale = .medium
  var imageContentMode: NSImageScaling = .scaleProportionallyUpOrDown
#else
  var weight: UIImage.SymbolWeight = .unspecified
  var scale: UIImage.SymbolScale = .default
  var imageContentMode: UIView.ContentMode = .scaleToFill
#endif
  var symbolType: SymbolType = .monochrome
  var tint: UIColor?
  var animationSpec: AnimationSpec?
  var palette = [UIColor]()
  var animated = false

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    addSubview(imageView)
  }

  override func layoutSubviews() {
    imageView.frame = bounds
  }

  func reloadSymbol() {
#if os(macOS)
    reloadSymbolMacOS()
#else
    reloadSymbolIOS()
#endif
  }

#if !os(macOS)
  private func reloadSymbolIOS() {
    guard let image = UIImage(systemName: name) else {
      return
    }
    imageView.image = image
    imageView.contentMode = imageContentMode
    imageView.preferredSymbolConfiguration = getSymbolConfig()

    if let tint {
      if symbolType != .hierarchical {
        imageView.image = image.withTintColor(tint, renderingMode: .alwaysOriginal)
      }
    }

    // Effects need to be added last
    if #available(iOS 17.0, tvOS 17.0, *) {
      imageView.removeAllSymbolEffects()
      if animated {
        addSymbolEffects()
      }
    }
  }
#else
  private func reloadSymbolMacOS() {
    guard let image = NSImage(systemSymbolName: name, accessibilityDescription: nil) else {
      return
    }
    // NSImage has no `withTintColor` and NSImageView has no `preferredSymbolConfiguration`;
    // bake the config into a new NSImage and apply tint via `contentTintColor` on the view.
    let configuredImage = image.withSymbolConfiguration(getSymbolConfig()) ?? image
    imageView.image = configuredImage
    imageView.imageScaling = imageContentMode

    if let tint, symbolType != .hierarchical {
      imageView.contentTintColor = tint
    } else {
      imageView.contentTintColor = nil
    }

    if #available(macOS 14.0, *) {
      imageView.removeAllSymbolEffects()
      if animated {
        addSymbolEffects()
      }
    }
  }
#endif

  @available(iOS 17.0, tvOS 17.0, macOS 14.0, *)
  private func addSymbolEffects() {
    if let animationSpec {
      let repeating = animationSpec.repeating ?? false
      var options: SymbolEffectOptions = repeating ? .repeating : .nonRepeating

      if let repeatCount = animationSpec.repeatCount {
        options = options.repeat(abs(repeatCount))
      }

      if let speed = animationSpec.speed {
        options = options.speed(speed)
      }

      if let variableAnimationSpec = animationSpec.variableAnimationSpec {
        imageView.addSymbolEffect(variableAnimationSpec.toVariableEffect())
        return
      }

      if let animation = animationSpec.effect {
        animation.toEffect().add(to: imageView, with: options)
      }
    }
  }

  private func getSymbolConfig() -> UIImage.SymbolConfiguration {
    #if os(tvOS)
    var config = UIImage.SymbolConfiguration(pointSize: 18.0, weight: weight, scale: scale)
    #else
    var config = UIImage.SymbolConfiguration(pointSize: UIFont.systemFontSize, weight: weight, scale: scale)
    #endif

    switch symbolType {
    case .monochrome:
      if #available(iOS 16.0, tvOS 16.0, macOS 13.0, *) {
        config = config.applying(UIImage.SymbolConfiguration.preferringMonochrome())
      }
    case .hierarchical:
      config = config.applying(UIImage.SymbolConfiguration(hierarchicalColor: tint ?? .systemBlue))
    case .palette:
      if palette.count > 1 {
        config = config.applying(UIImage.SymbolConfiguration(paletteColors: palette))
      }
    case .multicolor:
      config = config.applying(UIImage.SymbolConfiguration.preferringMulticolor())
    }

    return config
  }
}
