import ExpoModulesCore
import StoreKit

public class StoreReviewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoStoreReview")

    AsyncFunction("isAvailableAsync") { () -> Bool in
      return !isRunningFromTestFlight()
    }

//    AsyncFunction("requestReview") {
//      try await MainActor.run {
//        guard let currentScene = getForegroundActiveScene() else {
//          // If no valid foreground scene is found, throw an exception
//          // as the review prompt won't be visible in background
//          throw MissingCurrentWindowSceneException()
//        }
//        if #available(iOS 16.0, *) {
//          AppStore.requestReview(in: currentScene)
//        } else {
//          SKStoreReviewController.requestReview(in: currentScene)
//        }
//      }
//    }
  }

  private func getForegroundActiveScene() -> UIWindowScene? {
    // First try to find a foreground active scene
    if let activeScene = UIApplication.shared.connectedScenes.first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene {
      return activeScene
    }

    // If no foreground active scene is found (e.g., app is in App Switcher),
    // try to find any foreground inactive scene
    if let foregroundScene = UIApplication.shared.connectedScenes.first(where: {
      $0.activationState == .foregroundInactive
    }) as? UIWindowScene {
      return foregroundScene
    }

    // If no valid foreground scene is found, return nil
    return nil
  }

  private func isRunningFromTestFlight() -> Bool {
    #if targetEnvironment(simulator)
    return false
    #endif

    // For apps distributed through TestFlight or intalled from Xcode the receipt file is named "StoreKit/sandboxReceipt"
    // instead of "StoreKit/receipt"
    let isSandboxEnv = Bundle.main.appStoreReceiptURL?.lastPathComponent == "sandboxReceipt"

    // Apps distributed through TestFlight or the App Store will not have an embedded provisioning profile
    // Source: https://developer.apple.com/documentation/technotes/tn3125-inside-code-signing-provisioning-profiles#Profile-location
    return isSandboxEnv && !hasEmbeddedMobileProvision()
  }

  private func hasEmbeddedMobileProvision() -> Bool {
    return (Bundle.main.path(forResource: "embedded", ofType: "mobileprovision") != nil)
  }
}
