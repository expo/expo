import Foundation

@objc(ABI40_0_0CardFieldManager)
class CardFieldManager: ABI40_0_0RCTViewManager {    
    override func view() -> UIView! {
        return CardFieldView()
    }
    
    override class func requiresMainQueueSetup() -> Bool {
        return false
    }
}
