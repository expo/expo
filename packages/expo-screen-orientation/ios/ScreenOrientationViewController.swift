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

    // TODO: When printing to errors to JS available print the warnings there (@behenate)
    guard let mask = plistStringToInterfaceOrientationMask(orientationString) else {
      print("Orientation lock string '\(orientationString)' provided in Info.plist does not correspond to a valid orientation mask. Application will default to portrait orientation lock.")
      self.init(defaultOrientationMask: .portrait)
      return
    }

    guard mask.isSupportedByDevice() else {
      print("Orientation lock string '\(orientationString)' provided in Info.plist is not supported by the device. Application will default to portrait orientation lock.")
      self.init(defaultOrientationMask: .portrait)
      return
    }

    self.init(defaultOrientationMask: mask)
  }

  @available(*, unavailable)
  required init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  // Most of the time screen orientation will also be dependent on value set in ScreenOrientationAppDelegate
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

  // If RNScreens set the orientation we want to use it instead of our orientation
  private func shouldUseRNScreenOrientation() -> Bool {
    guard let screenWindowTraitsClass = NSClassFromString("RNSScreenWindowTraits") else {
      return false
    }
    return screenWindowTraitsClass.shouldAskScreensForScreenOrientation?(in: self) ?? false
  }
}
