import Foundation
import ExpoModulesCore
protocol OrientationListener {
  func screenOrientationDidChange(_ orientation: UIInterfaceOrientation)
}
// Modules are AnyObject, which is not hashable. We are using a dictionary (moduleInterfaceMasks), where modules are keys.
// This class allows using them as keys, it is similar to how NSMapTable NSMapTable<id, NSNumber *> *moduleInterfaceMasks; works in objective-c
class ObjectIdentifierHashable: Hashable {
  let value: AnyObject
  init(_ value: AnyObject) {
    self.value = value
  }
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(value))
  }
  static func == (lhs: ObjectIdentifierHashable, rhs: ObjectIdentifierHashable) -> Bool {
    return ObjectIdentifier(lhs.value) == ObjectIdentifier(rhs.value)
  }

  // A wrapper function that converts an AnyObject to an ObjectIdentifierHashable
  static func wrap(_ value: AnyObject) -> ObjectIdentifierHashable {
    return ObjectIdentifierHashable(value)
  }
}

class ScreenOrientationRegistry: NSObject, UIApplicationDelegate {
  static let shared = ScreenOrientationRegistry()

  var currentScreenOrientation: UIInterfaceOrientation
  var notificationListeners: NSPointerArray = NSPointerArray()
  var moduleInterfaceMasks: [ObjectIdentifierHashable: UInt] = [:]
  weak var foregroundedModule: AnyObject?
  weak var currentTraitCollection: UITraitCollection?
  var lastOrientationMask: UIInterfaceOrientationMask

  var currentOrientationMask: UIInterfaceOrientationMask {
    var currentOrientationMask = requiredOrientationMask()
    EXUtilities.performSynchronously {
      currentOrientationMask = UIApplication.shared.keyWindow?.rootViewController?.supportedInterfaceOrientations ?? []
    }
    return currentOrientationMask
  }

  private override init() {
    self.currentScreenOrientation = .unknown
    self.notificationListeners = NSPointerArray.weakObjects()
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
    // This should already be executed on the main thread.
    // However, it's safer to ensure that we are on a good thread.
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
    // if current sreen orientation isn't part of the mask, we have to change orientation to default one included in mask, in order up-left-right-down
    if !doesOrientationMask(orientationMask, contain: currentScreenOrientation) {
      var newOrientation = defaultOrientation(for: orientationMask)
      if newOrientation != .unknown {
        DispatchQueue.main.async { [weak self] in
          guard let self = self else {
            return
          }

          UIDevice.current.setValue(newOrientation.rawValue, forKey: "orientation")
          UIViewController.attemptRotationToDeviceOrientation()
          if self.currentScreenOrientation == .unknown {
            self.screenOrientationDidChange(newOrientation)
          }
        }
      }
    }
  }

  func setMask(_ mask: UIInterfaceOrientationMask, forModule module: AnyObject) {
    moduleInterfaceMasks[.wrap(module)] = mask.rawValue

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

  func handleDeviceOrientationChange(_ notification: Notification) {
    let newScreenOrientation = interfaceOrientation(from: UIDevice.current.orientation)
    interfaceOrientationDidChange(newScreenOrientation)
  }

  func interfaceOrientationDidChange(_ newScreenOrientation: UIInterfaceOrientation) {
    UIApplication.shared.keyWindow?.windowLevel = .statusBar
    if currentScreenOrientation == newScreenOrientation || newScreenOrientation == .unknown {
      return
    }

    // checks if screen orientation should be changed when user rotates the device
    if doesOrientationMask(currentOrientationMask, contain: newScreenOrientation) {
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
    let currentDeviceOrientation = interfaceOrientation(from: UIDevice.current.orientation)
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
      // From trait collection, we know that screen is in landspace left or right orientation.
      let landscapeMask = currentOrientationMask.intersection(.landscape)

      // Mask allows only proper landspace - we know that the device is in either proper landspace left or right
      // we deduce it is proper left.
      if landscapeMask == .landscapeLeft {
        newScreenOrientation = .landscapeLeft
      }
      // Mask allows only upside down portrait - we know that the device is in either proper portrait or upside down
      // we deduce it is upside right.
      else if landscapeMask == .landscapeRight {
        newScreenOrientation = .landscapeRight
      }
      // Mask allows landspace left or right - we can try to deduce orientation
      // from device orientation.
      else if currentDeviceOrientation == .landscapeLeft || currentDeviceOrientation == .landscapeRight {
        newScreenOrientation = currentDeviceOrientation
      }
    }
    screenOrientationDidChange(newScreenOrientation)
  }

  func screenOrientationDidChange(_ newScreenOrientation: UIInterfaceOrientation) {
    currentScreenOrientation = newScreenOrientation
    for module in notificationListeners.allObjects {
      guard let module = (module as? ScreenOrientationModule) else {
        continue
      }
      module.screenOrientationDidChange(newScreenOrientation)
    }
  }

  @objc func handleDeviceOrientationChange(notification: Notification) {
    let newScreenOrientation = interfaceOrientation(from: UIDevice.current.orientation)
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

    if foregroundedModule.isEqual(to: module) {
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
    notificationListeners.addPointer(Unmanaged.passUnretained(module).toOpaque())
  }

  func unregisterModuleFromReceivingNotification(_ module: ScreenOrientationModule) {
    for i in (0..<notificationListeners.count).reversed() {
      let pointer = notificationListeners.pointer(at: i)
      if pointer == Unmanaged.passUnretained(module).toOpaque() || pointer == nil {
        notificationListeners.removePointer(at: i)
      }
    }
    notificationListeners.compact()
  }
}
