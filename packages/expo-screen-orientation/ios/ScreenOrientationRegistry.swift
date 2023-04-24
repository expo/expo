import Foundation
import ExpoModulesCore
protocol OrientationListener {
  func screenOrientationDidChange(_ orientation: UIInterfaceOrientation)
}

class ScreenOrientationRegistry: NSObject, UIApplicationDelegate {
  static let shared = ScreenOrientationRegistry()

  var currentScreenOrientation: UIInterfaceOrientation
  var notificationListeners: [AnyObject?] = []
  var moduleInterfaceMasks: [ObjectIdentifierHashable: UInt] = [:]
  weak var foregroundedModule: AnyObject?
  weak var currentTraitCollection: UITraitCollection?
  var lastOrientationMask: UIInterfaceOrientationMask

  var prefersStatusBarHidden = false
  var currentOrientationMask: UIInterfaceOrientationMask {
    var currentOrientationMask = requiredOrientationMask()
    EXUtilities.performSynchronously {
      currentOrientationMask = UIApplication.shared.keyWindow?.rootViewController?.supportedInterfaceOrientations ?? []
    }
    return currentOrientationMask
  }

  private override init() {
    self.currentScreenOrientation = .unknown
    self.currentTraitCollection = nil
    self.lastOrientationMask = UIInterfaceOrientationMask(rawValue: 0)
    super.init()

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(self.handleDeviceOrientationChange(notification:)),
      name: UIDevice.orientationDidChangeNotification,
      object: UIDevice.current
    )

