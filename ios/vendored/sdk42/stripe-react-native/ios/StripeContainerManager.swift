import Foundation

@objc(ABI42_0_0StripeContainerManager)
class StripeContainerManager: ABI42_0_0RCTViewManager {
    override func view() -> UIView! {
        return StripeContainerView()
    }
        
    override class func requiresMainQueueSetup() -> Bool {
        return false
    }
}
