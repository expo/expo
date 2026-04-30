import ExpoModulesCore

let defaultScreenOrientationMaskKey = "EXDefaultScreenOrientationMask"
let supportedOrientationsKey = "UISupportedInterfaceOrientations"
let ipadSupportedOrientationsKey = "UISupportedInterfaceOrientations~ipad"

class ScreenOrientationViewController: UIViewController {
  let screenOrientationRegistry = ScreenOrientationRegistry.shared
  private var defaultOrientationMask: UIInterfaceOrientationMask
  private var previousInterfaceOrientation: UIInterfaceOrientation = .unknown
  private var windowInterfaceOrientation: UIInterfaceOrientation? {
    let keyWindow = UIApplication
      .shared
      .connectedScenes
      .flatMap { ($0 as? UIWindowScene)?.windows ?? [] }
      .last { $0.isKeyWindow }

    return keyWindow?.windowScene?.interfaceOrientation
  }

  init(defaultOrientationMask: UIInterfaceOrientationMask = doesDeviceHaveNotch ? .allButUpsideDown : .all) {
    self.defaultOrientationMask = defaultOrientationMask
    super.init(nibName: nil, bundle: nil)

    // For iPads traitCollectionDidChange will not be called (it's always in the same size class). It is necessary
    // to init it in here, so it's possible to return it in the didUpdateDimensionsEvent of the module
    if self.screenOrientationRegistry.currentTraitCollection == nil {
      self.screenOrientationRegistry.traitCollectionDidChange(to: self.traitCollection)
    }
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
    if let vc = vcWithRNScreenOrientation() {
      // react-native-screens has per-screen orientation set. Return that VC's
      // supportedInterfaceOrientations — which RNScreens has swizzled to resolve
      // the active screen's orientation mask.
      return vc.supportedInterfaceOrientations
    }

    // No react-native-screens orientation — use expo-screen-orientation's registry mask
    // (set via lockAsync) or the default from Info.plist.
    let mask = screenOrientationRegistry.requiredOrientationMask()
    return !mask.isEmpty ? mask : defaultOrientationMask
  }

  override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
    super.traitCollectionDidChange(previousTraitCollection)
    screenOrientationRegistry.traitCollectionDidChange(to: traitCollection)
  }

  override func viewWillTransition(to size: CGSize, with coordinator: UIViewControllerTransitionCoordinator) {
    super.viewWillTransition(to: size, with: coordinator)

    // Use the completion block, windowScene.interfaceOrientation is still stale during the
    // alongside-transition closure, which makes viewDidTransition read .unknown.
    coordinator.animate(alongsideTransition: nil) { [weak self] _ in
      guard let self = self, let windowInterfaceOrientation = self.windowInterfaceOrientation else {
        return
      }

      if windowInterfaceOrientation != self.previousInterfaceOrientation {
        self.screenOrientationRegistry.viewDidTransition(toOrientation: windowInterfaceOrientation)
      }
      self.previousInterfaceOrientation = windowInterfaceOrientation
    }
  }

  /// Finds the VC whose subtree has a react-native-screens screen with orientation set.
  /// Checks self first (the common case), then each child VC. The child-level search handles
  /// cases where an intermediate VC (e.g. DevLauncherViewController from expo-dev-client)
  /// sits between this root VC and the RNSNavigationController, blocking the single-level
  /// traversal that RNScreens' shouldAskScreensForScreenOrientation performs.
  private func vcWithRNScreenOrientation() -> UIViewController? {
    guard let screenWindowTraitsClass = NSClassFromString("RNSScreenWindowTraits") else {
      return nil
    }
    if screenWindowTraitsClass.shouldAskScreensForScreenOrientation?(in: self) ?? false {
      return self
    }
    for child in children {
      if screenWindowTraitsClass.shouldAskScreensForScreenOrientation?(in: child) ?? false {
        return child
      }
    }
    return nil
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
