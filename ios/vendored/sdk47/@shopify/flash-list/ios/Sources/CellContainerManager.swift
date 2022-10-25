import Foundation

@objc(ABI47_0_0CellContainerManager)
class CellContainerManager: ABI47_0_0RCTViewManager {  
    override func view() -> UIView! {
        return CellContainer()
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
}
