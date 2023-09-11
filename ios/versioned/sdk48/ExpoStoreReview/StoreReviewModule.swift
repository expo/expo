import ABI48_0_0ExpoModulesCore
import StoreKit

public class StoreReviewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoStoreReview")

    AsyncFunction("isAvailableAsync") { () -> Bool in
      return true
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
}
