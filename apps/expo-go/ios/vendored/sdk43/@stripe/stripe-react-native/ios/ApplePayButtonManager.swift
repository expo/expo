import Foundation

@objc(ABI43_0_0ApplePayButtonManager)
class ApplePayButtonManager: ABI43_0_0RCTViewManager {
    override func view() -> UIView! {
        return ApplePayButtonView(frame: CGRect.init())
    }
    
    override class func requiresMainQueueSetup() -> Bool {
        return true
    }
}
