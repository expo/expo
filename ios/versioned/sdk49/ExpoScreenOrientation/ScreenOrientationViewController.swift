import ABI49_0_0ExpoModulesCore

let defaultScreenOrientationMaskKey = "ABI49_0_0EXDefaultScreenOrientationMask"
let supportedOrientationsKey = "UISupportedInterfaceOrientations"
let ipadSupportedOrientationsKey = "UISupportedInterfaceOrientations~ipad"

class ScreenOrientationViewController: UIViewController {
  let screenOrientationRegistry = ScreenOrientationRegistry.shared
  private var defaultOrientationMask: UIInterfaceOrientationMask

  init(defaultOrientationMask: UIInterfaceOrientationMask = doesDeviceHaveNotch ? .allButUpsideDown : .all) {
    self.defaultOrientationMask = defaultOrientationMask
    super.init(nibName: nil, bundle: nil)
  }

  convenience init(defaultScreenOrientationFromPlist: Void) {
    let supportedInterfaceOrientations = ScreenOrientationViewController.getSupportedInterfaceOrientations()

    guard let orientationString = Bundle.main.object(forInfoDictionaryKey: defaultScreenOrientationMaskKey) as? String else {
      // If user hasn't defined a default interface orientation using the config plugin use the allowed values from Info.plist as the
      // default orientation. Values in Info.plist are set with the "orientation" key in app.json
      self.init(defaultOrientationMask: supportedInterfaceOrientations)
      return
    }

    guard let mask = plistStringToInterfaceOrientationMask(orientationString) else {
      log.warn("Orientation lock string '\(orientationString)' provided in Info.plist does not correspond to a valid orientation mask. Application will default to orientation mask set in \(supportedOrientationsKey).")
      self.init(defaultOrientationMask: supportedInterfaceOrientations)
      return
    }

    guard mask.isSupportedByDevice() else {
      log.warn("Orientation lock string '\(orientationString)' provided in Info.plist is not supported by the device. Application will default to orientation lock set in \(supportedOrientationsKey).")
      self.init(defaultOrientationMask: supportedInterfaceOrientations)
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

  /**
   * Parses the lists under the key 'UISupportedInterfaceOrientations' in Info.plist into a UIInterfaceOrientation mask. Also checks for ipad specific settings.
   * If no orientation is found all possible orientations will be returned.
   */
  private static func getSupportedInterfaceOrientations() -> UIInterfaceOrientationMask {
    let allPossibleOrientations: UIInterfaceOrientationMask = doesDeviceHaveNotch ? .allButUpsideDown : .all
    let ipadSupportedOrientationStrings = Bundle.main.object(forInfoDictionaryKey: ipadSupportedOrientationsKey) as? [String] ?? []
    let commonSupportedOrientationStrings = Bundle.main.object(forInfoDictionaryKey: supportedOrientationsKey) as? [String] ?? []
    let supportedOrientationStrings = (isPad() && !ipadSupportedOrientationStrings.isEmpty) ?
      ipadSupportedOrientationStrings : commonSupportedOrientationStrings
    var orientationMask: UIInterfaceOrientationMask = []

    for orientationString in supportedOrientationStrings {
      guard let orientation = orientationStringToInterfaceOrientationMask(orientationString) else {
        log.warn("Info.plist: \(orientationString) is not a valid value for the \(supportedOrientationsKey) key")
        continue
      }
      orientationMask.insert(orientation)
    }

    return orientationMask.isEmpty ? allPossibleOrientations : orientationMask
  }
}
