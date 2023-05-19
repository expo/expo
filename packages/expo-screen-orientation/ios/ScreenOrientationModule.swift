import ExpoModulesCore

public class ScreenOrientationModule: Module, OrientationListener {
  static let didUpdateDimensionsEvent = "expoDidUpdateDimensions"

  let screenOrientationRegistry = ScreenOrientationRegistry.shared
  var eventEmitter: EXEventEmitterService?

  public func definition() -> ModuleDefinition {
    Name("ExpoScreenOrientation")

    Events("expoDidUpdateDimensions")

    AsyncFunction("lockAsync") { (orientationLock: ModuleOrientationLock) in
      let orientationMask = orientationLock.toInterfaceOrientationMask()
      guard !orientationMask.isEmpty else {
        throw InvalidOrientationLockException()
      }

      if !orientationMask.isSupportedByDevice() {
        throw UnsupportedOrientationLockException("\(orientationLock.rawValue)")
      }
      screenOrientationRegistry.setMask(orientationMask, forModule: self)
    }

    AsyncFunction("lockPlatformAsync") { (allowedOrientations: [ModuleOrientation]) in
      var allowedOrientationsMask: UIInterfaceOrientationMask = []
      for allowedOrientation in allowedOrientations {
        let orientation = allowedOrientation.toInterfaceOrientation()
        let orientationMask = orientation.toInterfaceOrientationMask()
        if orientationMask.isEmpty {
          throw InvalidOrientationLockException()
          return
        }

        allowedOrientationsMask.insert(orientationMask)
      }

      if !allowedOrientationsMask.isSupportedByDevice() {
        throw UnsupportedOrientationLockException(nil)
        return
      }

      screenOrientationRegistry.setMask(allowedOrientationsMask, forModule: self)
    }

    AsyncFunction("getOrientationLockAsync") {
      return ModuleOrientationLock.from(mask: screenOrientationRegistry.currentOrientationMask).rawValue
    }

    AsyncFunction("getPlatformOrientationLockAsync") { () -> [Int?] in
      let orientationMask = screenOrientationRegistry.currentOrientationMask
      var allowedOrientations: [Int?] = []
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

    AsyncFunction("supportsOrientationLockAsync") {(orientationLock: ModuleOrientationLock) -> Bool in
      let orientationMask = orientationLock.toInterfaceOrientationMask()
      return !orientationMask.isEmpty && orientationMask.isSupportedByDevice()
    }

    AsyncFunction("getOrientationAsync") {
      return ModuleOrientation.from(orientation: screenOrientationRegistry.currentScreenOrientation).rawValue
    }

    OnStartObserving {
      screenOrientationRegistry.registerModuleToReceiveNotification(self)
    }

    OnStopObserving {
      screenOrientationRegistry.unregisterModuleFromReceivingNotification(self)
    }

    OnDestroy {
      screenOrientationRegistry.unregisterModuleFromReceivingNotification(self)
      screenOrientationRegistry.moduleWillDeallocate(self)
    }
  }

  func screenOrientationDidChange(_ orientation: UIInterfaceOrientation) {
    guard let currentTraitCollection = screenOrientationRegistry.currentTraitCollection else {
      return
    }

    sendEvent(ScreenOrientationModule.didUpdateDimensionsEvent, [
      "orientationLock": ModuleOrientationLock.from(mask: screenOrientationRegistry.currentOrientationMask).rawValue,
      "orientationInfo": [
        "orientation": ModuleOrientation.from(orientation: orientation).rawValue,
        "verticalSizeClass": currentTraitCollection.verticalSizeClass,
        "horizontalSizeClass": currentTraitCollection.horizontalSizeClass
      ] as [String: Any]
    ])
  }
}
