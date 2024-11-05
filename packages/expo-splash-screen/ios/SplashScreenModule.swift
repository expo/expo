import ExpoModulesCore

public class SplashScreenModule: Module {
  var _userControlledAutoHideEnabled = false

  public func definition() -> ModuleDefinition {
    Name("ExpoSplashScreen")

    Function("setOptions") { (options: SplashScreenOptions) in
      SplashScreenManager.shared.setOptions(options: options)
    }

    Function("hide") {
      SplashScreenManager.shared.hide()
    }

    AsyncFunction("hideAsync") {
      SplashScreenManager.shared.hide()
    }

    AsyncFunction("_internal_maybeHideAsync") {
      if !_userControlledAutoHideEnabled {
        SplashScreenManager.shared.hide()
      }
    }

    AsyncFunction("preventAutoHideAsync") {
      // The user has manually invoked prevent autohide, this is used to allow libraries
      // such as expo-router to know whether it's safe to hide or if they should wait for
      // the user to do it.
      _userControlledAutoHideEnabled = true
      SplashScreenManager.shared.preventAutoHideCalled = true
    }

    AsyncFunction("_internal_preventAutoHideAsync") {
      SplashScreenManager.shared.preventAutoHideCalled = true
    }

    OnDestroy {
      SplashScreenManager.shared.removeObservers()
    }
  }
}
