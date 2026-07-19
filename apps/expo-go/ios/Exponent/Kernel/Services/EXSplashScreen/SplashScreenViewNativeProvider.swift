import UIKit

@objc(EXSplashScreenViewNativeProvider)
class SplashScreenViewNativeProvider: NSObject, SplashScreenViewProvider {
  func createSplashScreenView() -> UIView {
    let fileName: String = Bundle.main.infoDictionary?["UILaunchStoryboardName"] as? String ?? "SplashScreen"
    let storyboard = UIStoryboard.init(name: fileName, bundle: nil)
    guard let vc = storyboard.instantiateInitialViewController() else {
      return UIView()
    }
    return vc.view
  }
}
