import ExpoModulesCore

public class SplashScreenModule: Module {
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
  }
}
