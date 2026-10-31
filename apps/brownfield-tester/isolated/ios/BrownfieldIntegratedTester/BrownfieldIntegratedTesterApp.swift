import SwiftUI
import expoappbrownfield

@main
struct BrownfieldIntegratedTesterApp: App {
    @UIApplicationDelegateAdaptor var delegate: ExpoBrownfieldAppDelegate
    @StateObject private var expo: ExpoHost

    init() {
      let host = ExpoHost(
        turboModuleClasses: [
          "BrownfieldTestModule": NSClassFromString("BrownfieldTestModule")!
        ]
      )
      _expo = StateObject(wrappedValue: host)
      ReactNativeHostManager.shared.initialize(host: host)
    }
    var body: some Scene {
        WindowGroup {
            ContentView()
                .expoHost(expo)
        }
    }
}
