import ExpoModulesCore
import StoreKit

public class StoreReviewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoStoreReview")

    AsyncFunction("isAvailableAsync") { () -> Bool in
      return !isRunningFromTestFlight()
    }

    AsyncFunction("requestReview") {
      if #available(iOS 15, *) {
        guard let currentScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
          throw MissingCurrentWindowSceneException()
        }

        SKStoreReviewController.requestReview(in: currentScene)
      } else {
        SKStoreReviewController.requestReview()
      }
    }.runOnQueue(DispatchQueue.main)
  }

  private func isRunningFromTestFlight() -> Bool {
    #if targetEnvironment(simulator)
    return false
    #endif

    return Bundle.main.appStoreReceiptURL?.lastPathComponent == "sandboxReceipt" && !hasEmbeddedMobileProvision()
  }

  private func hasEmbeddedMobileProvision() -> Bool {
    return (Bundle.main.path(forResource: "embedded", ofType: "mobileprovision") != nil)
  }
}
