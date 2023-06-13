import ExpoModulesCore

let defaultScreenOrientationMask = "EXDefaultScreenOrientationMask"

class ScreenOrientationViewController: UIViewController {
  let screenOrientationRegistry = ScreenOrientationRegistry.shared
  private var defaultOrientationMask: UIInterfaceOrientationMask

  init(defaultOrientationMask: UIInterfaceOrientationMask = .portrait) {
    self.defaultOrientationMask = defaultOrientationMask
    super.init(nibName: nil, bundle: nil)
  }

  convenience init(defaultScreenOrientationFromPlist: Void) {
    guard let orientationString = Bundle.main.object(forInfoDictionaryKey: defaultScreenOrientationMask) as? String else {
      self.init(defaultOrientationMask: .portrait)
      return
    }

    guard let mask = plistStringToInterfaceOrientationMask(orientationString) else {
      log.warn("Orientation lock string '\(orientationString)' provided in Info.plist does not correspond to a valid orientation mask. Application will default to portrait orientation lock.")
      self.init(defaultOrientationMask: .portrait)
      return
    }

    guard mask.isSupportedByDevice() else {
      log.warn("Orientation lock string '\(orientationString)' provided in Info.plist is not supported by the device. Application will default to portrait orientation lock.")
      self.init(defaultOrientationMask: .portrait)
      return
    }

    self.init(defaultOrientationMask: mask)
  }

  @available(*, unavailable)
  required init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
    guard !shouldUseRNScreenOrientation() else {
      return super.supportedInterfaceOrientations
    }
    let mask = screenOrientationRegistry.requiredOrientationMask()
    return !mask.isEmpty ? mask : defaultOrientationMask
  }

  override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
    super.traitCollectionDidChange(previousTraitCollection)

    if traitCollection.verticalSizeClass != previousTraitCollection?.verticalSizeClass ||
      traitCollection.horizontalSizeClass != previousTraitCollection?.horizontalSizeClass {
      screenOrientationRegistry.traitCollectionDidChange(to: traitCollection)
    }
  }

  private func shouldUseRNScreenOrientation() -> Bool {
    // If RNScreens has set the orientation we want to use it instead of our orientation
    guard let screenWindowTraitsClass = NSClassFromString("RNSScreenWindowTraits") else {
      return false
    }
    return screenWindowTraitsClass.shouldAskScreensForScreenOrientation?(in: self) ?? false
  }
}
