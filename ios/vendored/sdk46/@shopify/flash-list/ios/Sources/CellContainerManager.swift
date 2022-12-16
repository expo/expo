import Foundation

@objc(ABI46_0_0CellContainerManager)
class CellContainerManager: ABI46_0_0RCTViewManager {  
    override func view() -> UIView! {
        return CellContainer()
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
}
