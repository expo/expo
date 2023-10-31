import ExpoModulesCore

// TODO: AppDelegate subscriber is probably cleaner.
public class WinterModule: Module {
    
    public required init(appContext: AppContext) {
        super.init(appContext: appContext)
        NotificationCenter.default.addObserver(self, selector: #selector(loadPolyfills), name: NSNotification.Name("RCTBridgeDidDownloadScriptNotification"), object: nil)
    }
    
    @objc func loadPolyfills() {
        guard let bridge = self.appContext?.reactBridge else {
            return
        }
        
        // Iterate all files in the builtins.bundle resource folder and load them
        let fileManager = FileManager.default
        if let jsModulesURL = Bundle.main.url(
            forResource: "builtins",
            withExtension: "bundle") {
            do {
                let jsModules = try fileManager.contentsOfDirectory(atPath: jsModulesURL.path)
                
                // Filter the jsModules to get only `.hbc` files
                let hbcModulesUnsorted = jsModules.filter { $0.hasSuffix(".hbc") }
                
                // Sort the modules alphabetically
                let hbcModules = hbcModulesUnsorted.sorted()
                
                var loadedModuleCount = 0
                
                for jsModule in hbcModules {
                    print("Loading \(jsModule)")

                    bridge.loadAndExecuteSplitBundleURL(jsModulesURL.appendingPathComponent(jsModule), onError: { error in
                        print("Failed \(jsModule)")
                    }, onComplete: {
                        print("Loaded \(jsModule)")
                        loadedModuleCount += 1
                        // Check if all modules have been loaded
                        if loadedModuleCount == hbcModules.count {
                            //                            self.enqueueSetupFunction()
                        }
                    })
                }
            } catch {
                print("Error reading the directory: \(error)")
            }
        }
    }
    
    public func definition() -> ModuleDefinition {
        Name("Winter")
    }
}
