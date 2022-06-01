import Foundation

public class NativeModulesProxyModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SweetProxy")
    
    Constants { () -> [String: Any?] in
      NSLog("CONST: Getting config from SweetProxy")
//      var legacyConfig: [String: [String: Any]] = self.appContext?
//        .legacyModulesProxy?.
//        .legacyModulesConfig
//        .mutableCopy() as! NSDictionary as? [String: [String: Any]] ?? [:]
//      let expoModuleConfig = self.appContext?.expoModulesConfig ?? [:]
//
//      let modulesConstants = legacyConfig["modulesConstants"].merging(expoModuleConfig["exportedModulesConstants"]) {
//        (_, new) in new
//      }
//      config["modulesConstants"] = expoModuleConfig["exportedModulesConstants"]
//      config["exportedMethods"] = expoModuleConfig["exportedFunctionNames"]
//      config["viewManagersMetadata"] = expoModuleConfig["viewManagersMetadata"]
//      return config
      
      // ok, forget it, merging NSDicts in swift is too cumbersome
      // just re-use the Obj-C as we already did it there
      let cfg: [String: Any?] = self.appContext?.legacyModulesProxy?.constantsToExport() as? NSDictionary as? [String: Any?] ?? [:]
      return cfg
    }
    
    AsyncFunction("callMethod") { (moduleName: String, methodName: String, promsie: Promise) in
      // TODO
    }
  }
}
