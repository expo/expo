import Foundation

@objc(ABI47_0_0StripeContainerManager)
class StripeContainerManager: ABI47_0_0RCTViewManager {
    override func view() -> UIView! {
        return StripeContainerView()
    }
        
    override class func requiresMainQueueSetup() -> Bool {
        return false
    }
}
