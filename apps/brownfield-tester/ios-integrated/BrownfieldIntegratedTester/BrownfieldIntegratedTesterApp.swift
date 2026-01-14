import SwiftUI
import minimaltesterbrownfield

@main
struct BrownfieldIntegratedTesterApp: App {
    @UIApplicationDelegateAdaptor var delegate: BrownfieldAppDelegate

    init() {
      ReactNativeHostManager.shared.initialize()
    }
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
