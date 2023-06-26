import Foundation

@objc(ABI49_0_0CellContainerManager)
class CellContainerManager: ABI49_0_0RCTViewManager {  
    override func view() -> UIView! {
        return CellContainer()
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
}
