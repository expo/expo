import Foundation

@objc(AuBECSDebitFormManager)
class AuBECSDebitFormManager: RCTViewManager {
    override func view() -> UIView! {
        return AuBECSDebitFormView(frame: CGRect.init())
    }
    
    override class func requiresMainQueueSetup() -> Bool {
        return true
    }
}