    DispatchQueue.main.async {
      UIDevice.current.beginGeneratingDeviceOrientationNotifications()
    }
  }

  func updateCurrentScreenOrientation() {
    if #available(iOS 13, *) {
      let windows = UIApplication.shared.windows
      if !windows.isEmpty {
        self.currentScreenOrientation = windows[0].windowScene?.interfaceOrientation ?? .unknown
      }
    } else {
      // statusBarOrientation was deprecated in iOS 13
      self.currentScreenOrientation = UIApplication.shared.statusBarOrientation
    }
  }

  deinit {
    EXUtilities.performSynchronously {
      UIDevice.current.endGeneratingDeviceOrientationNotifications()
    }
  }

  // MARK: affecting screen orientation
  func enforceDesiredDeviceOrientation(withOrientationMask orientationMask: UIInterfaceOrientationMask) {
    var newOrientation = orientationMask.defaultOrientation()
    if orientationMask.contains(currentScreenOrientation) {
      newOrientation = currentScreenOrientation
    }
    if newOrientation != .unknown {
      DispatchQueue.main.async { [weak self] in
        guard let self = self else {
          return
        }

        if #available(iOS 16.0, *) {
          let rootViewController = UIApplication.shared.keyWindow?.rootViewController
          let windowScene = rootViewController?.view.window?.windowScene
          windowScene?.requestGeometryUpdate(.iOS(interfaceOrientations: orientationMask))
          rootViewController?.setNeedsUpdateOfSupportedInterfaceOrientations()
        } else {
          UIDevice.current.setValue(newOrientation.rawValue, forKey: "orientation")
          UIViewController.attemptRotationToDeviceOrientation()
        }
        if self.currentScreenOrientation == .unknown {
          self.screenOrientationDidChange(newOrientation)
        }
      }
    }
  }

  func setMask(_ mask: UIInterfaceOrientationMask, forModule module: AnyObject) {
    moduleInterfaceMasks[.wrap(module)] = mask.rawValue
    
    // The enforcement of device orientation in handleDeviceOrientationChange causes the status bar to animate to the side and then disappear
    // when there is no .portrait orientation in the mask but the device is rotated to portrait. Hide the status bar to make this glitch invisible to the user.
    // Note: This requires the UIViewControllerBasedStatusBarAppearance to be set to true. RNScreens might cause this setting to fail anyways.
    prefersStatusBarHidden = true;
    for mask in moduleInterfaceMasks.values{
      if (UIInterfaceOrientationMask(rawValue: mask).contains(.portrait)){
        prefersStatusBarHidden = false
        break;
      }
    }
    
    EXUtilities.performSynchronously{
      UIApplication.shared.keyWindow?.rootViewController?.setNeedsStatusBarAppearanceUpdate()
    }
    
    if foregroundedModule === module {
      enforceDesiredDeviceOrientation(withOrientationMask: mask)
    }
  }

  // MARK: getters
  func requiredOrientationMask() -> UIInterfaceOrientationMask {
    // The app is moved to the foreground.
    guard let foregroundedModule = self.foregroundedModule else {
      return lastOrientationMask
    }

    guard let current = moduleInterfaceMasks[.wrap(foregroundedModule)] else {
      return []
    }

    return UIInterfaceOrientationMask(rawValue: current)
  }

  // MARK: events
  func interfaceOrientationDidChange(_ newScreenOrientation: UIInterfaceOrientation) {
    if currentScreenOrientation == newScreenOrientation || newScreenOrientation == .unknown {
      return
    }

    // checks if screen orientation should be changed when user rotates the device
    if currentOrientationMask.contains(newScreenOrientation) {
      // change current screen orientation
      if (newScreenOrientation.isPortrait && currentScreenOrientation.isPortrait)
        || (newScreenOrientation.isLandscape && currentScreenOrientation.isLandscape) {
        currentScreenOrientation = newScreenOrientation // updates current screen orientation, but doesn't emit event
        return
      }

      // on iPads, traitCollectionDidChange isn't triggered at all
      if isIPad()
        && (newScreenOrientation.isPortrait && currentScreenOrientation.isLandscape
        || newScreenOrientation.isLandscape && currentScreenOrientation.isPortrait) {
        screenOrientationDidChange(newScreenOrientation)
      }
    }
  }

  func traitCollectionDidChange(to traitCollection: UITraitCollection) {
    currentTraitCollection = traitCollection

    let verticalSizeClass = traitCollection.verticalSizeClass
    let horizontalSizeClass = traitCollection.horizontalSizeClass
    let currentDeviceOrientation = UIDevice.current.orientation.toInterfaceOrientation()
    let currentOrientationMask = UIApplication.shared.keyWindow?.rootViewController?.supportedInterfaceOrientations ?? []

    var newScreenOrientation = UIInterfaceOrientation.unknown

    if verticalSizeClass == .regular && horizontalSizeClass == .compact {
      // From trait collection, we know that screen is in portrait or upside down orientation.
      let portraitMask = currentOrientationMask.intersection([.portrait, .portraitUpsideDown])

      // Mask allows only proper portrait - we know that the device is in either proper portrait or upside down
      // we deduce it is proper portrait.
      if portraitMask == .portrait {
        newScreenOrientation = .portrait
      }
      // Mask allows only upside down portrait - we know that the device is in either proper portrait or upside down
      // we deduce it is upside down portrait.
      else if portraitMask == .portraitUpsideDown {
        newScreenOrientation = .portraitUpsideDown
      }
      // Mask allows portrait or upside down portrait - we can try to deduce orientation
      // from device orientation.
      else if currentDeviceOrientation == .portrait || currentDeviceOrientation == .portraitUpsideDown {
        newScreenOrientation = currentDeviceOrientation
      }
    } else if (verticalSizeClass == .compact && horizontalSizeClass == .compact)
      || (verticalSizeClass == .regular && horizontalSizeClass == .regular)
      || (verticalSizeClass == .compact && horizontalSizeClass == .regular) {
      // From trait collection, we know that screen is in landscape left or right orientation.
      let landscapeMask = currentOrientationMask.intersection(.landscape)

      // Mask allows only proper landscape - we know that the device is in either proper landscape left or right
      // we deduce it is proper left.
      if landscapeMask == .landscapeLeft {
        newScreenOrientation = .landscapeLeft
      }
      // Mask allows only upside down portrait - we know that the device is in either proper portrait or upside down
      // we deduce it is upside right.
      else if landscapeMask == .landscapeRight {
        newScreenOrientation = .landscapeRight
      }
      // Mask allows landscape left or right - we can try to deduce orientation
      // from device orientation.
      else if currentDeviceOrientation == .landscapeLeft || currentDeviceOrientation == .landscapeRight {
        newScreenOrientation = currentDeviceOrientation
      }
      // If the desired orientation is .landscape but the device is in .portrait orientation it will rotate to .landscapeRight
      else if currentDeviceOrientation == .portrait || currentDeviceOrientation == .portraitUpsideDown {
        newScreenOrientation = .landscapeRight
      }
    }
    screenOrientationDidChange(newScreenOrientation)
  }

  
  func screenOrientationDidChange(_ newScreenOrientation: UIInterfaceOrientation) {
    currentScreenOrientation = newScreenOrientation
    for module in notificationListeners {
      guard let module = (module as? ScreenOrientationModule) else {
        continue
      }
      module.screenOrientationDidChange(newScreenOrientation)
    }
  }
  
  // This function is called when iOS sends and OrientationDidChangeNotification
  @objc func handleDeviceOrientationChange(notification: Notification) {
    let newScreenOrientation = UIDevice.current.orientation.toInterfaceOrientation()
    // On iOS < 16 if the device is locked in some orientation (eq. landscape) and the device is rotated to a different orientation (eq. portrait), which is not inside of the currentOrientationMask
    // our view will stay in correct orientation, but status bar and the UIDevice.current.orientation will get updated to the physical device orientation.
    // It is not possible to override this behaviour from our view controller, therefore upon receiving a notification of rotating to portrait while locked in landscape we force
    // the device to "think" it's physically in landscape.
    // This workaround also fixes some unexpected behaviours from other views (eq. SafeAreaView), which use UIDevice.orientation.current (which might be "incorrect") after the view orientation is locked.
    // On iOS 16 the API has changed and the device behaves as expected without any workarounds.
    if #unavailable(iOS 16){
      if(!currentOrientationMask.contains(newScreenOrientation)){
        enforceDesiredDeviceOrientation(withOrientationMask: self.currentScreenOrientation.toInterfaceOrientationMask())
      }
    }
    
    interfaceOrientationDidChange(newScreenOrientation)
  }
  
  // MARK: lifecycle
  func moduleDidForeground(_ module: AnyObject) {
    foregroundedModule = module
    enforceDesiredDeviceOrientation(withOrientationMask: currentOrientationMask)
  }

  func moduleDidBackground(_ module: AnyObject?) {
    guard let foregroundedModule = self.foregroundedModule else {
      if module == nil {
        lastOrientationMask = requiredOrientationMask()
      }
      return
    }

    if foregroundedModule === module {
      // We save the mask to restore it when the app moves to the foreground.
      // We don't want to wait for the module to call moduleDidForeground, cause it will add unnecessary rotation.
      lastOrientationMask = requiredOrientationMask()
      self.foregroundedModule = nil
    }
  }

  func moduleWillDeallocate(_ module: AnyObject) {
    moduleInterfaceMasks.removeValue(forKey: .wrap(module))
  }

  func registerModuleToReceiveNotification(_ module: ScreenOrientationModule) {
    notificationListeners.append(module)
  }
  
  func unregisterModuleFromReceivingNotification(_ module: ScreenOrientationModule) {
    for i in (0..<notificationListeners.count).reversed(){
      if notificationListeners[i] === module || notificationListeners[i] == nil {
        notificationListeners.remove(at: i)
      }
    }
  }
}
