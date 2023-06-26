import Foundation

@objc(ABI49_0_0AuBECSDebitFormManager)
class AuBECSDebitFormManager: ABI49_0_0RCTViewManager {
    override func view() -> UIView! {
        return AuBECSDebitFormView(frame: CGRect.init())
    }
    
    override class func requiresMainQueueSetup() -> Bool {
        return true
    }
}
