import ExpoModulesCore

let defaultScreenOrientationMaskKey = "EXDefaultScreenOrientationMask"
let supportedOrientationsKey = "UISupportedInterfaceOrientations"
let ipadSupportedOrientationsKey = "UISupportedInterfaceOrientations~ipad"

class ScreenOrientationViewController: UIViewController {
  let screenOrientationRegistry = ScreenOrientationRegistry.shared
  private var defaultOrientationMask: UIInterfaceOrientationMask

  init(defaultOrientationMask: UIInterfaceOrientationMask = .portrait) {
    self.defaultOrientationMask = defaultOrientationMask
    super.init(nibName: nil, bundle: nil)
  }

  convenience init(defaultScreenOrientationFromPlist: Void) {
    let allPossibleOrientations: UIInterfaceOrientationMask = doesDeviceHaveNotch ? .allButUpsideDown : .all
    let ipadSupportedOrientationStrings = Bundle.main.object(forInfoDictionaryKey: ipadSupportedOrientationsKey) as? [String] ?? []
    let supportedOrientationStrings = (isPad() && !ipadSupportedOrientationStrings.isEmpty) ?
      ipadSupportedOrientationStrings : Bundle.main.object(forInfoDictionaryKey: supportedOrientationsKey) as? [String] ?? []
    var supportedInterfaceOrientations: UIInterfaceOrientationMask = ScreenOrientationViewController.getSupportedInterfaceOrientations()

    supportedInterfaceOrientations = supportedInterfaceOrientations.isEmpty ? allPossibleOrientations : supportedInterfaceOrientations

    guard let orientationString = Bundle.main.object(forInfoDictionaryKey: defaultScreenOrientationMaskKey) as? String else {
      // If user hasn't defined a default interface orientation using the config plugin use the allowed values from Info.plist as the
      // default orientation. Values in Info.plist are set with the "orientation" key in Info.plist
      self.init(defaultOrientationMask: supportedInterfaceOrientations)
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

    if mask != mask.intersection(supportedInterfaceOrientations) {
      log.warn("Info.plist: Orientations allowed in `\(supportedOrientationsKey)` are in conflict with the values allowed in `\(defaultScreenOrientationMaskKey)`. Values from `\(defaultScreenOrientationMaskKey)` will be used. When setting the initial orientation using the config plugin delete the `\"orientation\"` key from `app.json`")
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

  private static func getSupportedInterfaceOrientations() -> UIInterfaceOrientationMask {
    var orientationMask: UIInterfaceOrientationMask = []

    guard let orientationStrings = Bundle.main.object(forInfoDictionaryKey: "UISupportedInterfaceOrientations") as? [String] else {
      return orientationMask
    }

    for orientationString in orientationStrings {
      guard let orientation = UIInterfaceOrientationMask.Element(fromOrientationString: orientationString) else {
        log.warn("Info.plist: \(orientationString) is not a valid value for the \(supportedOrientationsKey) key")
        continue
      }
      orientationMask.insert(orientation)
    }

    return orientationMask
  }
}
