import UIKit

@objc
class EXAppLoadingProgressWindowViewController: UIViewController {
  override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
    let visibleAppSupportedInterfaceOrientations = EXKernel
      .sharedInstance()
      .visibleApp
      .viewController
      .supportedInterfaceOrientations
    return visibleAppSupportedInterfaceOrientations
  }
}
