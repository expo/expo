import Foundation

@objc(CardFieldManager)
class CardFieldManager: RCTViewManager {    
    override func view() -> UIView! {
        return CardFieldView()
    }
    
    override class func requiresMainQueueSetup() -> Bool {
        return false
    }
}
