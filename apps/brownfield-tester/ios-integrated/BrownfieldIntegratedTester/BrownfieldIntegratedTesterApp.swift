import SwiftUI
import expoappbrownfield

@main
struct BrownfieldIntegratedTesterApp: App {
    @UIApplicationDelegateAdaptor var delegate: ExpoBrownfieldAppDelegate

    init() {
      ReactNativeHostManager.shared.initialize()
    }
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
