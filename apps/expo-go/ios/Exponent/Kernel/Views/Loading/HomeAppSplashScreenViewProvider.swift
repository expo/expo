import UIKit

@objc(EXHomeAppSplashScreenViewProvider)
class HomeAppSplashScreenViewProvider: SplashScreenViewNativeProvider {
  override func createSplashScreenView() -> UIView {
    let splashScreenView = super.createSplashScreenView()
    if let activityIndicatorView = splashScreenView.viewWithTag(1) as? UIActivityIndicatorView {
      activityIndicatorView.startAnimating()
    }
    
    return splashScreenView
  }
}
