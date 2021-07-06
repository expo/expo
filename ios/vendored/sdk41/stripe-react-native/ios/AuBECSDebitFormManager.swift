import Foundation

@objc(ABI41_0_0AuBECSDebitFormManager)
class AuBECSDebitFormManager: ABI41_0_0RCTViewManager {
    override func view() -> UIView! {
        return AuBECSDebitFormView(frame: CGRect.init())
    }
    
    override class func requiresMainQueueSetup() -> Bool {
        return true
    }
}
