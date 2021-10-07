import UIKit

@objc
class EXAppLoadingProgressWindowViewController : UIViewController {
  override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
    get {
      let visibleAppSupportedInterfaceOrientations =
        EXKernel
          .sharedInstance()
          .visibleApp
          .viewController
          .supportedInterfaceOrientations
      return visibleAppSupportedInterfaceOrientations
    }
  }
}
