import ExpoModulesCore

public class ExpoLiquidGlassConstantsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoLiquidGlassConstants")

    Constant("isLiquidGlassAvailable") {
      #if compiler(>=6.2)  // Xcode 26
      if #available(iOS 26.0, tvOS 26.0, macOS 26.0, *) {  // iOS 26
        if let infoPlist = Bundle.main.infoDictionary,
          let requiresCompatibility = infoPlist["UIDesignRequiresCompatibility"] as? Bool {
          // TODO(@uabx): Add a check for maximum SDK version when apple disables this flag
          return !requiresCompatibility  // If the app requires compatibility then it will not use liquid glass
        }
        return true
      }
      #endif
      return false
    }
  }
}
