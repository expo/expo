import ExpoModulesCore

public class ScreenOrientationModule: Module, OrientationListener {
  static let didUpdateDimensionsEvent = "expoDidUpdateDimensions"

  let screenOrientationRegistry = ScreenOrientationRegistry.shared
  var eventEmitter: EXEventEmitterService?

  public func definition() -> ModuleDefinition {
    Name("ExpoScreenOrientation")

    Events("expoDidUpdateDimensions")

    AsyncFunction("lockAsync") { (orientationLock: ModuleOrientationLock, promise: Promise) in
      let orientationMask = orientationLock.toInterfaceOrientationMask()
      guard !orientationMask.isEmpty else {
        promise.reject(InvalidOrientationLockException())
        return
      }

      if !orientationMask.isSupportedByDevice() {
        promise.reject(UnsupportedOrientationLockException("\(orientationLock.rawValue)"))
        return
      }
      screenOrientationRegistry.setMask(orientationMask, forModule: self)
      promise.resolve()
    }

    AsyncFunction("lockPlatformAsync") { (allowedOrientations: [ModuleOrientation], promise: Promise) in
      var allowedOrientationsMask: UIInterfaceOrientationMask = []
      for allowedOrientation in allowedOrientations {
        let orientation = allowedOrientation.toInterfaceOrientation()
        let orientationMask = orientation.toInterfaceOrientationMask()
        if orientationMask == nil {
          promise.reject(InvalidOrientationLockException())
          return
        }

        allowedOrientationsMask.insert(orientationMask)
      }

      if !allowedOrientationsMask.isSupportedByDevice() {
        promise.reject(UnsupportedOrientationLockException(nil))
        return
      }

      screenOrientationRegistry.setMask(allowedOrientationsMask, forModule: self)
      promise.resolve()
    }

    AsyncFunction("getOrientationLockAsync") { (promise: Promise) in
      promise.resolve(ModuleOrientationLock.from(mask: screenOrientationRegistry.currentOrientationMask).rawValue)
    }

    AsyncFunction("getPlatformOrientationLockAsync") {(promise: Promise) in
      let orientationMask = screenOrientationRegistry.currentOrientationMask
      var allowedOrientations: [Int?] = []
      let orientationMasks: [UIInterfaceOrientationMask] = [.portrait, .portraitUpsideDown, .landscapeLeft, .landscapeRight]

      // If the particular orientation is supported, we add it to the array of allowedOrientations
      for wrappedSingleOrientation in orientationMasks {
        let supportedOrientationMask = orientationMask.intersection(UIInterfaceOrientationMask(rawValue: wrappedSingleOrientation.rawValue))
        if !supportedOrientationMask.isEmpty {
          let supportedOrientation = supportedOrientationMask.toUIInterfaceOrientation()
          allowedOrientations.append(ModuleOrientation.from(orientation: supportedOrientation).rawValue)
        }
      }
      promise.resolve(allowedOrientations)
    }

    AsyncFunction("supportsOrientationLockAsync") {(orientationLock: ModuleOrientationLock, promise: Promise) in
      let orientationMask = orientationLock.toInterfaceOrientationMask()
      promise.resolve(!orientationMask.isEmpty && orientationMask.isSupportedByDevice())
    }

    AsyncFunction("getOrientationAsync") {(promise: Promise) in
      promise.resolve(ModuleOrientation.from(orientation: screenOrientationRegistry.currentScreenOrientation).rawValue)
    }

    OnCreate {
      // TODO: This shouldn't be here, but it temporarily fixes
      // https://github.com/expo/expo/issues/13641 and https://github.com/expo/expo/issues/11558
      // We're going to redesign this once we drop support for multiple apps being open in Expo Go at the same time.
      // Then we probably won't need the screen orientation registry at all. (@tsapeta)
      screenOrientationRegistry.moduleDidForeground(self)
    }

    OnStartObserving {
      screenOrientationRegistry.registerModuleToReceiveNotification(self)
    }

    OnStopObserving {
      screenOrientationRegistry.unregisterModuleFromReceivingNotification(self)
    }

    OnAppEntersForeground {
      screenOrientationRegistry.moduleDidForeground(self)
    }

    OnAppEntersBackground {
      screenOrientationRegistry.moduleDidBackground(self)
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
      ]
    ])
  }
}
