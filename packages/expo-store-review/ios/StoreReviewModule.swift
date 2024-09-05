import ExpoModulesCore
import StoreKit

public class StoreReviewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoStoreReview")

    AsyncFunction("isAvailableAsync") { () -> Bool in
      return !isRunningFromTestFlight()
    }

    AsyncFunction("requestReview") {
      Task { @MainActor in
        if #available(iOS 16.0, *) {
          guard let currentScene = getForegroundActiveScene() else {
            throw MissingCurrentWindowSceneException()
          }
          
          AppStore.requestReview(in: currentScene)
        } else if #available(iOS 14.0, *) {
          guard let currentScene = getForegroundActiveScene() else {
            throw MissingCurrentWindowSceneException()
          }
          
          SKStoreReviewController.requestReview(in: currentScene)
        } else {
          SKStoreReviewController.requestReview()
        }
      }
    }
  }
  
  private func getForegroundActiveScene() -> UIWindowScene? {
    return UIApplication.shared.connectedScenes.first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene
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
