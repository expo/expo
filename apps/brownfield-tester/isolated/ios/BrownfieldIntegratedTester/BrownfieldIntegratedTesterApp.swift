import SwiftUI
import expoappbrownfield

@main
struct BrownfieldIntegratedTesterApp: App {
    @UIApplicationDelegateAdaptor var delegate: ExpoBrownfieldAppDelegate

    init() {
      ReactNativeHostManager.shared.initialize(
        turboModuleClasses: [
          "BrownfieldTestModule": NSClassFromString("BrownfieldTestModule")!
        ]
      )
    }
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
