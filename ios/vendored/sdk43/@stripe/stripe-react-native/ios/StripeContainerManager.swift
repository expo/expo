import Foundation

@objc(ABI43_0_0StripeContainerManager)
class StripeContainerManager: ABI43_0_0RCTViewManager {
    override func view() -> UIView! {
        return StripeContainerView()
    }
        
    override class func requiresMainQueueSetup() -> Bool {
        return false
    }
}
