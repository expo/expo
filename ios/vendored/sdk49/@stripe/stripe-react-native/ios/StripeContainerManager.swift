import Foundation

@objc(ABI49_0_0StripeContainerManager)
class StripeContainerManager: ABI49_0_0RCTViewManager {
    override func view() -> UIView! {
        return StripeContainerView()
    }
        
    override class func requiresMainQueueSetup() -> Bool {
        return false
    }
}
