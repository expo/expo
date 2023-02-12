import Foundation

@objc(ABI48_0_0StripeContainerManager)
class StripeContainerManager: ABI48_0_0RCTViewManager {
    override func view() -> UIView! {
        return StripeContainerView()
    }
        
    override class func requiresMainQueueSetup() -> Bool {
        return false
    }
}
