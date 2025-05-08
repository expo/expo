import ExpoModulesCore

public class ScreenOrientationModule: Module, ScreenOrientationController {
  static let didUpdateDimensionsEvent = "expoDidUpdateDimensions"
  let screenOrientationRegistry = ScreenOrientationRegistry.shared

  public func definition() -> ModuleDefinition {
    Name("ExpoScreenOrientation")

    Events(ScreenOrientationModule.didUpdateDimensionsEvent)

    AsyncFunction("lockAsync") { (orientationLock: ModuleOrientationLock) in
      let orientationMask = orientationLock.toInterfaceOrientationMask()

      guard !orientationMask.isEmpty else {
        throw InvalidOrientationLockException()
      }

      guard orientationMask.isSupportedByDevice() else {
        throw UnsupportedOrientationLockException(orientationLock)
      }

      screenOrientationRegistry.setMask(orientationMask, forController: self)
    }

    AsyncFunction("lockPlatformAsync") { (allowedOrientations: [ModuleOrientation]) in
      var allowedOrientationsMask: UIInterfaceOrientationMask = []

      for allowedOrientation in allowedOrientations {
        let orientation = allowedOrientation.toInterfaceOrientation()
        let orientationMask = orientation.toInterfaceOrientationMask()

        guard !orientationMask.isEmpty else {
          throw InvalidOrientationLockException()
        }

        allowedOrientationsMask.insert(orientationMask)
      }

      guard allowedOrientationsMask.isSupportedByDevice() else {
        throw UnsupportedOrientationLockException(nil)
      }

      screenOrientationRegistry.setMask(allowedOrientationsMask, forController: self)
    }

    AsyncFunction("getOrientationLockAsync") {
      return ModuleOrientationLock.from(mask: screenOrientationRegistry.currentOrientationMask).rawValue
    }

    AsyncFunction("getPlatformOrientationLockAsync") { () -> [Int] in
      let orientationMask = screenOrientationRegistry.currentOrientationMask
      var allowedOrientations: [Int] = []
      let orientationMasks: [UIInterfaceOrientationMask] = [.portrait, .portraitUpsideDown, .landscapeLeft, .landscapeRight]

      // If the particular orientation is supported, we add it to the array of allowedOrientations
      for wrappedSingleOrientation in orientationMasks {
        let supportedOrientationMask = orientationMask.intersection(wrappedSingleOrientation)
        if !supportedOrientationMask.isEmpty {
          let supportedOrientation = supportedOrientationMask.toUIInterfaceOrientation()
          allowedOrientations.append(ModuleOrientation.from(orientation: supportedOrientation).rawValue)
        }
      }
      return allowedOrientations
    }

    AsyncFunction("supportsOrientationLockAsync") { (orientationLock: ModuleOrientationLock) -> Bool in
      let orientationMask = orientationLock.toInterfaceOrientationMask()
      return !orientationMask.isEmpty && orientationMask.isSupportedByDevice()
    }

    AsyncFunction("getOrientationAsync") {
      return ModuleOrientation.from(orientation: screenOrientationRegistry.currentScreenOrientation).rawValue
    }

    OnCreate {
      screenOrientationRegistry.registerController(self)
    }

    OnDestroy {
      screenOrientationRegistry.unregisterController(self)
    }

    OnAppEntersForeground {
      screenOrientationRegistry.registerController(self)
    }

    OnAppEntersBackground {
      screenOrientationRegistry.unregisterController(self)
    }
  }

  // MARK: - ScreenOrientationController

  public func screenOrientationDidChange(_ orientation: UIInterfaceOrientation) {
    guard let currentTraitCollection = screenOrientationRegistry.currentTraitCollection else {
      return
    }

    sendEvent(ScreenOrientationModule.didUpdateDimensionsEvent, [
      "orientationLock": ModuleOrientationLock.from(mask: screenOrientationRegistry.currentOrientationMask).rawValue,
      "orientationInfo": [
        "orientation": ModuleOrientation.from(orientation: orientation).rawValue,
        "verticalSizeClass": currentTraitCollection.verticalSizeClass.rawValue,
        "horizontalSizeClass": currentTraitCollection.horizontalSizeClass.rawValue
      ] as [String: Any]
    ])
  }
}
