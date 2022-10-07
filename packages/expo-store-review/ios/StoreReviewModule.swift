import ExpoModulesCore
import StoreKit

public class StoreReviewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoStoreReview")

    AsyncFunction("isAvailableAsync") { () -> Bool in
      return true
    }
    
    AsyncFunction("requestReview") { (promise: Promise) -> Void in
      if #available(iOS 15, *) {
        guard let currentScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
          return promise.reject(MissingCurrentWindowSceneException())
        }    

        SKStoreReviewController.requestReview(in: currentScene)
        promise.resolve(nil)
      } else {
          SKStoreReviewController.requestReview();
          promise.resolve(nil)
        }
    }.runOnQueue(DispatchQueue.main)
  }
}
