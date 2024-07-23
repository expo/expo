import Foundation
import ExpoModulesCore

public protocol ScreenOrientationController: AnyObject {
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

  public var currentScreenOrientation: UIInterfaceOrientation
  var orientationControllers: [ScreenOrientationController] = []
  var controllerInterfaceMasks: [ObjectIdentifier: UIInterfaceOrientationMask] = [:]
  @objc
  public var currentTraitCollection: UITraitCollection?
  var lastOrientationMask: UIInterfaceOrientationMask
  var rootViewController: UIViewController? {
    let keyWindow = UIApplication
      .shared
      .connectedScenes
      .flatMap { ($0 as? UIWindowScene)?.windows ?? [] }
      .last { $0.isKeyWindow }

    return keyWindow?.rootViewController
  }

  public var currentOrientationMask: UIInterfaceOrientationMask {
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

    // This is most likely already executed on the main thread, but we need to be sure
    RCTExecuteOnMainQueue {
      UIDevice.current.beginGeneratingDeviceOrientationNotifications()
    }
  }

  /**
   Called by ScreenOrientationAppDelegate in order to set initial interface orientation.
   */
  public func updateCurrentScreenOrientation() {
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
  @objc
  public func enforceDesiredDeviceOrientation(withOrientationMask orientationMask: UIInterfaceOrientationMask) {
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

  public func setMask(_ mask: UIInterfaceOrientationMask, forController controller: any ScreenOrientationController) {
    let controllerIdentifier = ObjectIdentifier(controller)

    controllerInterfaceMasks[controllerIdentifier] = mask
    enforceDesiredDeviceOrientation(withOrientationMask: mask)
  }

  // MARK: - Getters

  /**
   Gets the orientationMask for the app. Uses an intersection of all applied orientation masks. Also used for Expo Go in EXAppViewController.
   */
  @objc
  public func requiredOrientationMask() -> UIInterfaceOrientationMask {
    if controllerInterfaceMasks.isEmpty {
      return []
    }

    // We want to apply an orientation mask which is an intersection of locks applied by the modules.
    var mask = doesDeviceHaveNotch ? UIInterfaceOrientationMask.allButUpsideDown : UIInterfaceOrientationMask.all

    for moduleMask in controllerInterfaceMasks {
      mask = mask.intersection(moduleMask.value)
    }

    return mask
  }

  // MARK: - Events

  /**
   Called by ScreenOrientationViewController when the dimensions of the view change.
   Also used for Expo Go in EXAppViewController.
   */
  @objc
  public func viewDidTransition(toOrientation orientation: UIInterfaceOrientation) {
    let currentDeviceOrientation = UIDevice.current.orientation.toInterfaceOrientation()
    let currentOrientationMask = self.rootViewController?.supportedInterfaceOrientations ?? []

    var newScreenOrientation = UIInterfaceOrientation.unknown

    // We need to deduce what is the new screen orientaiton based on currentOrientationMask and new dimensions of the view
    if orientation.isPortrait {
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
    } else if orientation.isLandscape {
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

  @objc
  public func traitCollectionDidChange(to traitCollection: UITraitCollection) {
    currentTraitCollection = traitCollection
  }

  /**
   Called at the end of the screen orientation change. Notifies the controllers about the orientation change.
   */
  func screenOrientationDidChange(_ newScreenOrientation: UIInterfaceOrientation) {
    currentScreenOrientation = newScreenOrientation

    for controller in orientationControllers {
      controller.screenOrientationDidChange(newScreenOrientation)
    }
  }

  public func registerController(_ controller: ScreenOrientationController) {
    orientationControllers.append(controller)
  }

  public func unregisterController(_ controller: ScreenOrientationController) {
    let controllerIdentifier = ObjectIdentifier(controller)

    controllerInterfaceMasks.removeValue(forKey: controllerIdentifier)
    orientationControllers.removeAll(where: { $0 === controller })
  }
}
