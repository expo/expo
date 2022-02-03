import Foundation

@objc(ABI42_0_0AuBECSDebitFormManager)
class AuBECSDebitFormManager: ABI42_0_0RCTViewManager {
    override func view() -> UIView! {
        return AuBECSDebitFormView(frame: CGRect.init())
    }
    
    override class func requiresMainQueueSetup() -> Bool {
        return true
    }
}
