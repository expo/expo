import ExpoModulesCore
import StoreKit

@ExpoModule("ExpoStoreReview")
public class StoreReviewModule: Module {
  @JS(.concurrent)
  func isAvailableAsync() async -> Bool {
    return !isRunningFromTestFlight()
  }

  @JS
  @MainActor
  func requestReview() async throws {
    guard let currentScene = getForegroundActiveScene() else {
      // If no valid foreground scene is found, throw an exception
      // as the review prompt won't be visible in background
      throw MissingCurrentWindowSceneException()
    }
    if #available(iOS 16.0, *) {
      AppStore.requestReview(in: currentScene)
    } else {
      SKStoreReviewController.requestReview(in: currentScene)
    }
  }

  @MainActor
  private func getForegroundActiveScene() -> UIWindowScene? {
    return SceneGeometry.foregroundScene()
  }

  private func isRunningFromTestFlight() -> Bool {
    #if targetEnvironment(simulator)
    return false
    #endif

    // For apps distributed through TestFlight or installed from Xcode the receipt file is named "StoreKit/sandboxReceipt"
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
