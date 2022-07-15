import Foundation

@objc(ABI46_0_0AuBECSDebitFormManager)
class AuBECSDebitFormManager: ABI46_0_0RCTViewManager {
    override func view() -> UIView! {
        return AuBECSDebitFormView(frame: CGRect.init())
    }
    
    override class func requiresMainQueueSetup() -> Bool {
        return true
    }
}
