import UIKit

@objc(EXSplashScreenViewProvider)
protocol SplashScreenViewProvider {
  @objc func createSplashScreenView() -> UIView
}
