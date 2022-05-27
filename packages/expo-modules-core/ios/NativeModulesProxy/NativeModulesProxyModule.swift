
public class NativeModulesProxyModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SweetProxy")
    
    Constants { () -> [String: Any?] in
      let legacyRawConstants = self.legacyProxy.constantsToExport() as NSDictionary as! [String: Any?]
      return legacyRawConstants
    }
    
    AsyncFunction("callMethod") { (moduleName: String, methodName: String, promsie: Promise) in
      // TODO
    }
  }
  
  public required init(appContext: AppContext) {
    legacyProxy = LegacyNativeModulesProxy.init(appContext: appContext)
    super.init(appContext: appContext)
  }
  
  internal private(set) var legacyProxy: LegacyNativeModulesProxy
}
