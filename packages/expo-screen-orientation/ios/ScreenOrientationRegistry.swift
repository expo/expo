import Foundation
import ExpoModulesCore

protocol OrientationListener {
  func screenOrientationDidChange(_ orientation: UIInterfaceOrientation)
}

/**
 This singleton that holds information about desired orientation for every app which uses expo-screen-orientation.
 Marked @objc and public, because this it is also used in EXAppViewController.
 */
@objc
public class ScreenOrientationRegistry: NSObject, UIApplicationDelegate {
  @objc
  public static let shared = ScreenOrientationRegistry()

  var currentScreenOrientation: UIInterfaceOrientation
  var orientationListeners: [ScreenOrientationModule?] = []
  var moduleInterfaceMasks: [ScreenOrientationModule: UIInterfaceOrientationMask] = [:]
  weak var currentTraitCollection: UITraitCollection?
  var lastOrientationMask: UIInterfaceOrientationMask
  var rootViewController: UIViewController? {
    let keyWindow = UIApplication
      .shared
      .connectedScenes
      .flatMap { ($0 as? UIWindowScene)?.windows ?? [] }
      .last { $0.isKeyWindow }

    return keyWindow?.rootViewController
  }

  var currentOrientationMask: UIInterfaceOrientationMask {
    var currentOrientationMask: UIInterfaceOrientationMask = []

    EXUtilities.performSynchronously {
      currentOrientationMask = self.rootViewController?.supportedInterfaceOrientations ?? []
    }
    return currentOrientationMask
  }

  private override init() {
    self.currentScreenOrientation = .unknown
    self.currentTraitCollection = nil
    self.lastOrientationMask = []

    super.init()

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(self.handleDeviceOrientationChange(notification:)),
      name: UIDevice.orientationDidChangeNotification,
      object: UIDevice.current
    )

