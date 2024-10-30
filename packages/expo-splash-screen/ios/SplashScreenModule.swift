import ExpoModulesCore

public class SplashScreenModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoSplashScreen")
    
    AsyncFunction("preventAutoHideAsync") {
      SplashScreenManager.shared.preventAutoHideCalled = true
    }

    Function("setOptions") { (options: SplashScreenOptions) in
      SplashScreenManager.shared.setOptions(options: options)
    }

    Function("hide") {
      SplashScreenManager.shared.hide()
    }

    AsyncFunction("hideAsync") {
      SplashScreenManager.shared.hide()
    }
  }
}
