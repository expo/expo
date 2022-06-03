import Foundation

public class NativeModulesProxyModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SweetProxy")
    
    Constants { () -> [String: Any?] in
      NSLog("CONST: Getting config from SweetProxy")
      // just re-use the Obj-C as we already did it there
      let cfg: [String: Any?] = self.appContext?.legacyModulesProxy?.constantsToExport() as? NSDictionary as? [String: Any?] ?? [:]
      return cfg
    }
    
    AsyncFunction("callMethod") { (moduleName: String, methodName: String, promsie: Promise) in
      // TODO
    }
  }
}
