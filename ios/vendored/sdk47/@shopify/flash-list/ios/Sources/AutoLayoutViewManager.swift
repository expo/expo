import Foundation

@objc(ABI47_0_0AutoLayoutViewManager)
class AutoLayoutViewManager: ABI47_0_0RCTViewManager {
    override func view() -> UIView! {
        return AutoLayoutView()
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
}