    // This is most likely already executed on the main thread, but we need to be sure
    RCTExecuteOnMainQueue {
      UIDevice.current.beginGeneratingDeviceOrientationNotifications()
    }
  }

  /**
   Called by ScreenOrientationAppDelegate in order to set initial interface orientation.
   */
  func updateCurrentScreenOrientation() {
    let windows = UIApplication.shared.windows
    if !windows.isEmpty {
      self.currentScreenOrientation = windows[0].windowScene?.interfaceOrientation ?? .unknown
    }
  }

  deinit {
    EXUtilities.performSynchronously {
      UIDevice.current.endGeneratingDeviceOrientationNotifications()
    }
  }

  // MARK: - Affecting screen orientation

  /**
   Rotates the view to currentScreenOrientation or default orientation from the orientationMask.
   */
  func enforceDesiredDeviceOrientation(withOrientationMask orientationMask: UIInterfaceOrientationMask) {
    var newOrientation = orientationMask.defaultOrientation()

    if orientationMask.contains(currentScreenOrientation) {
      newOrientation = currentScreenOrientation
    }

    guard newOrientation != .unknown else {
      return
    }

    RCTExecuteOnMainQueue { [weak self] in
      guard let self = self else {
        return
      }

      if #available(iOS 16.0, *) {
        let windowScene = self.rootViewController?.view.window?.windowScene
        windowScene?.requestGeometryUpdate(.iOS(interfaceOrientations: orientationMask))
        self.rootViewController?.setNeedsUpdateOfSupportedInterfaceOrientations()
      } else {
        UIDevice.current.setValue(newOrientation.rawValue, forKey: "orientation")
        UIViewController.attemptRotationToDeviceOrientation()
      }

      if self.currentScreenOrientation == .unknown {
        // CurrentScreenOrientation might be unknown (especially just after launch), but at this point we already know it.
        // Later the currentScreenOrientation will be updated by the iOS orientation change notifications.
        self.screenOrientationDidChange(newOrientation)
      }
    }
  }

  func setMask(_ mask: UIInterfaceOrientationMask, forModule module: ScreenOrientationModule) {
    moduleInterfaceMasks[module] = mask
    enforceDesiredDeviceOrientation(withOrientationMask: mask)
  }

  // MARK: - Getters

  /**
   Gets the orientationMask for the app. Uses an intersection of all applied orientation masks. Also used for Expo Go in EXAppViewController.
   */
  @objc
  public func requiredOrientationMask() -> UIInterfaceOrientationMask {
    if moduleInterfaceMasks.isEmpty {
      return []
    }

    // We want to apply an orientation mask which is an intersection of locks applied by the modules.
    var mask = doesDeviceHaveNotch ? UIInterfaceOrientationMask.allButUpsideDown : UIInterfaceOrientationMask.all

    for moduleMask in moduleInterfaceMasks {
      mask = mask.intersection(moduleMask.value)
    }

    return mask
  }

  // MARK: - Events

  /**
   Called when the OS sends an OrientationDidChange notification.
   */
  @objc
  func handleDeviceOrientationChange(notification: Notification) {
    let newScreenOrientation = UIDevice.current.orientation.toInterfaceOrientation()

    interfaceOrientationDidChange(newScreenOrientation)
  }

  /**
   Called when the device is physically rotated. Checks if screen orientation should be changed after user rotated the device.
   */
  func interfaceOrientationDidChange(_ newScreenOrientation: UIInterfaceOrientation) {
    if currentScreenOrientation == newScreenOrientation || newScreenOrientation == .unknown {
      return
    }

    if currentOrientationMask.contains(newScreenOrientation) {
      // when changing orientation without changing dimensions traitCollectionDidChange isn't triggered so the event has to be called manually
      if (newScreenOrientation.isPortrait && currentScreenOrientation.isPortrait)
        || (newScreenOrientation.isLandscape && currentScreenOrientation.isLandscape) {
        screenOrientationDidChange(newScreenOrientation)
        return
      }

      // on iPads, traitCollectionDidChange isn't triggered at all, so we have to call screenOrientationDidChange manually
      if isPad()
        && (newScreenOrientation.isPortrait && currentScreenOrientation.isLandscape
        || newScreenOrientation.isLandscape && currentScreenOrientation.isPortrait) {
        screenOrientationDidChange(newScreenOrientation)
      }
    }
  }

  /**
   Called by ScreenOrientationViewController when the dimensions of the view change.
   Also used for Expo Go in EXAppViewController.
   */
  @objc
  public func traitCollectionDidChange(to traitCollection: UITraitCollection) {
    currentTraitCollection = traitCollection

    let currentDeviceOrientation = UIDevice.current.orientation.toInterfaceOrientation()
    let currentOrientationMask = self.rootViewController?.supportedInterfaceOrientations ?? []

    var newScreenOrientation = UIInterfaceOrientation.unknown

    // We need to deduce what is the new screen orientaiton based on currentOrientationMask and new dimensions of the view
    if traitCollection.isPortrait() {
      // From trait collection, we know that screen is in portrait or upside down orientation.
      let portraitMask = currentOrientationMask.intersection([.portrait, .portraitUpsideDown])

      if portraitMask == .portrait {
        // Mask allows only proper portrait - we know that the device is in either proper portrait or upside down
        // we deduce it is proper portrait.
        newScreenOrientation = .portrait
      } else if portraitMask == .portraitUpsideDown {
        // Mask allows only upside down portrait - we know that the device is in either proper portrait or upside down
        // we deduce it is upside down portrait.
        newScreenOrientation = .portraitUpsideDown
      } else if currentDeviceOrientation == .portrait || currentDeviceOrientation == .portraitUpsideDown {
        // Mask allows portrait or upside down portrait - we can try to deduce orientation
        // from device orientation.
        newScreenOrientation = currentDeviceOrientation
      }
    } else if traitCollection.isLandscape() {
      // From trait collection, we know that screen is in landscape left or right orientation.
      let landscapeMask = currentOrientationMask.intersection(.landscape)

      if landscapeMask == .landscapeLeft {
        // Mask allows only proper landscape - we know that the device is in either proper landscape left or right
        // we deduce it is proper left.
        newScreenOrientation = .landscapeLeft
      } else if landscapeMask == .landscapeRight {
        // Mask allows only landscape right - we know that the device is in either proper landscape left or right
        // we deduce it is landscape right.
        newScreenOrientation = .landscapeRight
      } else if currentDeviceOrientation == .landscapeLeft || currentDeviceOrientation == .landscapeRight {
        // Mask allows landscape left or right - we can try to deduce orientation
        // from device orientation.
        newScreenOrientation = currentDeviceOrientation
      } else if currentDeviceOrientation == .portrait || currentDeviceOrientation == .portraitUpsideDown {
        // If the desired orientation is .landscape but the device is in .portrait orientation it will rotate to .landscapeRight
        newScreenOrientation = .landscapeRight
      }
    }
    screenOrientationDidChange(newScreenOrientation)
  }

  /**
   Called at the end of the screen orientation change. Notifies modules about the orientation change.
   */
  func screenOrientationDidChange(_ newScreenOrientation: UIInterfaceOrientation) {
    currentScreenOrientation = newScreenOrientation
    for module in orientationListeners {
      module?.screenOrientationDidChange(newScreenOrientation)
    }
  }

  func moduleWillDeallocate(_ module: ScreenOrientationModule) {
    moduleInterfaceMasks.removeValue(forKey: module)
  }

  func registerModuleToReceiveNotification(_ module: ScreenOrientationModule) {
    orientationListeners.append(module)
  }

  func unregisterModuleFromReceivingNotification(_ module: ScreenOrientationModule) {
    for i in (0..<orientationListeners.count).reversed() {
      if orientationListeners[i] === module || orientationListeners[i] == nil {
        orientationListeners.remove(at: i)
      }
    }
  }
}
