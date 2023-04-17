import ExpoModulesCore

public class ScreenOrientationModule: Module, OrientationListener {
  static let didUpdateDimensionsEvent = "expoDidUpdateDimensions"

  let screenOrientationRegistry = ScreenOrientationRegistry.shared
  var eventEmitter: EXEventEmitterService?

  public func definition() -> ModuleDefinition {
    Name("ExpoScreenOrientation")

    Events("expoDidUpdateDimensions")

    AsyncFunction("lockAsync") { (orientationLock: Int, promise: Promise) in
      let orientationMask = importOrientationLock(orientationLock)
      if orientationMask == nil {
        promise.reject(InvalidOrientationLockException())
        return
      }
      if !doesDeviceSupport(orientationMask) {
        promise.reject(UnsupportedOrientationLockException(String(orientationLock)))
        return
      }
      screenOrientationRegistry.setMask(orientationMask, forModule: self)
      promise.resolve()
    }

    AsyncFunction("lockPlatformAsync") { (allowedOrientations: [Int], promise: Promise) in
      var allowedOrientationsMask: UIInterfaceOrientationMask = []
      for allowedOrientation in allowedOrientations {
        let orientation = importOrientation(allowedOrientation)
        let orientationMask = maskFromOrientation(orientation)
        if orientationMask == nil {
          promise.reject(InvalidOrientationLockException())
          return
        }

        allowedOrientationsMask.insert(orientationMask)
      }

      if !doesDeviceSupport(allowedOrientationsMask) {
        promise.reject(UnsupportedOrientationLockException(nil))
        return
      }

      screenOrientationRegistry.setMask(allowedOrientationsMask, forModule: self)
      promise.resolve()
    }

    AsyncFunction("getOrientationLockAsync") { (promise: Promise) in
      promise.resolve(exportOrientationLock(screenOrientationRegistry.currentOrientationMask))
    }

    AsyncFunction("getPlatformOrientationLockAsync") {(promise: Promise) in
      let orientationMask = screenOrientationRegistry.currentOrientationMask
      var allowedOrientations: [Int] = []
      let orientationMasks: [UIInterfaceOrientationMask] = [.portrait, .portraitUpsideDown, .landscapeLeft, .landscapeRight]

      // If the particular orientation is supported, we add it to the array of allowedOrientations
      for wrappedSingleOrientation in orientationMasks {
        let supportedOrientationMask = orientationMask.intersection(UIInterfaceOrientationMask(rawValue: wrappedSingleOrientation.rawValue))
        if !supportedOrientationMask.isEmpty {
          let supportedOrientation = orientationMaskToOrientation(supportedOrientationMask)
          allowedOrientations.append(exportOrientation(supportedOrientation))
        }
      }
      promise.resolve(allowedOrientations)
    }

    AsyncFunction("supportsOrientationLockAsync") {(orientationLock: Int, promise: Promise) in
      let orientationMask = importOrientationLock(orientationLock)
      promise.resolve(!orientationMask.isEmpty && doesDeviceSupport(orientationMask))
    }

    AsyncFunction("getOrientationAsync") {(promise: Promise) in
      promise.resolve(exportOrientation(screenOrientationRegistry.currentScreenOrientation))
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
      "orientationLock": exportOrientationLock(screenOrientationRegistry.currentOrientationMask),
      "orientationInfo": [
        "orientation": exportOrientation(orientation),
        "verticalSizeClass": currentTraitCollection.verticalSizeClass,
        "horizontalSizeClass": currentTraitCollection.horizontalSizeClass
      ]
    ])
  }
}
