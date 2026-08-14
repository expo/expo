import ExpoModulesCore

let defaultScreenOrientationMaskKey = "EXDefaultScreenOrientationMask"
let supportedOrientationsKey = "UISupportedInterfaceOrientations"
let ipadSupportedOrientationsKey = "UISupportedInterfaceOrientations~ipad"

class ScreenOrientationViewController: UIViewController {
  let screenOrientationRegistry = ScreenOrientationRegistry.shared
  private var defaultOrientationMask: UIInterfaceOrientationMask
  private var previousInterfaceOrientation: UIInterfaceOrientation = .unknown
  private var windowInterfaceOrientation: UIInterfaceOrientation? {
    let orientation = SceneGeometry.interfaceOrientation(for: view)
    return orientation == .unknown ? nil : orientation
  }

  init(defaultOrientationMask: UIInterfaceOrientationMask = doesDeviceHaveNotch ? .allButUpsideDown : .all) {
    self.defaultOrientationMask = defaultOrientationMask
    super.init(nibName: nil, bundle: nil)

    // traitCollectionDidChange doesn't fire for every geometry change, such as a window resized
    // within one size class, so seed the registry here to have a value ready for the module's
    // didUpdateDimensionsEvent.
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
      // react-native-screens has per-screen orientation set. Defer to that VC's
      // supportedInterfaceOrientations so RNScreens' swizzled implementation can
      // resolve the active screen's orientation mask. When the matching VC is
      // self, call super to avoid recursing into this override.
      if vc === self {
        return super.supportedInterfaceOrientations
      }
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
  /// Checks self first (the common case), then walks the containment hierarchy. This handles
  /// wrappers such as DevLauncherViewController without depending on their exact nesting depth.
  private func vcWithRNScreenOrientation() -> UIViewController? {
    guard let screenWindowTraitsClass = NSClassFromString("RNSScreenWindowTraits") else {
      return nil
    }

    func shouldAskScreensForOrientation(in viewController: UIViewController) -> Bool {
      return screenWindowTraitsClass
        .shouldAskScreensForScreenOrientation?(in: viewController) ?? false
    }

    func activeChildren(of viewController: UIViewController) -> [UIViewController] {
      if let navigationController = viewController as? UINavigationController {
        var children: [UIViewController] = []
        if let topViewController = navigationController.topViewController {
          children.append(topViewController)
        }
        if let visibleViewController = navigationController.visibleViewController,
           !children.contains(where: { $0 === visibleViewController }) {
          // The caller searches in reverse, so a presented modal is checked before the route
          // underneath it while the route remains eligible to own the orientation.
          children.append(visibleViewController)
        }
        return children
      }
      if let tabBarController = viewController as? UITabBarController {
        return tabBarController.selectedViewController.map { [$0] } ?? []
      }
      if let pageViewController = viewController as? UIPageViewController {
        return pageViewController.viewControllers ?? []
      }
      if let splitViewController = viewController as? UISplitViewController {
        return splitViewController.viewControllers.filter { $0.viewIfLoaded?.window != nil }
      }
      if viewController.children.count == 1 {
        return viewController.children
      }
      // Unknown wrappers do not expose an active-child API. Only follow children whose views
      // are currently attached, so retained off-screen controllers cannot supply the mask.
      return viewController.children.filter { $0.viewIfLoaded?.window != nil }
    }

    func findOrientationOwner(in viewController: UIViewController) -> UIViewController? {
      // Prefer the active descendant over a broad container. The RNScreens predicate inspects
      // a container's last child, which is not necessarily active for every UIKit container.
      let children = activeChildren(of: viewController)
      for child in children.reversed() {
        if let owner = findOrientationOwner(in: child) {
          return owner
        }
      }
      // Only query the parent when the last child that RNScreens will inspect is active.
      // Otherwise its predicate can select a retained, off-screen navigation branch.
      if let inspectedChild = viewController.children.last,
         children.contains(where: { $0 === inspectedChild }),
         shouldAskScreensForOrientation(in: viewController) {
        return viewController
      }
      return nil
    }

    if shouldAskScreensForOrientation(in: self) {
      return self
    }
    for child in activeChildren(of: self).reversed() {
      if let owner = findOrientationOwner(in: child) {
        return owner
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
